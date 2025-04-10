<template>
  <v-container>
    <!-- Submission List -->
    <v-card class="mb-4" elevation="1">
      <v-card-title class="text-subtitle-1 font-weight-bold">Submission History</v-card-title>
      <v-divider></v-divider>
      <v-list density="compact" class="pa-0">
        <v-list-item
          v-for="submission in submissions"
          :key="submission.id"
          class="hoverable-list-item"
        >
          <v-list-item-content>
            <div class="d-flex justify-space-between align-center">
              <div class="d-flex flex-column">
                <div class="text-caption text-grey">{{ formatDate(submission.created_at) }}</div>
                <div class="d-flex align-center">
                  <v-chip
                    :color="getStatusColor(submission.status)"
                    size="x-small"
                    class="me-2"
                    label
                  >
                    {{ submission.status }}
                  </v-chip>
                  <span class="text-body-2">{{ countPassed(submission) }} / {{ submission.test_results.length }} testcases</span>
                </div>
              </div>
              <v-btn icon size="small" variant="text" @click.stop="openModal(submission)">
                <v-icon>mdi-eye</v-icon>
              </v-btn>
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Submission Detail Modal -->
    <v-dialog v-model="dialog" max-width="1000">
      <v-card>
        <v-card-title class="d-flex justify-space-between">
          Submission Details
          <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>

        <v-card-text>
          <v-expansion-panels multiple variant="accordion">
            <!-- Submission Code Panel -->
            <v-expansion-panel title="📄 Submitted Code">
              <v-expansion-panel-text>
                <v-sheet color="grey-darken-4" class="pa-3 rounded">
                  <pre class="code-block">{{ selectedSubmission?.code || '// Code not available' }}</pre>
                </v-sheet>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Public Test Results -->
            <v-expansion-panel
              v-for="(result, index) in visibleTestResults"
              :key="result.id"
              :title="`#${index + 1} - ${result.status}`"
            >
              <v-expansion-panel-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <strong class="text-caption">🧪 Input:</strong>
                    <v-sheet color="grey-darken-3" class="pa-2 rounded mb-2 scroll-box">
                      <pre>{{ result.testcase.input }}</pre>
                    </v-sheet>
                  </v-col>
                  <v-col cols="12" md="6">
                    <strong class="text-caption">🎯 Expected Output:</strong>
                    <v-sheet color="grey-darken-3" class="pa-2 rounded mb-2 scroll-box">
                      <pre>{{ result.testcase.expected_output }}</pre>
                    </v-sheet>
                  </v-col>
                </v-row>

                <strong class="text-caption">📤 Your Output:</strong>
                <v-sheet color="grey-darken-3" class="pa-2 rounded mb-2 scroll-box">
                  <pre>{{ result.stdout }}</pre>
                </v-sheet>

                <div class="text-caption text-grey">
                  ⏱ {{ result.time ?? '-' }}s  📦 {{ result.memory ?? '-' }} KB
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
const { submissions, fetchSubmissionStats, fetchSubmissionDetail } = useSubmissions(mock=true);

// const submissions = ref([
//   {
//     id: '1',
//     created_at: new Date().toISOString(),
//     status: 'completed',
//     code: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n}',
//     test_results: [
//       {
//         id: 't1',
//         status: 'Accepted',
//         stdout: '[0,1]',
//         time: 0.032,
//         memory: 12345,
//         testcase: {
//           input: '2 7 11 15\n9',
//           expected_output: '[0,1]',
//           is_public: true
//         }
//       },
//       {
//         id: 't3',
//         status: 'Accepted',
//         stdout: 'a'.repeat(1000),
//         time: 0.055,
//         memory: 11000,
//         testcase: {
//           input: 'x'.repeat(1000),
//           expected_output: 'b'.repeat(1000),
//           is_public: true
//         }
//       }
//     ]
//   }
// ]);

const dialog = ref(false);
const selectedSubmission = ref(null);
const visibleTestResults = computed(() => {
  return selectedSubmission.value?.test_results.filter(t => t.testcase?.is_public) ?? [];
});

const openModal = async (submission) => {
  const fullData = await fetchSubmissionDetail(submissionStat.id);
  selectedSubmission.value = fullData;
  dialog.value = true;
};

const countPassed = (submission) =>
  submission.test_results.filter(t => t.status === 'Accepted').length;

const formatDate = (date) => new Date(date).toLocaleString();

const getStatusClass = (status) => {
  return status === 'Accepted' ? 'text-success' : 'text-error';
};

const getStatusColor = (status) => {
  return status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'grey';
};
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: monospace;
}
.code-block {
  max-height: 300px;
  overflow: auto;
  white-space: pre;
}
.scroll-box {
  max-height: 240px;
  overflow: auto;
}
.text-success {
  color: #4caf50;
}
.text-error {
  color: #f44336;
}
.hoverable-list-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.hoverable-list-item:hover {
  background-color: #2c2c2c;
}
</style>


