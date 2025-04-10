/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from "vue-router";
import { setupLayouts } from "virtual:generated-layouts";
import { routes as autoRoutes } from "vue-router/auto-routes";
import { usersService } from "@/services/usersServices";
import { navigationGuard } from "./navigationGuard";

const LoginRoute = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/layouts/login.vue"),
    meta: { requiresAuth: false },
    children: [
      {
        path: "",
        name: "LoginPage",
        component: () => import("@/pages/Login/index.vue"),
        meta: { requiresAuth: false },
      },
      {
        path: "/forgot-password",
        name: "ForgotPassword",
        component: () => import("@/pages/Login/ForgotPassword.vue"),
        meta: { requiresAuth: false },
      },
      {
        path: "/reset-password",
        name: "ResetPassword",
        component: () => import("@/pages/Login/ResetPassword.vue"),
        meta: { requiresAuth: false },
      },
    ],
  },
  {
    path: "/",
    name: "LandingPage",
    component: () => import("@/pages/index.vue"),
    meta: { requiresAuth: false },
  },
];
const StudentRoutes = [
  {
    path: "/dashboard",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "Dashboard",
      component: () => import("@/pages/Dashboard/index.vue"),
      meta: { requiresAuth: true, role: "student" },
    }],
  },


  {
    path: "/progress-tracking/:courseId",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "ProgressTracking",
      component: () => import("@/pages/ProgressTracking/index.vue"),
      meta: { requiresAuth: true, role: "student" },
    }],
  },
  {
    path: "/courselist",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "CourseList",
      component: () => import("@/pages/Course/CourseList/index.vue"),
      meta: { requiresAuth: true, role: "student" },
    }],
  },

  {
    path: "/courselist/course/:id",
    name: "CourseDetail",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "CourseDetailChild",
      component: () => import("@/pages/Course/CourseDetail/index.vue"),
      props: true,
      meta: { requiresAuth: true, role: "student" },
    }]
  },
  {
    path: "/exercise-code/:exerciseId?",
    name: "PracticeCoding",
    component: () => import("@/pages/Code/index.vue"),
    meta: { requiresAuth: true, role: "student" },
  },

  {
    path: "/lessonRecommend/:lessonId",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "Lesson",
      component: () => import("@/pages/Lesson/index.vue"),
      props: true,
      meta: { requiresAuth: true, role: "student" },
      children: [
        {
          path: "",
          name: "LessonRecommend",
          component: () => import("@/pages/Lesson/LessonRecommend/index.vue"),
          props: true,
          meta: { requiresAuth: true, role: "student" },
        },
        {
          path: "Module/:moduleId/Quiz",
          name: "LessonRecommendQuiz",
          component: () => import("@/pages/Lesson/Quiz/index.vue"),
          props: true,
          meta: { requiresAuth: true, role: "student" },
        },
        {
          path: "Module/:moduleId/Quiz/:quizId",
          name: "LessonRecommendDoQuiz",
          component: () => import("@/pages/Lesson/DoQuiz/index.vue"),
          props: true,
          meta: { requiresAuth: true, role: "student" },
        },
        {
          path: "Module/:moduleId/Quiz/:quizId",
          name: "LessonRecommendDoQuiz",
          component: () => import("@/pages/Lesson/DoQuiz/index.vue"),
          props: true,
          meta: { requiresAuth: true, role: "student" },
        },
        {
          path: "Module/:moduleId/Code",
          name: "LessonRecommendCode",
          component: () => import("@/pages/Lesson/Code/index.vue"),
          props: true,
          meta: { requiresAuth: true, role: "student" },
        },
        // {
        //   path: "Module/:moduleId/Document",
        //   name: "LessonRecommendDocument",
        //   component: () => import("@/pages/Lesson/Document/index.vue"),
        //   props: true,
        //   meta: { requiresAuth: true, role: "student" },
        // },
      ],
    }],
  },
];

const AdminRoutes = [
  {
    path: "/admin-dashboard",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "AdminDashboard",
      component: () => import("@/pages/Dashboard/Admin.vue"),
      meta: { requiresAuth: true, role: "admin" },
    }],
  },
  {
    path: "/feedback-management",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "FeedbackManagement",
      component: () => import("@/pages/FeedbackManagement/index.vue"),
      meta: { requiresAuth: true, role: "admin" },
    }],
  },
  {
    path: "/user-management",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "UserManagement",
      component: () => import("@/pages/UserManagement/index.vue"),
      meta: { requiresAuth: true, role: "admin" },
    }],
  },
  {
    path: "/course-management",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "CourseManagement",
      component: () => import("@/pages/CourseManagement/index.vue"),
      meta: { requiresAuth: true, role: "admin" },
    }],
  },
  {
    path: "/add-course",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "AddCourse",
      component: () => import("@/pages/CourseManagement/AddCourse.vue"),
      meta: { requiresAuth: true, role: "admin" },
    }],
  },
  {
    path: "/add-user",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "AddUser",
      component: () => import("@/pages/UserManagement/AddUser.vue"),
      meta: { requiresAuth: true, role: "admin" },
    }],
  },
  // {
  //   path: "/feedback-statistics",
  //   component: () => import("@/layouts/default.vue"),
  //   children: [{
  //     path: "",
  //     name: "FeedbackStatistics",
  //     component: () => import("@/pages/FeedbackManagement/FeedbackStatistics.vue"),
  //     meta: { requiresAuth: true, role: "admin" },
  //   }],
  // },
  // {
  //   path: "/system-usage-statistics",
  //   component: () => import("@/layouts/default.vue"),
  //   children: [{
  //     path: "",
  //     name: "SystemUsageStatistics",
  //     component: () => import("@/pages/SystemUsageManagement/index.vue"),
  //     meta: { requiresAuth: true, role: "admin" },
  //   }],
  // }
];

const ProfessorRoutes = [
  {
    path: "/professor-dashboard",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "ProfessorDashboard",
      component: () => import("@/pages/Dashboard/Professor.vue"),
      meta: { requiresAuth: true, role: "professor" },
    }],
  },
  {
    path: "/professor-courselist",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "ProfessorCourseList",
      component: () => import("@/pages/Course/CourseList/Professor.vue"),
      meta: { requiresAuth: true, role: "professor" },
    }],
  },
  {
    path: "/professor-courselist/courses/:id",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "ProfessorCourseDetail",
      component: () => import("@/pages/Course/CourseDetail/Professor.vue"),
      props: true,
      meta: { requiresAuth: true, role: "professor" },
    }],
  },
  {
    path: "/professor-feedback",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "ProfessorFeedback",
      component: () => import("@/pages/FeedbackManagement/Professor.vue"),
      meta: { requiresAuth: true, role: "professor" },
    }],
  },
  {
    path: "/professor-progress",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "ProfessorProgress",
      component: () => import("@/pages/ProgressTracking/Professor.vue"),
      meta: { requiresAuth: true, role: "professor" },
    }],
  },
  {
    path: "/professor-code",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "ProfessorCode",
      component: () => import("@/pages/Code/index.vue"),
      meta: { requiresAuth: false, role: "professor" },
    }],
  },
  {
    path: "/professor-schedule",
    component: () => import("@/layouts/default.vue"),
    children: [{
      path: "",
      name: "ProfessorSchedule",
      component: () => import("@/pages/Schedule/Professor.vue"),
      meta: { requiresAuth: true, role: "professor" },
    }],
  },
  // {
  //   path: "/professor-schedule",
  //   name: "ProfessorSchedule",
  //   component: () => import("@/pages/Schedule/Professor.vue"),
  //   meta: { requiresAuth: true, role: "professor" },
  // },
  {
    path: "/courses/:courseId/exercise-quiz/:exerciseId?",
    name: "ExerciseQuiz",
    component: () => import("@/pages/ExerciseQuiz/index.vue"),
    meta: { requiresAuth: true, role: "professor" },
  },
  {
    path: "/courses/:courseId/exercise-code/:exerciseId?",
    name: "ExerciseCode",
    component: () => import("@/pages/ExerciseCode/index.vue"),
    meta: { requiresAuth: true, role: "professor" },
  },
];

const ProfileRoute = {
  path: "/profile",
  component: () => import("@/layouts/default.vue"),
  children: [{
    path: "",
    name: "Profile",
    component: () => import("@/pages/Profile/index.vue"),
    props: (route: { query: { email: string; role: string; }; }) => ({ email: route.query.email, role: route.query.role }),
    meta: { requiresAuth: true },
  }],
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...LoginRoute,
    ...StudentRoutes,
    ...AdminRoutes,
    ...ProfessorRoutes,
    ProfileRoute,

    ...setupLayouts([...autoRoutes]),
  ],
});


router.beforeEach(navigationGuard);
router.onError((err, to) => {
  if (err?.message?.includes?.("Failed to fetch dynamically imported module")) {
    if (!localStorage.getItem("vuetify:dynamic-reload")) {
      console.log("Reloading page to fix dynamic import error");
      localStorage.setItem("vuetify:dynamic-reload", "true");
      location.assign(to.fullPath);
    } else {
      console.error("Dynamic import error, reloading page did not fix it", err);
    }
  } else {
    console.error(err);
  }
});

router.isReady().then(() => {
  localStorage.removeItem("vuetify:dynamic-reload");
});

export default router;
