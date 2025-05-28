import axios from "axios";

// Предполагается, что Clerk Frontend API будет доступен через window.Clerk
// Это стандартный способ, если Clerk правильно инициализирован в вашем main.tsx или App.tsx
// через <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: (options?: { template?: string }) => Promise<string | null>;
      };
      // Могут быть и другие свойства, в зависимости от версии Clerk
    };
  }
}

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api", //
});

// Request interceptor для добавления токена Clerk
axiosInstance.interceptors.request.use(
  async (config) => {
    // Пытаемся получить токен из активной сессии Clerk
    // Убедитесь, что Clerk загружен и сессия активна перед тем, как делать запросы,
    // требующие аутентификации. Обычно это управляется состоянием isLoaded и isSignedIn из хуков Clerk.
    let token: string | null = null;
    if (window.Clerk && window.Clerk.session && typeof window.Clerk.session.getToken === 'function') {
      try {
        token = await window.Clerk.session.getToken();
      } catch (error) {
        console.error("Error getting Clerk token:", error);
        // Обработка ошибки получения токена, если необходимо
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Опционально: Response interceptor для обработки глобальных ошибок (например, 401 с бэкенда)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Ошибка 401 может означать, что сессия недействительна или токен истек.
      // Здесь можно добавить логику для выхода пользователя или обновления токена,
      // но Clerk обычно сам управляет редиректами при невалидной сессии,
      // если компоненты обернуты в <SignedIn> / <SignedOut>.
      console.warn("Axios interceptor: Received 401 Unauthorized response.");
      // Возможно, здесь не нужно ничего делать, если Clerk сам обрабатывает редирект.
      // Если вы хотите управлять этим вручную, можно вызвать window.Clerk.signOut() или другие методы.
    }
    return Promise.reject(error);
  }
);