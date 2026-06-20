import type { Comment, DownloadRecord, OtpSession, Transaction, User, Video } from "./types";

const readJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const writeJson = <T,>(key: string, value: T) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const storage = {
  users: {
    all: () => readJson<User[]>("yourtube-users", []),
    saveAll: (users: User[]) => writeJson("yourtube-users", users),
    upsert: (user: User) => {
      const users = storage.users.all();
      const nextUsers = users.some((item) => item._id === user._id)
        ? users.map((item) => (item._id === user._id ? user : item))
        : [user, ...users];
      storage.users.saveAll(nextUsers);
    },
    findByEmail: (email: string) =>
      storage.users.all().find((user) => user.email.toLowerCase() === email.toLowerCase())
  },
  session: {
    get: () => readJson<User | null>("yourtube-user", null),
    set: (user: User | null) => {
      if (user) {
        writeJson("yourtube-user", user);
      } else {
        window.localStorage.removeItem("yourtube-user");
      }
    }
  },
  comments: {
    all: () => readJson<Comment[]>("yourtube-comments", []),
    saveAll: (comments: Comment[]) => writeJson("yourtube-comments", comments)
  },
  downloads: {
    all: () => readJson<DownloadRecord[]>("yourtube-download-history", []),
    saveAll: (downloads: DownloadRecord[]) => writeJson("yourtube-download-history", downloads)
  },
  transactions: {
    all: () => readJson<Transaction[]>("yourtube-transactions", []),
    saveAll: (transactions: Transaction[]) => writeJson("yourtube-transactions", transactions)
  },
  settings: {
    language: () => readJson<string>("yourtube-language", "Hindi"),
    setLanguage: (language: string) => writeJson("yourtube-language", language)
  },
  otp: {
    save: (session: OtpSession) => writeJson("yourtube-otp", session),
    get: () => readJson<OtpSession | null>("yourtube-otp", null),
    clear: () => {
      if (typeof window !== "undefined") window.localStorage.removeItem("yourtube-otp");
    }
  },
  uploadedVideos: {
    all: () => readJson<Video[]>("yourtube-uploaded-videos", []),
    saveAll: (videos: Video[]) => writeJson("yourtube-uploaded-videos", videos),
    add: (video: Video) => {
      const existing = storage.uploadedVideos.all();
      storage.uploadedVideos.saveAll([video, ...existing]);
    }
  }
};

export const todayKey = () => new Date().toISOString().slice(0, 10);
