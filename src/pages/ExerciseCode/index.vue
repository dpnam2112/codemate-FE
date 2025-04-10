<template>
  <v-card class="rounded-xl border-card bg-grey-lighten-4" elevation="3">
    <div class="card-header pa-6 d-flex align-center">
      <v-icon color="primary" size="x-large" class="mr-4">mdi-code-tags</v-icon>
      <div>
        <h2 class="text-h5 font-weight-bold">
          {{ data ? 'Edit Exercise: Code' : 'Add Exercise: Code' }}
        </h2>
        <p class="text-subtitle-2 text-medium-emphasis mb-0">
          {{ course ? `Course: [${course.course_nSemester}] ${course.course_name} (${course?.course_courseID}) - [${course.course_class_name}]` : 'Loading course...' }}
        </p>
      </div>
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-close"
        variant="text"
        density="comfortable"
        @click="navigateBack"
      ></v-btn>
    </div>

    <v-divider></v-divider>

    <v-card-text class="pa-6">
      <v-form ref="form" @submit.prevent="handleSubmit">
        <!-- General Section -->
        <GeneralSection v-model:formData="formData" />

        <!-- Timing Section -->
        <TimingSection v-model:formData="formData" />

        <!-- Grade Section -->
        <GradeSection
          v-model:formData="formData"
          :gradingMethodOptions="Object.values(GradingMethodType)"
        />

        <!-- Options Section -->
        <!-- <OptionsSection v-model:formData="formData" /> -->

        <!-- Coding Questions Section -->
        <CodeQuestionsSection
          v-model:questions="formData.questions"
          :difficultyLevels="difficultyLevels"
          :programmingLanguages="programmingLanguages"
        />
      </v-form>
    </v-card-text>

    <v-card-actions class="d-flex justify-end pa-6">
      <v-btn
        variant="outlined"
        prepend-icon="mdi-refresh"
        class="rounded-lg mr-4"
        @click="navigateBack"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        variant="elevated"
        class="rounded-lg"
        prepend-icon="mdi-check-circle"
        @click="handleSubmit"
      >
        {{ data ? 'Update Coding Exercise' : 'Create Coding Exercise' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router';
import { ExerciseCodeRequest, ExerciseCodeResponse } from '@/types/Exercise';
import { GradingMethodType } from "@/utils/commonType";
import { exercisesService } from '@/services/Professor/ExerciseServices';
import { coursesService } from '@/services/Professor/CourseServices';
import { GetCourseDetailProfessorResponse } from "@/types/Course";

interface RouteParams {
  courseId: string;
  exerciseId?: string;
}

const route = useRoute();
const router = useRouter();
const { courseId, exerciseId } = route.params as RouteParams;
const difficultyLevels = ['easy', 'medium', 'hard'];
const programmingLanguages = ['python', 'javascript', 'java', 'c++', 'c#'];
const showError = inject('showError') as (message: string) => void;
const showSuccess = inject('showSuccess') as (message: string) => void;
const form = ref<any>(null);
const data = ref<ExerciseCodeResponse | null>(null);
const course = ref<GetCourseDetailProfessorResponse | null>(null);
const formData = ref<ExerciseCodeRequest>({
  name: '',
  description: '',
  topic: '',
  questions: [{
    question: '',
    testcases: [{
      inputs: [''],
      output: '',
      is_hidden: false,
      description: 'Basic test case'
    }],
    starter_code: '# Your code here',
    solution_code: '# Solution code here',
    hints: [''],
    score: 1,
    difficulty: 'medium',
    allowed_languages: ['python'],
    time_limit_seconds: 5,
    memory_limit_mb: 128
  }],
  max_score: 0,
  type: 'code',
  course_id: courseId,
  time_open: '',
  time_close: '',
  time_limit: 0,
  attempts_allowed: 1,
  grading_method: GradingMethodType.highest,
  shuffle_questions: false,
  shuffle_answers: false,
  review_after_completion: false,
  show_correct_answers: false,
  penalty_per_attempt: 0,
  pass_mark: 0
});

// Function to calculate max score
const calculateMaxScore = () => {
  if (!formData.value.questions || !Array.isArray(formData.value.questions)) {
    formData.value.max_score = 0;
    return;
  }

  const totalScore = formData.value.questions.reduce((sum, question) => {
    const questionScore = Number(question.score) || 0;
    return sum + questionScore;
  }, 0);

  formData.value.max_score = totalScore;
};

// Watch for changes in questions to update max_score
watch(() => formData.value.questions, () => {
  calculateMaxScore();
}, { deep: true, immediate: true });

const navigateBack = () => {
  router.push(`/professor-courselist/courses/${courseId}`);
};

const fetchCourseDetail = async () => {
  try {
    const response = await coursesService.fetchCourseDetail(
      { showError, showSuccess },
      courseId
    );
    if (response && "data" in response && response.data) {
      course.value = response.data as GetCourseDetailProfessorResponse;
    }
  } catch (error) {
    showError('Error loading course details');
  }
};

const fetchExerciseDetails = async () => {
  if (!exerciseId) return;

  try {
    const response = await exercisesService.getExerciseCode({ showError }, exerciseId);
    if (response.isSuccess && response.data) {
      data.value = response.data;
      const exerciseData = response.data;
      const formattedQuestions = exerciseData.questions.map(q => ({
        ...q,
        testcases: q.testcases?.length ? q.testcases : [{
          inputs: [''],
          output: '',
          is_hidden: false,
          description: 'Basic test case'
        }],
        starter_code: q.starter_code || '# Your code here',
        solution_code: q.solution_code || '# Solution code here',
        hints: q.hints || [''],
        score: q.score || 1,
        difficulty: q.difficulty || 'medium',
        allowed_languages: q.allowed_languages?.length ? q.allowed_languages : ['python'],
        time_limit_seconds: q.time_limit_seconds || 5,
        memory_limit_mb: q.memory_limit_mb || 128
      }));
      formData.value = {
        ...formData.value, // Preserve defaults for fields not in response
        name: exerciseData.name,
        description: exerciseData.description || '',
        topic: exerciseData.topic || '',
        questions: formattedQuestions,
        max_score: exerciseData.max_score || 0,
        type: exerciseData.type,
        course_id: exerciseData.course_id,
        time_open: exerciseData.time_open || '',
        time_close: exerciseData.time_close || '',
        time_limit: exerciseData.time_limit || 0,
        attempts_allowed: exerciseData.attempts_allowed || 1,
        grading_method: exerciseData.grading_method || GradingMethodType.highest,
        shuffle_questions: exerciseData.shuffle_questions || false,
        shuffle_answers: exerciseData.shuffle_answers || false,
        review_after_completion: exerciseData.review_after_completion || false,
        show_correct_answers: exerciseData.show_correct_answers || false,
        penalty_per_attempt: exerciseData.penalty_per_attempt || 0,
        pass_mark: exerciseData.pass_mark || 0
      };

      // Calculate max score after loading the data
      calculateMaxScore();
    }
  } catch (error) {
    showError('Error loading exercise data');
  }
};

onMounted(async () => {
  await fetchCourseDetail();
  await fetchExerciseDetails();
});

const handleSubmit = async () => {
  if (!form.value?.validate()) {
    showError('Please check the form for errors');
    return;
  }

  // Ensure max_score is up-to-date before submission
  calculateMaxScore();

  try {
    if (exerciseId) {
      const response = await exercisesService.editExerciseCode(
        { showError, showSuccess },
        exerciseId,
        formData.value
      );
      if (response.isSuccess) {
        showSuccess('Coding exercise updated successfully');
        navigateBack();
      }
    } else {
      console.log('Creating exercise', formData.value);
      const response = await exercisesService.postExerciseCode(
        { showError, showSuccess },
        formData.value
      );
      if (response) {
        showSuccess('Coding exercise created successfully');
        navigateBack();
      }
    }
  } catch (error) {
    showError('Failed to save coding exercise');
  }
};
</script>
