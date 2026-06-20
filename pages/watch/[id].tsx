import { useRouter } from "next/router";
import { Download, MessageCircle, SkipBack, SkipForward } from "lucide-react";
import { Layout } from "@/components/Layout";
import { CommentSystem } from "@/components/CommentSystem";
import { getNextVideo, getVideo } from "@/lib/videos";
import { plans } from "@/lib/plans";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { storage, todayKey } from "@/lib/storage";

type Zone = "left" | "center" | "right";

export default function WatchPage() {
  const router = useRouter();
  const id = String(router.query.id || "v1");
  const video = getVideo(id);
  const nextVideo = getNextVideo(id);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Tap-gesture state — all in a ref to avoid re-renders between taps
  const tapState = useRef<{ zone: Zone | ""; count: number; timer: number }>({
    zone: "",
    count: 0,
    timer: 0
  });

  const [gesture, setGesture] = useState("");
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [downloadMessage, setDownloadMessage] = useState("");
  const { user } = useAuth();

  const plan = plans[user?.plan || "free"];

  // Clear gesture hint after 2 s so it doesn't clutter the UI permanently
  useEffect(() => {
    if (!gesture) return;
    const id = window.setTimeout(() => setGesture(""), 2000);
    return () => window.clearTimeout(id);
  }, [gesture]);

  // ─── Gesture handler ────────────────────────────────────────────────────────
  const handleTap = (zone: Zone, e: React.PointerEvent) => {
    // Prevent the tap zone from triggering while the user is interacting with
    // the native video controls bar (bottom 56 px — already excluded by CSS)
    e.preventDefault();
    e.stopPropagation();

    window.clearTimeout(tapState.current.timer);

    if (tapState.current.zone === zone) {
      tapState.current.count += 1;
    } else {
      tapState.current.count = 1;
      tapState.current.zone = zone;
    }

    const capturedCount = tapState.current.count;
    tapState.current.timer = window.setTimeout(() => {
      resolveGesture(zone, capturedCount);
      tapState.current.count = 0;
      tapState.current.zone = "";
    }, 280);
  };

  const resolveGesture = (zone: Zone, count: number) => {
    const player = videoRef.current;
    if (!player) return;

    if (count === 1 && zone === "center") {
      player.paused ? player.play() : player.pause();
      setGesture(player.paused ? "Paused" : "Playing");
      return;
    }
    if (count === 2 && zone === "left") {
      player.currentTime = Math.max(0, player.currentTime - 10);
      setGesture("⏪ −10s");
      return;
    }
    if (count === 2 && zone === "right") {
      player.currentTime = player.currentTime + 10;
      setGesture("⏩ +10s");
      return;
    }
    if (count >= 3 && zone === "center") {
      router.push(`/watch/${nextVideo.id}`);
      return;
    }
    if (count >= 3 && zone === "left") {
      document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
      setGesture("💬 Comments");
      return;
    }
    if (count >= 3 && zone === "right") {
      window.close();
      window.location.href = "about:blank";
    }
  };

  // ─── Watch limit ─────────────────────────────────────────────────────────────
  const enforceWatchLimit = () => {
    const player = videoRef.current;
    if (!player || !plan.watchLimitMinutes) return;
    if (player.currentTime >= plan.watchLimitMinutes * 60) {
      player.pause();
      setUpgradeMessage("Upgrade your plan to continue watching.");
    }
  };

  // ─── Download ────────────────────────────────────────────────────────────────
  const downloadVideo = async () => {
    setDownloadMessage("");
    if (!user) {
      setDownloadMessage("Please login before downloading videos.");
      return;
    }

    const history = storage.downloads.all();
    const downloadsToday = history.filter(
      (item) => item.userId === user._id && item.downloadedAt.slice(0, 10) === todayKey()
    ).length;

    if (user.plan === "free" && downloadsToday >= 1) {
      setDownloadMessage(
        "Free users can download 1 video per day. Upgrade for unlimited downloads."
      );
      return;
    }

    const record = { ...video, userId: user._id, downloadedAt: new Date().toISOString() };
    storage.downloads.saveAll([record, ...history]);

    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${video.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setDownloadMessage("Download started.");
    } catch {
      // Fallback: anchor with download attribute
      const anchor = document.createElement("a");
      anchor.href = video.videoUrl;
      anchor.download = `${video.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setDownloadMessage("Download started.");
    }
  };

  return (
    <Layout>
      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          {/* ── Video player with tap zones ── */}
          <div className="relative overflow-hidden rounded bg-black select-none">
            <video
              ref={videoRef}
              src={video.videoUrl}
              controls
              className="aspect-video w-full"
              onTimeUpdate={enforceWatchLimit}
            />

            {/* Tap zones sit above the video but below the native controls bar
                CSS already sets bottom: 56px so they don't block the controls */}
            <button
              aria-label="Tap zone: seek back / scroll comments"
              onPointerUp={(e) => handleTap("left", e)}
              className="tap-zone tap-zone-left"
            />
            <button
              aria-label="Tap zone: play / pause / next video"
              onPointerUp={(e) => handleTap("center", e)}
              className="tap-zone tap-zone-center"
            />
            <button
              aria-label="Tap zone: seek forward / close"
              onPointerUp={(e) => handleTap("right", e)}
              className="tap-zone tap-zone-right"
            />

            {/* Gesture flash overlay — shows briefly then auto-clears */}
            {gesture && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="rounded-lg bg-black/60 px-4 py-2 text-xl font-bold text-white backdrop-blur-sm">
                  {gesture}
                </span>
              </div>
            )}
          </div>

          {/* ── Video meta ── */}
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{video.title}</h1>
              <p className="mt-1 text-sm text-muted">
                {video.views} • {video.uploadedAt}
              </p>
              {downloadMessage && (
                <p className="mt-2 text-sm text-emerald-400">{downloadMessage}</p>
              )}
              {upgradeMessage && (
                <p className="mt-2 rounded border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand">
                  {upgradeMessage}{" "}
                  <a href="/profile" className="underline">
                    Upgrade now
                  </a>
                </p>
              )}
            </div>
            <button
              onClick={downloadVideo}
              className="flex items-center gap-2 rounded bg-white px-4 py-2 font-semibold text-ink hover:opacity-90 transition"
            >
              <Download size={18} />
              Download
            </button>
          </div>

          <CommentSystem videoId={video.id} />
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-3">
          <div className="rounded border border-white/10 p-4">
            <h2 className="font-bold">Gestures</h2>
            <div className="mt-3 grid gap-2 text-sm text-muted">
              <p className="flex items-center gap-2">
                <SkipBack size={16} /> Double-tap left · −10 s
              </p>
              <p className="flex items-center gap-2">
                <SkipForward size={16} /> Double-tap right · +10 s
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle size={16} /> Triple-tap left · comments
              </p>
              <p>Single-tap center · play / pause</p>
              <p>Triple-tap center · next video</p>
              <p>Triple-tap right · close tab</p>
            </div>
          </div>

          <div className="rounded border border-white/10 p-4">
            <h2 className="font-bold">Current plan</h2>
            <p className="mt-2 text-sm text-muted">
              {plan.name} · Watch limit:{" "}
              {plan.watchLimitMinutes ? `${plan.watchLimitMinutes} minutes` : "Unlimited"}
            </p>
            {plan.watchLimitMinutes && (
              <a
                href="/profile"
                className="mt-2 block text-sm text-brand hover:underline"
              >
                Upgrade for more
              </a>
            )}
          </div>
        </aside>
      </section>
    </Layout>
  );
}
