// useSubmissions.ts
import { ref } from 'vue';
import type { ProgrammingSubmission, ProgrammingSubmissionStat } from '@/types/ProgrammingSubmission';
import { programmingSubmissionService } from '@/services/programmingSubmissionService';

export function useProgrammingSubmissions(useMock: boolean = false) {
  const submissions = ref<ProgrammingSubmissionStat[]>([]);
  const submissionDetails = ref<Record<string, ProgrammingSubmission>>({});

  const fetchSubmissionStats = async (programmingExerciseId: string) => {
    if (useMock) {
      console.log(submissions);
      submissions.value = [
        {
          id: 'mock-1',
          user_id: 'u1',
          exercise_id: 'ex1',
          judge0_language_id: 63,
          status: 'completed',
          passed_testcases: 2,
          total_testcases: 2
        }
      ];
      return;
    }
    const res = await programmingSubmissionService.getSubmissionsOfACodeExercise(programmingExerciseId);
    console.log(res);

    if (res.data != null) {
      console.log(res.data);
      submissions.value = res.data;
    }
  };

  const fetchSubmissionDetail = async (id: string) => {
    if (useMock) {
      submissionDetails.value[id] = {
        id: 'mock-1',
        user_id: 'u1',
        exercise_id: 'ex1',
        judge0_language_id: 63,
        status: 'completed',
        code: 'console.log("hello world")',
        score: 100,
        test_results: [
          {
            id: 't1',
            submission_id: 'mock-1',
            testcase_id: 'tc1',
            judge0_token: 'abc123',
            status: 'Accepted',
            stdout: 'Hello',
            stderr: null,
            time: 0.1,
            memory: 1000,
            testcase: {
              input: 'input 1',
              expected_output: 'Hello',
              is_public: true,
            },
            created_at: new Date(),
            updated_at: new Date()
          }
        ],
        created_at: new Date(),
        updated_at: new Date()
      };
      return submissionDetails.value[id];
    }

    const res = await programmingSubmissionService.getSubmissionDetails(id);
    console.log(res.data);
    return res.data;
  };

  return {
    submissions,
    fetchSubmissionStats,
    fetchSubmissionDetail
  };
}

