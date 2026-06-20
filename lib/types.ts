export type Plan = "free" | "bronze" | "silver" | "gold";

export type User = {
  _id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  image: string;
  city: string;
  state: string;
  plan: Plan;
};

export type Video = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  videoUrl: string;
  views: string;
  uploadedAt: string;
  duration: string;
  isUploaded?: boolean; // true for user-uploaded videos
};

export type Comment = {
  id: string;
  videoId: string;
  userId: string;
  author: string;
  city: string;
  text: string;
  createdAt: string;
  votes: Record<string, "like" | "dislike">;
};

export type DownloadRecord = Video & {
  userId: string;
  downloadedAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
  plan: Plan;
  amount: number;
  invoice: string;
  status: "success" | "failed";
  purchaseDate: string;
};

export type OtpSession = {
  code: string;
  expiresAt: number; // epoch ms
  destination: string; // email or phone
  type: "email" | "phone";
};

export type Friend = {
  id: string;
  name: string;
  email: string;
  status: "online" | "offline" | "in-call";
};

export type CallRequest = {
  fromId: string;
  fromName: string;
  toId: string;
  timestamp: number;
};
