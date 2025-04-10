<template>
  <v-sheet class="d-flex flex-column" style="height: 100vh; overflow: hidden;">
    <v-tabs v-model="descriptionTab" bg-color="grey-darken-4">
      <v-tab value="description">Description</v-tab>
      <v-tab value="submission">Submission</v-tab>
      <v-tab value="coding-assistant">Coding assistant</v-tab>
    </v-tabs>

    <v-card-text v-if="descriptionTab === 'description'" class="problem-description pa-4 flex-grow-1 overflow-y-auto">

      <div v-html="problemDescription"></div>

      <div v-for="(example, index) in examples" :key="index" class="examples mt-4">
        <h3>{{ example.title }}</h3>
        <v-sheet color="grey-darken-3" class="pa-2 rounded">
          <p><strong>Input:</strong> nums = {{ example.input.nums }}, target = {{ example.input.target }}</p>
          <p><strong>Output:</strong> {{ example.output }}</p>
          <p v-if="example.explanation"><strong>Explanation:</strong> {{ example.explanation }}</p>
        </v-sheet>
      </div>

      <div class="constraints mt-4">
        <h3>Constraints:</h3>
        <ul>
          <li v-for="(constraint, index) in constraints" :key="index">{{ constraint }}</li>
        </ul>
      </div>
    </v-card-text>
    <v-card-text v-else-if="descriptionTab === 'submission'" class="pa-4">
      <SubmissionList :programmingExerciseId="exerciseId" :submissions="submissions" />
    </v-card-text>

    <v-card-text v-else class="chat-container d-flex flex-column flex-grow-1 pa-0">

    <div
      class="chat-messages-container flex-grow-1 overflow-y-auto px-4 py-2"
      ref="chatContainer"
    >
      <!-- Existing messages -->
      <div v-for="(message, index) in messages" :key="index" class="chat-line">
        <div class="sender" :class="message.role">
          {{ message.role === 'user' ? 'You' : 'Codemate Assistant' }}
        </div>

        <div
          class="message-content"
          v-if="message.role === 'assistant'"
          v-html="renderMarkdown(message.content)"
        ></div>

        <span
          class="message-content"
          v-else
        >{{ message.content }}</span>
      </div>

      <!-- Streaming buffer (AI is typing) -->
      <div v-if="streamingBuffer" class="chat-line">
        <span class="sender assistant">Codemate Assistant</span>
        <div
          class="message-content"
          v-html="renderMarkdown(streamingBuffer)"
        ></div>
      </div>

      <!-- Thinking indicator -->
      <div v-if="isThinking" class="chat-line">
        <span class="sender assistant">Codemate Assistant</span>
        <div class="message-content">
          Thinking<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
        </div>
      </div>

      <div ref="chatBottom"></div>
    </div>


    <div class="chat-input d-flex align-center pa-2 rounded-lg">
      <v-text-field
        v-model="inputMessage"
        placeholder="Ask Codemate assistant..."
        variant="solo"
        density="comfortable"
        hide-details
        bg-color="grey-darken-3"
        color="grey-lighten-2"
        class="flex-grow-1"
        rounded
        :style="{ color: '#fff' }"
        @keydown.enter="sendMessage"
      />

      <v-btn
        @click="sendMessage"
        icon
        color="primary"
        variant="flat"
        class="ml-2"
      >
        <v-icon>mdi-send</v-icon>
      </v-btn>
    </div>

    </v-card-text>

  </v-sheet>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { PROBLEM_DESCRIPTION, PROBLEM_EXAMPLES, PROBLEM_CONSTRAINTS } from '@/constants/templateProblem';
import { streamFromApi } from '@/common/api.service.ts';
import { useRoute } from 'vue-router';
import { llmCodeServices } from '@/services/llmCodeServices';
import { CodeExerciseService } from '@/services/CodeExerciseService';
import type { ChatMessage } from '@/types/chat';
import SubmissionList from '@/components/Code/SubmissionList.vue';
import axios from 'axios';

const route = useRoute();
const exerciseId = computed(() => route.params.exerciseId as string);

import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return `<pre class="hljs"><code>${hljs.highlight(code, { language: lang }).value}</code></pre>`;
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`;v
  }
});

interface ProblemExample {
  title: string;
  input: {
    nums: string;
    target: string;

  };
  output: string;
  explanation?: string;
}

interface ProblemDescriptionProps {
  initialTab?: string;
}

const props = withDefaults(defineProps<ProblemDescriptionProps>(), {
  initialTab: 'description'
});

const emit = defineEmits<{
  (e: 'update:tab', tab: string): void;
}>();

const descriptionTab = ref<string>(props.initialTab);
// const problemDescription = ref<string>(PROBLEM_DESCRIPTION);
// const examples = ref<ProblemExample[]>(PROBLEM_EXAMPLES);
// const constraints = ref<string[]>(PROBLEM_CONSTRAINTS);

// Watch for tab changes and emit event
// watch(descriptionTab, (newValue) => {
//   emit('update:tab', newValue);
// });

const messages = ref<ChatMessage[]>([]);

watch(descriptionTab, async (newValue) => {
  emit('update:tab', newValue);
  if (newValue === 'coding-assistant' && messages.value.length === 0) {
    try {
      const res = await llmCodeServices.getMessageHistory({ showError: true, showSuccess: false }, exerciseId.value);
      console.log(res);
      messages.value = res.data;
      nextTick(scrollToBottom);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  }
});

const inputMessage = ref('');

function renderMarkdown(text: string) {
  return md.render(text);
}

const isThinking = ref(false);
const streamingBuffer = ref('');

async function sendMessage() {
  const content = inputMessage.value.trim();
  if (!content) return;

  // Add user's message and clear input
  messages.value.push({ role: 'user', content });
  inputMessage.value = '';
  scrollToBottom();

  // Show thinking indicator
  isThinking.value = true;
  streamingBuffer.value = '';

  // Extract the exerciseId from the route parameters
  const exerciseId = route.params.exerciseId;
  const url = `exercises/code/${exerciseId}/conversation:invokeAssistant`;

  try {
    // Call the streamFromApi function. This will handle chunked responses.
    await streamFromApi(
      url,
      (chunk: string) => {
        streamingBuffer.value += chunk;
        scrollToBottom();
      },
      {
        method: "POST",
        body: {
          content: content,
          user_solution: "" // Pass along any existing user solution if needed.
        }
      }
    );
    // After the stream is complete, add the full response as an assistant message.
    messages.value.push({ role: 'assistant', content: streamingBuffer.value });
  } catch (error) {
    // Handle any errors from the API call.
    messages.value.push({
      role: 'assistant',
      content: "An error occurred while fetching the response. Please try again."
    });
    console.error("Error invoking API:", error);
  } finally {
    // Clear indicators regardless of success or failure.
    isThinking.value = false;
    streamingBuffer.value = '';
    scrollToBottom();
  }
}
const chatBottom = ref<null | HTMLElement>(null);

const chatContainer = ref<null | HTMLElement>(null);

function scrollToBottom() {
  nextTick(() => {
    const container = chatContainer.value;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
}

interface ExerciseCodeResponseForStudent {
  question: string;
  difficulty: string;
  tags: string[];
  examples: ProblemExample[];
  constraints: string[];
}

const difficulty = ref('');
const tags = ref<string[]>([]);
const problemDescription = ref('');
const examples = ref<ProblemExample[]>([]);
const constraints = ref<string[]>([]);

console.log('Exercise ID:', exerciseId.value);

onMounted(async () => {
  try {
    const response = await axios.get<ExerciseCodeResponseForStudent>(
      `exercises/${exerciseId.value}/code`
    );

    let responseBody = response.data;
    const questionObject = responseBody.data["questions"][0];

    problemDescription.value = questionObject.question;
    difficulty.value = questionObject.difficulty;
    tags.value = questionObject.tags;
    examples.value = questionObject.examples;
    constraints.value = questionObject.constraints;
  } catch (err) {
    console.error('Failed to load exercise', err);
  }
});
</script>

<style scoped>
.problem-description {
  overflow-y: auto;
}

.chat-container {
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

.chat-messages-container {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow-y: auto;
  min-height: 0;
  max-height: 100%;
}

.chat-messages {
  display: flex;
  flex-direction: column;
}

.chat-line {
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #333;
}

.chat-line:last-child {
  border-bottom: none;
}

.sender {
  font-size: 0.75rem;
  font-weight: bold;
  color: #888;
  margin-bottom: 2px;
}

.sender.user {
  color: #4fc3f7; /* Blue for user */
}

.sender.assistant {
  color: #81c784; /* Green for assistant */
}

.message-content pre {
  background-color: #2d2d2d;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin-top: 8px;
}

.message-content code {
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  color: #ccc;
}

.dot {
  animation: blink 1s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}
.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 20% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

.chat-messages-container::-webkit-scrollbar {
  width: 8px;
}

.chat-messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages-container::-webkit-scrollbar-thumb {
  background-color: #555;
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
  transition: background-color 0.3s;
}

.chat-messages-container::-webkit-scrollbar-thumb:hover {
  background-color: #888;
}
</style>


