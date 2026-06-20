import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Crown, Download, XCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { plans, planOrder } from "@/lib/plans";
import { useAuth } from "@/context/AuthContext";
import { storage } from "@/lib/storage";
import type { DownloadRecord, Plan, Transaction } from "@/lib/types";

// Extend window to include Razorpay constructor injected by the external script
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  order_id?: string;
  key: string;
  amount: number; // paise
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: { color: string };
  handler: (response: { razorpay_payment_id: string }) => void;
  modal: { ondismiss: () => void };
}

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

// Load the Razorpay checkout script once
const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Profile() {
  const { user, setUser, selectedLanguage, setSelectedLanguage } = useAuth();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Load user-specific downloads and transactions on mount / user change
  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      setDownloads(
        storage.downloads.all().filter((d) => d.userId === user._id),
      );
      setTransactions(
        storage.transactions.all().filter((t) => t.userId === user._id),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  const selectedPlan = checkoutPlan ? plans[checkoutPlan] : null;

  // Persist a transaction record and update user plan
  const saveTransaction = async (
    plan: Plan,
    status: "success" | "failed",
    paymentId?: string,
  ) => {
    if (!user) return;
    const purchaseDate = new Date().toISOString();
    const transaction: Transaction = {
      id: paymentId || crypto.randomUUID(),
      userId: user._id,
      plan,
      amount: plans[plan].price,
      invoice: `INV-${purchaseDate.replace(/\D/g, "").slice(0, 14)}`,
      status,
      purchaseDate,
    };

    const all = storage.transactions.all();
    storage.transactions.saveAll([transaction, ...all]);
    setTransactions([transaction, ...transactions]);

    if (status === "success") {
      const nextUser = { ...user, plan };
      setUser(nextUser);

      // Send invoice email via API route (uses Resend if key is set, otherwise logs)
      try {
        await fetch("/api/invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            plan: plans[plan].name,
            amount: plans[plan].price,
            invoice: transaction.invoice,
            purchaseDate,
          }),
        });
      } catch {
        // Non-fatal — invoice email failure should not block the UI
        console.warn("Invoice email request failed.");
      }

      setPaymentMessage(
        `Payment successful. ${plans[plan].name} plan activated. Invoice sent to ${user.email}.`,
      );
    } else {
      setPaymentMessage(
        "Payment failed. Your current subscription was not changed.",
      );
    }

    setCheckoutPlan(null);
    setIsProcessing(false);
  };

  // Open real Razorpay test checkout modal
  const openRazorpay = async (plan: Plan) => {
    if (!user) return;
    setIsProcessing(true);
    setPaymentMessage("");

    const orderRes = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: plans[plan].price * 100,
      }),
    });

    const order = await orderRes.json();

    console.log(order);

    const loaded = await loadRazorpayScript();
    if (!loaded || typeof window.Razorpay === "undefined") {
      // Razorpay script failed to load (e.g. offline) — fall back to demo buttons
      setIsProcessing(false);
      setCheckoutPlan(plan);
      return;
    }

    const options: RazorpayOptions = {
      // Use the public test key — safe to expose on the client
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_xxxxxxxxxx",
      amount: plans[plan].price * 100, // Razorpay expects paise
      order_id: order.id,
      currency: "INR",
      name: "YourTube",
      description: `${plans[plan].name} Subscription`,
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone,
      },
      theme: { color: "#e53e3e" },
      handler: (response) => {
        // Payment success callback — Razorpay returns a payment ID
        saveTransaction(plan, "success", response.razorpay_payment_id);
      },
      modal: {
        ondismiss: () => {
          // User dismissed the modal — just reset processing state, no failed transaction
          setIsProcessing(false);
          setPaymentMessage("Payment was cancelled.");
        },
      },
    };

    const rzp = new window.Razorpay(options);

    setIsProcessing(false);

    rzp.open();
  };

  const latestSuccess = useMemo(
    () => transactions.find((t) => t.status === "success"),
    [transactions],
  );

  return (
    <Layout>
      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar — profile info */}
        <aside className="rounded border border-white/10 p-5">
          <h1 className="text-2xl font-bold">Profile</h1>
          {user ? (
            <div className="mt-4 space-y-2 text-sm text-muted">
              <p className="font-semibold text-white">{user.name}</p>
              <p>{user.email}</p>
              <p>{user.phone}</p>
              {user.city && (
                <p>
                  {user.city}, {user.state}
                </p>
              )}
              <p className="flex items-center gap-1">
                <Crown size={14} className="text-brand" />
                Plan:{" "}
                <span className="font-semibold text-white ml-1">
                  {plans[user.plan].name}
                </span>
              </p>
              {latestSuccess && (
                <p className="text-xs">
                  Latest invoice: {latestSuccess.invoice}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-muted">
              <p>Login to view profile details.</p>
              <Link
                href="/login"
                className="inline-block rounded bg-brand px-4 py-2 font-semibold text-white"
              >
                Login
              </Link>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="space-y-8">
          {/* App settings — language */}
          <section className="rounded border border-white/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Application settings</h2>
                <p className="mt-1 text-sm text-muted">
                  Comment translations use this language.
                </p>
              </div>

              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="
                    appearance-none cursor-pointer
                    rounded border border-white/20
                    bg-[#1a1f2e] px-4 py-2 pr-8
                    text-sm text-white
                    outline-none transition
                    hover:border-white/40 focus:border-brand
                    [&>option]:bg-[#1a1f2e] [&>option]:text-white
                  "
                >
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Kannada">Kannada</option>
                  <option value="English">English</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/50">
                  ▾
                </span>
              </div>
            </div>
          </section>

          {/* Subscription plans */}
          <section>
            <h2 className="mb-4 text-xl font-bold">Subscription plans</h2>
            <div className="grid gap-4 md:grid-cols-4">
              {planOrder.map((plan) => {
                const isActive = user?.plan === plan;
                return (
                  <article
                    key={plan}
                    className={`rounded border p-4 transition ${
                      isActive ? "border-brand bg-brand/10" : "border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">{plans[plan].name}</h3>
                      {isActive && (
                        <span className="rounded bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                      {plans[plan].price === 0
                        ? "Free"
                        : `₹${plans[plan].price}`}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Watch:{" "}
                      {plans[plan].watchLimitMinutes
                        ? `${plans[plan].watchLimitMinutes} min`
                        : "Unlimited"}
                    </p>
                    <p className="text-sm text-muted">
                      Downloads: {plans[plan].downloads}
                    </p>
                    <button
                      onClick={() => openRazorpay(plan)}
                      disabled={!user || isProcessing || isActive}
                      className="mt-4 w-full rounded bg-brand px-3 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {isActive
                        ? "Current plan"
                        : isProcessing
                          ? "Opening…"
                          : "Upgrade"}
                    </button>
                  </article>
                );
              })}
            </div>

            {paymentMessage && (
              <p className="mt-4 rounded border border-white/10 p-3 text-sm text-emerald-400">
                {paymentMessage}
              </p>
            )}
          </section>

          {/* Fallback demo checkout (shown if Razorpay script failed to load) */}
          {checkoutPlan && selectedPlan && (
            <section className="rounded border border-white/10 p-5">
              <h2 className="text-xl font-bold">Demo Checkout</h2>
              <p className="mt-2 text-sm text-muted">
                Plan: {selectedPlan.name} • Amount: ₹{selectedPlan.price}
              </p>
              <p className="mt-1 text-xs text-muted">
                Razorpay script unavailable — use these demo buttons to simulate
                payment.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => saveTransaction(checkoutPlan, "success")}
                  className="flex items-center gap-2 rounded bg-emerald-500 px-4 py-2 font-semibold text-white"
                >
                  <CheckCircle2 size={18} />
                  Simulate Success
                </button>
                <button
                  onClick={() => saveTransaction(checkoutPlan, "failed")}
                  className="flex items-center gap-2 rounded border border-white/10 px-4 py-2 font-semibold"
                >
                  <XCircle size={18} />
                  Simulate Failure
                </button>
              </div>
            </section>
          )}

          {/* Downloads library */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Downloads</h2>
              <Link href="/" className="text-sm text-brand hover:underline">
                Browse videos
              </Link>
            </div>
            <div className="space-y-3">
              {downloads.length === 0 ? (
                <p className="text-sm text-muted">
                  Downloaded videos will appear here.
                </p>
              ) : (
                downloads.map((item) => (
                  <article
                    key={`${item.id}-${item.downloadedAt}`}
                    className="flex gap-3 rounded border border-white/10 p-3"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-20 w-32 flex-shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                        <Download size={13} />
                        {new Date(item.downloadedAt).toLocaleString()}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          {/* Payment history */}
          <section>
            <h2 className="mb-4 text-xl font-bold">Payment history</h2>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted">
                  Transactions will appear here.
                </p>
              ) : (
                transactions.map((tx) => (
                  <article
                    key={tx.id}
                    className="rounded border border-white/10 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {plans[tx.plan].name} • ₹{tx.amount}
                        </p>
                        <p className="text-sm text-muted">
                          {tx.invoice} •{" "}
                          {new Date(tx.purchaseDate).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={
                          tx.status === "success"
                            ? "text-emerald-400"
                            : "text-brand"
                        }
                      >
                        {tx.status}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </Layout>
  );
}
