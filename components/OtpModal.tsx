import { useEffect, useRef, useState } from "react";
import { Mail, Phone, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * OtpModal — shown automatically whenever `otpStep` is set in AuthContext.
 * Handles both email OTP (South India) and phone OTP (other states).
 * Blocks the UI until the user verifies or cancels.
 */
export function OtpModal() {
  const { otpStep, verifyOtp, resendOtp, logout } = useAuth();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [isResending, setIsResending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state whenever a new OTP step begins
  useEffect(() => {
    if (!otpStep) return;
    setCode("");
    setMessage(
      `A 6-digit OTP has been sent to your ${otpStep.type === "email" ? "email" : "phone"}: ${otpStep.destination}`
    );
    setIsError(false);
    setSecondsLeft(120);
    inputRef.current?.focus();
  }, [otpStep]);

  // Countdown timer
  useEffect(() => {
    if (!otpStep) return;
    if (secondsLeft <= 0) {
      setIsError(true);
      setMessage("OTP has expired. Click Resend to get a new one.");
      return;
    }
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft, otpStep]);

  if (!otpStep) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = verifyOtp(code.trim());
    setIsError(!result.ok);
    setMessage(result.message);
    if (!result.ok) {
      setCode("");
      inputRef.current?.focus();
    }
  };

  const handleResend = () => {
    setIsResending(true);
    setCode("");
    setIsError(false);
    resendOtp();
    setSecondsLeft(120);
    setMessage(
      `A new OTP has been sent to your ${otpStep.type === "email" ? "email" : "phone"}: ${otpStep.destination}`
    );
    setIsResending(false);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const expired = secondsLeft <= 0;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#181b22] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/15">
              {otpStep.type === "email" ? (
                <Mail size={20} className="text-brand" />
              ) : (
                <Phone size={20} className="text-brand" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-white">Verify your identity</h2>
              <p className="text-xs text-muted">
                {otpStep.type === "email" ? "Email OTP" : "Mobile OTP"}
              </p>
            </div>
          </div>
          {/* Cancel — clears the pending user session */}
          <button
            onClick={logout}
            className="rounded p-1 text-muted hover:bg-white/10 hover:text-white"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Destination hint */}
        <p className="mb-4 rounded bg-white/5 px-3 py-2 text-sm text-muted">
          {otpStep.type === "email" ? "Sent to email" : "Sent to phone"}:{" "}
          <span className="font-medium text-white">{otpStep.destination}</span>
        </p>

        {/* OTP input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-muted">Enter 6-digit OTP</label>
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="••••••"
              disabled={expired}
              className="
                w-full rounded border border-white/10 bg-white/10
                px-4 py-3 text-center text-2xl font-bold
                tracking-[0.5em] text-white outline-none
                placeholder:text-white/20
                focus:border-brand
                disabled:opacity-50
              "
            />
          </div>

          {/* Countdown */}
          {!expired && (
            <p className="text-center text-sm text-muted">
              Expires in{" "}
              <span className={secondsLeft <= 30 ? "text-brand font-semibold" : "text-white"}>
                {mins}:{secs.toString().padStart(2, "0")}
              </span>
            </p>
          )}

          {/* Status message */}
          {message && (
            <p className={`text-sm ${isError ? "text-red-400" : "text-emerald-400"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={code.length !== 6 || expired}
            className="flex w-full items-center justify-center gap-2 rounded bg-brand px-4 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <ShieldCheck size={18} />
            Verify OTP
          </button>
        </form>

        {/* Resend */}
        <div className="mt-4 text-center">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="flex items-center gap-1.5 mx-auto text-sm text-muted hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={isResending ? "animate-spin" : ""} />
            Resend OTP
          </button>
        </div>

        {/* Dev helper — shows the code in the UI so you can test without real email/SMS */}
        {process.env.NODE_ENV !== "production" && (
          <p className="mt-4 rounded bg-white/5 px-3 py-2 text-center text-xs text-muted">
            Dev mode — check the browser console for the OTP code
          </p>
        )}
      </div>
    </div>
  );
}
