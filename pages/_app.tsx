import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthContext";
import { OtpModal } from "@/components/OtpModal";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      {/* OtpModal renders globally — visible on any page when OTP is pending */}
      <OtpModal />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
