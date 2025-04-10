<template>
  <v-sheet class="d-flex flex-column overflow-hidden h-70">
    <!-- Language selector and actions -->
    <v-toolbar dense color="grey-darken-4">
      <v-select
        v-model="selectedLanguage"
        :items="Object.keys(JUDGE0_LANG).map(Number)"
        :item-title="(id) => JUDGE0_LANG[id]"
        :item-value="(id) => id"
        density="compact"
        hide-details
        class="language-select"
        bg-color="grey-darken-3"
        width="150"
      ></v-select>
      <v-spacer></v-spacer>
      <v-btn variant="tonal" color="warning" class="mr-2" @click="giveHints" :loading="isGettingHints">Give Hints</v-btn>
      <v-btn variant="tonal" color="info" class="mr-2" @click="explainCode" :loading="isExplaining">Explain Code</v-btn>
      <v-btn variant="tonal" color="success" class="mr-2" @click="runCode" :loading="isLoading">Run</v-btn>
      <v-btn variant="tonal" color="primary" @click="submitCode" :loading="isLoading">Submit</v-btn>
    </v-toolbar>

    <!-- CodeMirror Editor -->
    <div class="flex-grow-1 overflow-hidden">
      <div ref="editorContainer" class="editor-container"></div>
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLineGutter, hoverTooltip } from '@codemirror/view';
import { CodeExerciseService } from '@/services/CodeExerciseService';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentUnit } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { lintGutter } from '@codemirror/lint';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { LANGUAGES, LANGUAGE_MAP, DEFAULT_CODE } from '@/constants/templateLanguage';
import { createSubmission, pollSubmission, prepareStdin } from '@/services/Professor/judge0api';
import { llmCodeServices } from '@/services/llmCodeServices';
import { TestInput, LineExplanation, CodeAnalysisRequest, LanguageKey } from '@/types/LLM_code';
import { LanguageConfigDto } from '@/types/CodingExercise';
import { JUDGE0_LANG } from '@/constants/judge0_lang';

// Define types for hints
interface LineHint {
  line: number;
  hint: string;
}

// Define props
const props = defineProps<{
  testInput: TestInput;
}>();

const route = useRoute();
const exerciseId = computed(() => route.params.exerciseId as string);

const emit = defineEmits<{
  (e: 'run-result', result: string): void;
  (e: 'submit-result', result: string): void;
  (e: 'update:loading', isLoading: boolean): void;
}>();

const selectedLanguage = ref<number>(54);
const code = ref<string>(DEFAULT_CODE[selectedLanguage.value]);
const editorContainer = ref<HTMLElement | null>(null);
const languages = ref(LANGUAGES);
const isLoading = ref<boolean>(false);
const isExplaining = ref<boolean>(false);
const isGettingHints = ref<boolean>(false);
const lineExplanations = ref<LineExplanation[]>([]);
const showError = inject("showError") as (message: string) => void;
const showSuccess = inject("showSuccess") as (message: string) => void;
const languageConfigs = ref<LanguageConfigDto[]>([]);

let editor: EditorView | null = null;

// Create a basic setup configuration since there's no basicSetup in CM6
const createBasicSetup = () => [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  keymap.of([
    ...defaultKeymap,
    ...historyKeymap,
    ...closeBracketsKeymap
  ]),
  foldGutter(),
  indentUnit.of("  ")
];

// Language mapping for CodeMirror with proper typing
const cmLanguages: Record<number, any> = {
  54: cpp(),     // C++
  62: java(),    // Java
  63: javascript(), // JavaScript
  71: python(),  // Python3
};

// Create hover tooltip handler based on line explanations
const createLineExplanationTooltip = () => {
  return hoverTooltip((view, pos) => {
    if (lineExplanations.value.length === 0) return null;

    // Get line number at position
    const line = view.state.doc.lineAt(pos);
    const lineNumber = line.number;

    // Find explanation for this line
    const explanation = lineExplanations.value.find(exp => exp.line === lineNumber);
    if (!explanation) return null;

    return {
      pos: line.from,
      end: line.to,
      above: true,
      create(view) {
        const dom = document.createElement('div');
        dom.className = 'cm-tooltip-explanation';
        dom.textContent = explanation.explanation;
        return { dom };
      }
    };
  });
};

// Create a dark theme
const darkTheme = EditorView.theme({
  "&": {
    backgroundColor: "#1e1e1e",
    color: "#ddd"
  },
  ".cm-content": {
    caretColor: "#0e9"
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#0e9"
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "#074"
  },
  ".cm-gutters": {
    backgroundColor: "#1e1e1e",
    color: "#8f8f8f",
    border: "none"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#222"
  },
  ".cm-hint-line": {
    backgroundColor: "rgba(255, 217, 0, 0.1)"
  }
}, { dark: true });

// Initialize editor
const initEditor = (): void => {
  if (!editorContainer.value) return;

  // Clean up previous instance if it exists
  if (editor) {
    editor.destroy();
  }

  const languageSupport = cmLanguages[selectedLanguage.value];

  const startState = EditorState.create({
    doc: code.value,
    extensions: [
      ...createBasicSetup(),
      darkTheme,
      languageSupport,
      lintGutter(),
      createLineExplanationTooltip(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          code.value = update.state.doc.toString();
          // Clear explanations when code changes
          lineExplanations.value = [];
        }
      })
    ]
  });

  editor = new EditorView({
    state: startState,
    parent: editorContainer.value
  });
};

// Function to get comment syntax for different languages
const getCommentSyntax = (language: LanguageKey): { start: string, end: string } => {
  switch (language) {
    case 'cpp':
      return { start: '// HINT: ', end: '' };
    case 'java':
      return { start: '// HINT: ', end: '' };
    case 'python':
      return { start: '# HINT: ', end: '' };
    default:
      return { start: '// HINT: ', end: '' };
  }
};

// Function to insert hints directly into the code
const insertHintsIntoCode = (originalCode: string, hints: LineHint[], language: LanguageKey): string => {
  const commentSyntax = getCommentSyntax(language);
  const lines = originalCode.split('\n');

  // Sort hints by line number in descending order to avoid position shifts
  const sortedHints = [...hints].sort((a, b) => b.line - a.line);

  for (const hint of sortedHints) {
    // Make sure the line index exists in the array
    if (hint.line > 0 && hint.line <= lines.length) {
      const hintComment = `${commentSyntax.start}${hint.hint}${commentSyntax.end}`;

      // Insert hint comment before the code line
      lines.splice(hint.line - 1, 0, hintComment);
    }
  }

  return lines.join('\n');
};

// New function to get hints and add them to the code
const giveHints = async (): Promise<void> => {
  try {
    isGettingHints.value = true;

    // Mock data - in production this would be an API call
    const mockHintsData: LineHint[] = [
      { line: 2, hint: "Consider initializing variables here" },
      { line: 5, hint: "This is where you'll need to iterate through the array" },
      { line: 10, hint: "Don't forget to check for edge cases" },
      { line: 15, hint: "Remember to return the correct indices" }
    ];

    // const response = await ApiService.getHints({
    //   code: code.value,
    //   language: selectedLanguage.value
    // });
    // const hints = response.data;

    // Insert hints directly into the code
    const codeWithHints = insertHintsIntoCode(code.value, mockHintsData, selectedLanguage.value);

    // Update the code with hints included
    code.value = codeWithHints;

    // Reinitialize editor to show updated code
    nextTick(() => {
      initEditor();
      showSuccess("Hints have been added to your code as comments.");
    });

  } catch (error) {
    console.error('Error getting code hints:', error);
    showError('Failed to add hints to your code');
  } finally {
    isGettingHints.value = false;
  }
};

// Get code explanations using the llmCodeServices
const explainCode = async (): Promise<void> => {
  try {
    isExplaining.value = true;

    // Clear previous explanations
    lineExplanations.value = [];

    // Prepare request payload
    const codeAnalysisRequest: CodeAnalysisRequest = {
      code: code.value,
      language: selectedLanguage.value
    };

    // Call the service to get explanations
    const response = await llmCodeServices.getCodeExplanation(
      { showError, showSuccess },
      codeAnalysisRequest
    );

    // Process the response
    if (response.data && Array.isArray(response.data)) {
      lineExplanations.value = response.data;

      // Reinitialize editor to apply new tooltips
      nextTick(() => {
        initEditor();
      });
    }
  } catch (error) {
    console.error('Error getting code explanations:', error);
  } finally {
    isExplaining.value = false;
  }
};

// Run code with test case
const runCode = async (): Promise<void> => {
  try {
    isLoading.value = true;
    emit('update:loading', true);

    // Prepare stdin
    const stdin = prepareStdin(
      selectedLanguage.value,
      props.testInput.nums,
      props.testInput.target
    );

    try {
      // Create submission
      const token = await createSubmission(
        code.value,
        LANGUAGE_MAP[selectedLanguage.value],
        stdin,
        '[0,1]'
      );

      // Poll for results
      const result = await pollSubmission(token);

      // Format and emit results
      let resultText = '';
      if (result.status.id === 3) { // Accepted
        resultText = `Status: ${result.status.description}\n`;
        resultText += `Output: ${result.stdout || 'No output'}\n`;
        resultText += `Time: ${result.time} seconds\n`;
        resultText += `Memory: ${result.memory} KB`;
      } else {
        resultText = `Status: ${result.status.description}\n`;
        if (result.stderr) {
          resultText += `Error: ${result.stderr}\n`;
        }
        if (result.compile_output) {
          resultText += `Compiler output: ${result.compile_output}\n`;
        }
      }

      emit('run-result', resultText);
    } catch (apiError: any) {
      // Handle API errors
      if (apiError.response) {
        // Server returned an error with status code
        const errorData = apiError.response.data;
        let detailedError = `Error (${apiError.response.status}): `;

        if (errorData && typeof errorData === 'object') {
          if (errorData.error) {
            detailedError += errorData.error;
          } else if (errorData.message) {
            detailedError += errorData.message;
          } else {
            detailedError += JSON.stringify(errorData);
          }
        } else if (typeof errorData === 'string') {
          detailedError += errorData;
        } else {
          detailedError += 'Unknown error format';
        }

        emit('run-result', detailedError);
      } else if (apiError.request) {
        // Request was sent but no response received
        emit('run-result', 'Error: No response received from server');
      } else {
        // Other errors when setting up the request
        emit('run-result', `Error setting up request: ${apiError.message}`);
      }
    }
  } catch (error: any) {
    emit('run-result', `Error running code: ${error.message}`);
  } finally {
    isLoading.value = false;
    emit('update:loading', false);
  }
};

// // Submit code with similar logic as runCode
// const submitCode = async (): Promise<void> => {
//   try {
//     isLoading.value = true;
//     emit('update:loading', true);
//
//     // Prepare stdin
//     const stdin = prepareStdin(
//       selectedLanguage.value,
//       props.testInput.nums,
//       props.testInput.target
//     );
//
//     try {
//       // Create submission
//       const token = await createSubmission(
//         code.value,
//         LANGUAGE_MAP[selectedLanguage.value],
//         stdin,
//         '[0,1]'
//       );
//
//       // Poll for results
//       const result = await pollSubmission(token);
//
//       // Format and emit results
//       let resultText = '';
//       if (result.status.id === 3 && result.stdout && result.stdout.trim() === '[0,1]') {
//         resultText = `
// ✅ Solution Accepted!
// Your solution passed all test cases.
//
// Test Result:
// Input: nums = ${props.testInput.nums}, target = ${props.testInput.target}
// Expected Output: [0,1]
// Your Output: ${result.stdout.trim()}
// Time: ${result.time} seconds
// Memory: ${result.memory} KB
//         `;
//       } else {
//         resultText = `
// ❌ Solution Failed!
// Your solution did not pass all test cases.
//
// Test Result:
// Input: nums = ${props.testInput.nums}, target = ${props.testInput.target}
// Expected Output: [0,1]
// Your Output: ${result.stdout || 'No output'}
// Status: ${result.status.description}
// ${result.stderr ? 'Error: ' + result.stderr + '\n' : ''}
// ${result.compile_output ? 'Compiler output: ' + result.compile_output + '\n' : ''}
//         `;
//       }
//
//       emit('submit-result', resultText);
//     } catch (apiError: any) {
//       // Handle API errors
//       if (apiError.response) {
//         // Server returned an error with status code
//         const errorData = apiError.response.data;
//         let detailedError = `Error (${apiError.response.status}): `;
//
//         if (errorData && typeof errorData === 'object') {
//           if (errorData.error) {
//             detailedError += errorData.error;
//           } else if (errorData.message) {
//             detailedError += errorData.message;
//           } else {
//             detailedError += JSON.stringify(errorData);
//           }
//         } else if (typeof errorData === 'string') {
//           detailedError += errorData;
//         } else {
//           detailedError += 'Unknown error format';
//         }
//
//         emit('submit-result', detailedError);
//       } else if (apiError.request) {
//         // Request was sent but no response received
//         emit('submit-result', 'Error: No response received from server');
//       } else {
//         // Other errors when setting up the request
//         emit('submit-result', `Error setting up request: ${apiError.message}`);
//       }
//     }
//   } catch (error: any) {
//     emit('submit-result', `Error submitting code: ${error.message}`);
//   } finally {
//     isLoading.value = false;
//     emit('update:loading', false);
//   }
// };

const submitCode = async (): Promise<void> => {
  // Print out the code to be submitted
  console.log('Code to be submitted:', code.value);
}


// Initialize editor when component is mounted
onMounted(() => {
  initEditor();
});

// Fetch language configurations for the coding exercise
onMounted(async () => {
  let response = await CodeExerciseService.getLanguageConfigsOfAnExercise(
    exerciseId.value, {showError: () => {}, showSuccess: () => {}}
  );

  languageConfigs.value = response.data;

  const config = languageConfigs.value.find(c => c.judge0_language_id === selectedLanguage.value);
  if (config) {
    code.value = config.boilerplate_code;
    nextTick(() => initEditor());
  } else {
    code.value = '// No boilerplate code available';
  }
})

// Clean up when component is unmounted
onUnmounted(() => {
  if (editor) {
    editor.destroy();
    editor = null;
  }
});

// Watch for language changes
watch(selectedLanguage, (id) => {
  // Update boilerplate code based on selected language
  const config = languageConfigs.value.find(c => c.judge0_language_id === id);
  code.value = config?.boilerplate_code || '// No boilerplate code available';
  nextTick(() => initEditor());
  lineExplanations.value = [];
});

// Watch for external code changes
watch(code, (newCode) => {
  if (!editor) return;

  const currentValue = editor.state.doc.toString();
  if (newCode !== currentValue) {
    editor.dispatch({
      changes: { from: 0, to: currentValue.length, insert: newCode }
    });
  }
});
</script>
<style>
.editor-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: #1e1e1e;
}

.language-select {
  width: 150px;
}

/* Custom tooltip styling */
.cm-tooltip-explanation {
  background-color: #2d2d2d;
  color: #eee;
  border: 1px solid #444;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 14px;
  max-width: 300px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}
</style>
