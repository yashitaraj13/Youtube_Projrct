import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";

export default function SignUpPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  if (user) {
    router.replace("/");
    return null;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await register({ name, email, phone, password });
    setIsError(!result.ok);
    setMessage(result.message);
    setIsSubmitting(false);
    // If ok, OTP modal appears automatically
  };

  return (
    <Layout>
      <section className="mx-auto max-w-md rounded border border-white/10 p-6">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="mt-1 text-sm text-muted">
          After sign-up, we'll verify your identity with a one-time password.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/10 px-3 py-2 outline-none focus:border-brand"
            placeholder="Full name"
            required
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/10 px-3 py-2 outline-none focus:border-brand"
            placeholder="Email"
            type="email"
            required
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border border-white/10 bg-white/10 px-3 py-2 outline-none focus:border-brand"
            placeholder="Phone number (e.g. +919876543210)"
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
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        {message && (
          <p className={`mt-3 text-sm ${isError ? "text-red-400" : "text-emerald-400"}`}>
            {message}
          </p>
        )}

        <p className="mt-4 text-sm text-muted">
          Already registered?{" "}
          <Link href="/login" className="text-brand hover:underline">
            Login
          </Link>
        </p>
      </section>
    </Layout>
  );
}
