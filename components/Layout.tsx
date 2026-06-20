import Link from "next/link";
import {
  LogIn,
  LogOut,
  PhoneCall,
  Search,
  Upload,
  UserCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Video } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLightTheme, isReady } = useAuth();

  return (
    <div
      className={
        isLightTheme
          ? "min-h-screen bg-slate-50 text-ink"
          : "min-h-screen bg-[#0f1117] text-slate-50"
      }
    >
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur ${
          isLightTheme
            ? "border-black/10 bg-slate-50/95"
            : "border-white/10 bg-[#0f1117]/95"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <img
              src="/logo.png"
              alt="YourTube Logo"
              className="h-9 w-9 rounded object-cover"
            />
            YouTube
          </Link>

          {/* Search */}
          <div
            className={`hidden min-w-0 flex-1 items-center rounded border px-3 py-2 md:flex ${
              isLightTheme
                ? "border-black/10 bg-black/5"
                : "border-white/10 bg-white/10"
            }`}
          >
            <Search size={18} className="text-muted" />
            <input
              className="w-full bg-transparent px-3 outline-none"
              placeholder="Search videos"
            />
          </div>

          {/* Nav icons */}
          <Link
            href="/call"
            className="rounded p-2 hover:bg-white/10"
            title="Video call"
          >
            <PhoneCall size={20} />
          </Link>
          <Link
            href="/upload"
            className="rounded p-2 hover:bg-white/10"
            title="Upload video"
          >
            <Upload size={20} />
          </Link>

          {/* Auth area */}
          {!isReady ? (
            <div className="h-10 w-28 rounded bg-white/10" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden rounded px-3 py-2 text-sm hover:bg-white/10 sm:block"
              >
                {user.name}
              </Link>
              <button
                onClick={logout}
                className="rounded p-2 hover:bg-white/10"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold hover:bg-white/10"
              >
                <LogIn size={18} />
                Login
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
