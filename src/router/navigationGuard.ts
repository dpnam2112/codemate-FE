import { NavigationGuardWithThis } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import ApiService from "@/common/api.service";
import { usersService } from "@/services/usersServices";
import { PUBLIC_ROUTES } from "@/common/api.service";

const getUserInfo = async () => {
  try {
    const response = await usersService.getProfile({
      showError: (message: string) => {
        console.error("Profile fetch error:", message);
      },
      showSuccess: () => {},
    });
    console.log("User info fetched:", response?.data);
    return response?.data || null;
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    return null;
  }
};

export const navigationGuard: NavigationGuardWithThis<any> = async (to, from, next) => {
  // Use Zustand getState to access store methods and state
  const { user, isAuthenticated, logout } = useAuthStore.getState();
  const accessToken = ApiService.getToken();
  const refreshToken = ApiService.getRefreshToken();
  const isToPublic = PUBLIC_ROUTES.includes(to.path);
  const isFromPublic = PUBLIC_ROUTES.includes(from.path);
  const rememberMe = localStorage.getItem("rememberMe") === "true";

  console.group("Navigation Guard Debug");
  console.log("To Path:", to.path);
  console.log("From Path:", from.path);
  console.log("Access Token:", !!accessToken);
  console.log("Refresh Token:", !!refreshToken);
  console.log("Is To Public:", isToPublic);
  console.log("Is From Public:", isFromPublic);
  console.log("Is Authenticated:", isAuthenticated);
  console.log("User Role:", user?.role);
  console.log("Remember Me:", rememberMe);
  console.groupEnd();

  if (to.path === from.path) {
    return next();
  }

  if (isToPublic && isFromPublic) {
    return next();
  }

  // Only proceed with auth checks if rememberMe is true
  if (!rememberMe) {
    return next();
  }

  try {
    if (!accessToken && !refreshToken) {
      console.warn("No tokens found. Redirecting to login.");
      if (!isToPublic) {
        sessionStorage.setItem("redirectUrl", to.fullPath);
        return next("/login");
      }
      return next();
    }

    if (ApiService.checkTokenExpiration()) {
      console.log("Token expired. Attempting refresh...");
      const refreshed = await ApiService.refreshToken();
      if (!refreshed) {
        console.warn("Token refresh failed.");
        logout();
        sessionStorage.setItem("redirectUrl", to.fullPath);
        return next("/login");
      }
    }

    if (!isAuthenticated) {
      console.log("Not authenticated. Fetching user info...");
      const userInfo = await getUserInfo();
      if (userInfo) {
        useAuthStore.getState().setUser({
          role: userInfo.role,
          email: userInfo.email,
          name: userInfo.name,
          rememberMe: rememberMe.toString(),
        });
        console.log("User authenticated successfully");
      } else {
        console.warn("Failed to fetch user info");
        logout();
        sessionStorage.setItem("redirectUrl", to.fullPath);
        return next("/login");
      }
    }

    const rolePaths = {
      student: "/dashboard",
      professor: "/professor-dashboard",
      admin: "/admin-dashboard",
    };

    if (!isToPublic) {
      const allowedPathPatterns = [
        "/dashboard",
        "/admin-dashboard",
        "/professor-dashboard",
        "/courselist",
        "/courselist/course/",
        "/progress-tracking/",
        "/lessonRecommend/",
        "/profile",
        "/user-management",
        "/course-management",
        "/feedback-management",
        "/add-course",
        "/add-user",
        "/exercise-code"
      ];
      const isAllowedPath = allowedPathPatterns.some((pattern) =>
        to.path.startsWith(pattern)
      );
      console.log("Is Allowed Path:", isAllowedPath);
      if (!isAllowedPath) {
        console.warn("Path not in allowed patterns. Redirecting to default role path.");
        const defaultPath = rolePaths[user?.role as keyof typeof rolePaths] || "/";
        return next(defaultPath);
      }
    }

    if (to.meta.role && to.meta.role !== user?.role) {
      console.warn("Role mismatch. Redirecting to default role path.");
      const defaultPath = rolePaths[user?.role as keyof typeof rolePaths] || "/";
      return next(defaultPath);
    }

    next();
  } catch (error) {
    console.error("Navigation Guard Error:", error);
    logout();
    sessionStorage.setItem("redirectUrl", to.fullPath);
    return next("/login");
  }
};
