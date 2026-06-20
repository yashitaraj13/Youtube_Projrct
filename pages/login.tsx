import Link from "next/link";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
useEffect(() => {
  if (user) {
    router.replace("/");
  }
}, [user, router]);

if (user) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await login(email, password);
    setMessage(result.message);
    setIsSubmitting(false);
    // If ok, OTP modal will appear automatically via AuthContext
  };




  return (
    <Layout>
      <section className="mx-auto max-w-md rounded border border-white/10 p-6">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-1 text-sm text-muted">
          After login, a one-time password will be sent to verify your identity.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/10 px-3 py-2 outline-none focus:border-brand"
            placeholder="Email"
            type="email"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/10 px-3 py-2 outline-none focus:border-brand"
            placeholder="Password"
            type="password"
            required
          />
          <button
            disabled={isSubmitting}
            className="w-full rounded bg-brand px-4 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? "Checking…" : "Login"}
          </button>
          <div id="recaptcha-container"></div>
        </form>
        <input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full rounded border border-white/10 bg-white/10 px-3 py-2 outline-none focus:border-brand"
          placeholder="+91XXXXXXXXXX"
          type="tel"
        />

        {message && (
          <p
            className={`mt-3 text-sm ${
              message.toLowerCase().includes("otp")
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        <p className="mt-4 text-sm text-muted">
          New to YourTube?{" "}
          <Link href="/signup" className="text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </Layout>
  );
}
