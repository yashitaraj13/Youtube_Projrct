import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { OtpSession, User } from "@/lib/types";
import { storage } from "@/lib/storage";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import type { Plan } from "@/lib/types";

export const southStates = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
];

const OTP_TTL_MS = 2 * 60 * 1000; // 2 minutes

/** Generate a random 6-digit OTP code */
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

type OtpStep = {
  pendingUser: User;
  destination: string;
  type: "email" | "phone";
};

type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  updatePlan: (plan: Plan) => void;
  // loginWithGoogle: () => Promise<void>;
  /** Initiates Google demo login — returns whether OTP step is needed */
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message: string }>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<{ ok: boolean; message: string }>;
  /** Active OTP verification step, null when no OTP is pending */
  otpStep: OtpStep | null;
  /** Verify the code the user typed; returns result message */
  verifyOtp: (code: string) => { ok: boolean; message: string };
  /** Resend / regenerate OTP for the current pending step */
  resendOtp: () => void;
  isLightTheme: boolean;
  isReady: boolean;
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const defaultUser: User = {
  _id: "demo-user-001",
  name: "Yashita Raj",
  email: "yashita@example.com",
  phone: "+919999999999",
  image:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
  city: "",
  state: "",
  plan: "free",
};

const detectLocation = async (): Promise<{ city: string; state: string }> => {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    return {
      city: data.city || "Bengaluru",
      state: data.region || "Karnataka",
    };
  } catch {
    return { city: "Bengaluru", state: "Karnataka" };
  }
};

/** Start an OTP session: persist it and log/simulate delivery */
const startOtpSession = async (pendingUser: User): Promise<OtpStep> => {
  const isSouth = southStates.includes(pendingUser.state);

  const type: "email" | "phone" = isSouth ? "email" : "phone";

  const destination = isSouth ? pendingUser.email : pendingUser.phone;

  const code = generateOtp();

  const session: OtpSession = {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    destination,
    type,
  };

  storage.otp.save(session);

  if (isSouth) {
    try {
      await fetch("/api/send-email-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: pendingUser.email,
          otp: code,
        }),
      });
    } catch (error) {
      console.error("Email OTP failed:", error);
    }
  } else {
    console.log(`SMS OTP for ${pendingUser.phone}: ${code}`);
  }

  return {
    pendingUser,
    destination,
    type,
  };
};
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [otpStep, setOtpStep] = useState<OtpStep | null>(null);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [isReady, setIsReady] = useState(false);
  const [selectedLanguage, setSelectedLanguageState] = useState("Hindi");

  // Restore session and language on mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUserState(storage.session.get());
      setSelectedLanguageState(storage.settings.language());
      setIsReady(true);
    }, 0);
    const clock = window.setInterval(
      () => setCurrentHour(new Date().getHours()),
      60_000,
    );
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(clock);
    };
  }, []);

  const isSouthIndian = Boolean(
    user?.state && southStates.includes(user.state),
  );
  // Light theme: South Indian user AND time is 10:00–11:59 IST
  const isLightTheme = true;
  //  const isLightTheme =
  //   isSouthIndian &&
  //   currentHour >= 10 &&
  //   currentHour < 12;

  useEffect(() => {
    document.body.classList.toggle("light-theme", isLightTheme);
  }, [isLightTheme]);

  const setUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser);
    if (nextUser) {
      storage.users.upsert(nextUser);
      storage.session.set(nextUser);
    } else {
      storage.session.set(null);
    }
  }, []);

  /** Complete login after OTP is verified */
  const finaliseLogin = useCallback(
    (pendingUser: User) => {
      setOtpStep(null);
      storage.otp.clear();
      setUser(pendingUser);
    },
    [setUser],
  );

  const verifyOtp = useCallback(
    (code: string): { ok: boolean; message: string } => {
      const session = storage.otp.get();
      if (!session || !otpStep) {
        return {
          ok: false,
          message: "No active OTP session. Please try again.",
        };
      }
      if (Date.now() > session.expiresAt) {
        storage.otp.clear();
        setOtpStep(null);
        return {
          ok: false,
          message: "OTP has expired. Please request a new one.",
        };
      }
      if (code.trim() !== session.code) {
        return { ok: false, message: "Incorrect OTP. Please try again." };
      }
      finaliseLogin(otpStep.pendingUser);
      return { ok: true, message: "OTP verified. Welcome!" };
    },
    [otpStep, finaliseLogin],
  );

  const resendOtp = useCallback(async () => {
    if (!otpStep) return;

    const newStep = await startOtpSession(otpStep.pendingUser);

    setOtpStep(newStep);
  }, [otpStep]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      const firebaseUser = result.user;

      const { city, state } = await detectLocation();

      const user: User = {
        _id: firebaseUser.uid,
        name: firebaseUser.displayName || "Google User",
        email: firebaseUser.email || "",
        phone: "",
        image: firebaseUser.photoURL || "",
        city,
        state,
        plan: "free",
      };

      setUser(user);
    } catch (error) {
      console.error(error);
    }
  }, [setUser]);

  // const loginWithGoogleDemo = useCallback(async (phone: string) => {
  //   const { city, state } = await detectLocation();

  //   const pendingUser: User = {
  //     ...defaultUser,
  //     phone,
  //     city,
  //     state,
  //   };

  //   const step = await startOtpSession(pendingUser);
  //   setOtpStep(step);
  // }, []);

  const login = useCallback(async (email: string, password: string) => {
    const existing = storage.users.findByEmail(email);
    if (!existing || existing.password !== password) {
      return { ok: false, message: "Invalid email or password." };
    }
    // Trigger OTP for login too
    const step = await startOtpSession(existing);
    setOtpStep(step);
    return {
      ok: true,
      message: `OTP sent to your ${step.type === "email" ? "email" : "phone"}.`,
    };
  }, []);

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      phone: string;
      password: string;
    }) => {
      if (storage.users.findByEmail(input.email)) {
        return {
          ok: false,
          message: "An account with this email already exists.",
        };
      }
      const { city, state } = await detectLocation();
      const newUser: User = {
        _id: crypto.randomUUID(),
        name: input.name,
        email: input.email,
        password: input.password,
        phone: input.phone,
        image: "",
        city,
        state,
        plan: "free",
      };
      // Save to users list immediately so login can find it
      storage.users.upsert(newUser);
      const step = await startOtpSession(newUser);
      setOtpStep(step);
      return {
        ok: true,
        message: `Account created. OTP sent to your ${step.type === "email" ? "email" : "phone"}.`,
      };
    },
    [],
  );
  const updatePlan = useCallback(
    (plan: Plan) => {
      if (!user) return;

      const updated = {
        ...user,
        plan,
      };

      setUser(updated);
    },
    [user, setUser],
  );
  const logout = useCallback(() => {
    setOtpStep(null);
    storage.otp.clear();
    setUser(null);
  }, [setUser]);

  const setSelectedLanguage = useCallback((language: string) => {
    setSelectedLanguageState(language);
    storage.settings.setLanguage(language);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      logout,
      updatePlan,
      login,
      register,
      otpStep,
      verifyOtp,
      resendOtp,
      isLightTheme,
      isReady,
      selectedLanguage,
      setSelectedLanguage,
    }),
    [
      user,
      setUser,
      logout,
      updatePlan,
      login,
      register,
      otpStep,
      verifyOtp,
      resendOtp,
      isLightTheme,
      isReady,
      selectedLanguage,
      setSelectedLanguage,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
