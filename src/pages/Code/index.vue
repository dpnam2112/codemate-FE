<template>
  <v-container fluid class="pa-0" style="height: 100vh; overflow: auto;">
    <v-row no-gutters class="fill-height">

      <!-- Problem Description Panel -->
      <div :style="{ width: sidebarWidth + 'px' }" class="resizable-sidebar fill-height">
        <ProblemDescription
          :initial-tab="descriptionTab"
          @update:tab="descriptionTab = $event"
        />
        <div class="resize-handle" @mousedown="startResize" />
      </div>

      <!-- Code Editor Panel -->
      <v-col class="fill-height">
        <div class="d-flex flex-column fill-height">
          <!-- <CodeEditor
            :test-input="testInput"
            @run-result="handleRunResult"
            @submit-result="handleSubmitResult"
            @update:loading="isLoading = $event"
            :style="codeEditorStyle"
          /> -->
          <!-- <CodeEditor
            v-model="code"
            :language="selectedLanguage"
            :style="codeEditorStyle"
          /> -->
          <CodeEditor
            modelValue="// Your code here\n"
            onUpdate:modelValue=fn
            language="javascript"
            @run-result="handleRunResult"
            @submit-result="handleSubmitResult"
            @update:loading="isLoading = $event"
            :testInput="{ nums: [2, 7, 11, 15], target: 9 }"
            :style="codeEditorStyle"
          />
          <Testcase
            :initial-tab="testTab"
            :result="testResult"
            @update:tab="testTab = $event"
            @update:input="testInput = $event"
            @toggle="handleTestcaseToggle"
          />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { DEFAULT_TEST_INPUT } from '@/constants/templateProblem';
import SubmissionListPreview from '@/components/Code/SubmissionListPreview.vue';

// State variables
const descriptionTab = ref('description');
const testTab = ref('testcase');
const testResult = ref('');
const testInput = ref({...DEFAULT_TEST_INPUT});
const isLoading = ref(false);
const testcaseExpanded = ref(true);

// Computed property for dynamic code editor height
const codeEditorStyle = computed(() => {
  return {
    height: testcaseExpanded.value ? '60%' : 'calc(100% - 36px)',
    minHeight: testcaseExpanded.value ? '300px' : '500px',
    maxHeight: testcaseExpanded.value ? 'calc(100vh - 300px)' : 'calc(100vh - 100px)',
    overflow: 'auto',
    transition: 'height 0.2s ease-in-out'
  };
});
const code = ref('// Your code here\n');
const selectedLanguage = ref('javascript');
// Handler methods
const handleRunResult = (result) => {
  testResult.value = result;
  testTab.value = 'result';
  testcaseExpanded.value = true;
};

const handleSubmitResult = (result) => {
  testResult.value = result;
  testTab.value = 'result';
  descriptionTab.value = 'submission';
  testcaseExpanded.value = true;
};

const handleTestcaseToggle = (expanded) => {
  testcaseExpanded.value = expanded;
};

// Prevent body scrolling
onMounted(() => {
});

/*This logic is for sidebar adjustment.*/;
const sidebarWidth = ref(320); // default 320px

const startResize = (e) => {
  const startX = e.clientX;
  const startW = sidebarWidth.value;

  const onMouseMove = (e) => {
    const delta = e.clientX - startX;
    sidebarWidth.value = Math.max(240, startW + delta);
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};
</script>

<style>
html, body {
  overflow: auto;
  height: 100%;
  margin: 0;
  padding: 0;
}

.border-right {
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}

.resizable-sidebar {
  position: relative;
  background-color: #1e1e1e;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
}
</style>
