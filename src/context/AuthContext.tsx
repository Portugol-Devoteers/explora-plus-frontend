import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { setRefreshHandler, setTokenProvider } from "../services/api";
import {
  AuthTokens,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  login as loginRequest,
  refresh as refreshRequest,
  register as registerRequest,
} from "../services/auth";
import { storage } from "../services/storage";

const ACCESS_KEY = "explora.auth.access";
const REFRESH_KEY = "explora.auth.refresh";
const USER_KEY = "explora.auth.user";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const accessRef = useRef<string | null>(null);

  useEffect(() => {
    setTokenProvider(() => accessRef.current);

    setRefreshHandler(async () => {
      const storedRefresh = await storage.get(REFRESH_KEY);
      if (!storedRefresh) {
        setStatus("anonymous");
        return null;
      }
      try {
        const { access: newAccess } = await refreshRequest(storedRefresh);
        accessRef.current = newAccess;
        await storage.set(ACCESS_KEY, newAccess);
        return newAccess;
      } catch {
        accessRef.current = null;
        await Promise.all([
          storage.remove(ACCESS_KEY),
          storage.remove(REFRESH_KEY),
          storage.remove(USER_KEY),
        ]);
        setUser(null);
        setStatus("anonymous");
        return null;
      }
    });
  }, []);

  useEffect(() => {
    (async () => {
      const [access, refresh, userJson] = await Promise.all([
        storage.get(ACCESS_KEY),
        storage.get(REFRESH_KEY),
        storage.get(USER_KEY),
      ]);

      if (!refresh) {
        accessRef.current = null;
        setUser(null);
        setStatus("anonymous");
        return;
      }

      try {
        const { access: nextAccess } = await refreshRequest(refresh);
        accessRef.current = nextAccess;
        await storage.set(ACCESS_KEY, nextAccess);

        if (userJson) {
          try {
            setUser(JSON.parse(userJson) as AuthUser);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }

        setStatus("authenticated");
      } catch {
        accessRef.current = null;
        await Promise.all([
          storage.remove(ACCESS_KEY),
          storage.remove(REFRESH_KEY),
          storage.remove(USER_KEY),
        ]);
        setUser(null);
        setStatus("anonymous");
      }
    })();
  }, []);

  const persist = useCallback(
    async (tokens: AuthTokens, nextUser: AuthUser | null) => {
      accessRef.current = tokens.access;
      await Promise.all([
        storage.set(ACCESS_KEY, tokens.access),
        storage.set(REFRESH_KEY, tokens.refresh),
        nextUser
          ? storage.set(USER_KEY, JSON.stringify(nextUser))
          : storage.remove(USER_KEY),
      ]);
      setUser(nextUser);
      setStatus("authenticated");
    },
    [],
  );

  const signIn = useCallback(
    async (payload: LoginPayload) => {
      const tokens = await loginRequest(payload);
      const fallbackUser: AuthUser = {
        id: 0,
        username: payload.username,
        email: "",
      };
      await persist(tokens, fallbackUser);
    },
    [persist],
  );

  const signUp = useCallback(
    async (payload: RegisterPayload) => {
      const result = await registerRequest(payload);
      const { access, refresh, user: newUser } = result;
      await persist({ access, refresh }, newUser);
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    accessRef.current = null;
    await Promise.all([
      storage.remove(ACCESS_KEY),
      storage.remove(REFRESH_KEY),
      storage.remove(USER_KEY),
    ]);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signUp, signOut }),
    [status, user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
