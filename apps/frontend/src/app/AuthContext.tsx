import {
  createContext,
  startTransition,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { api, getPersistedAccessToken, persistAccessToken } from "../services/api";
import type { UserSummary } from "../types/api";

interface AuthContextValue {
  user: UserSummary | null;
  initialized: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [initialized, setInitialized] = useState(false);

  async function bootstrap() {
    const token = getPersistedAccessToken();
    if (!token) {
      setInitialized(true);
      return;
    }

    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch {
      persistAccessToken(null);
      setUser(null);
    } finally {
      setInitialized(true);
    }
  }

  useEffect(() => {
    void bootstrap();
  }, []);

  async function applyAuthResponse(action: Promise<{ accessToken: string; user: UserSummary }>) {
    const response = await action;
    persistAccessToken(response.accessToken);
    startTransition(() => {
      setUser(response.user);
    });
  }

  async function refreshUser() {
    const currentUser = await api.getCurrentUser();
    setUser(currentUser);
  }

  const value: AuthContextValue = {
    user,
    initialized,
    isAuthenticated: Boolean(user),
    login: async (email, password) => applyAuthResponse(api.login(email, password)),
    register: async (firstName, lastName, email, password) =>
      applyAuthResponse(api.register(firstName, lastName, email, password)),
    logout: () => {
      persistAccessToken(null);
      setUser(null);
    },
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
