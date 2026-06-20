import { useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Download,
  Monitor,
  MonitorOff,
  Phone,
  PhoneCall,
  PhoneOff,
  Radio,
  StopCircle,
  UserPlus,
  Users
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";

// Demo friend list — in production this would come from a real contacts API
const DEMO_FRIENDS = [
  { id: "f1", name: "Aarav Mehta", status: "online" as const },
  { id: "f2", name: "Meera Nair", status: "online" as const },
  { id: "f3", name: "Rohan Kapoor", status: "offline" as const },
  { id: "f4", name: "Priya Sharma", status: "in-call" as const }
];

type CallState = "idle" | "calling" | "in-call" | "incoming";

export default function CallPage() {
  const { user } = useAuth();

  // Media state
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const activeStream = useRef<MediaStream | null>(null);
  const screenStream = useRef<MediaStream | null>(null);

  const [recordingUrl, setRecordingUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [status, setStatus] = useState("");

  // Call state
  const [callState, setCallState] = useState<CallState>("idle");
  const [callee, setCallee] = useState<(typeof DEMO_FRIENDS)[0] | null>(null);
  const [caller, setCaller] = useState<(typeof DEMO_FRIENDS)[0] | null>(null);

  // ── Attach a stream to the local video element ──────────────────────────────
  const attachStream = (stream: MediaStream) => {
    activeStream.current = stream;
    if (localVideo.current) {
      localVideo.current.srcObject = stream;
      localVideo.current.play().catch(() => {});
    }
  };

  // ── Stop all tracks on a stream ──────────────────────────────────────────────
  const stopStream = (stream: MediaStream | null) => {
    stream?.getTracks().forEach((t) => t.stop());
  };

  // ── Camera ────────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      attachStream(stream);
      setCameraActive(true);
      setStatus("Camera is live.");
    } catch {
      setStatus("Could not access camera. Check permissions.");
    }
  };

  const stopCamera = () => {
    stopStream(activeStream.current);
    if (localVideo.current) localVideo.current.srcObject = null;
    activeStream.current = null;
    setCameraActive(false);
    if (isRecording) stopRecording();
    setStatus("Camera stopped.");
  };

  // ── Screen share ──────────────────────────────────────────────────────────────
  const shareScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStream.current = stream;
      attachStream(stream);
      setScreenActive(true);
      setStatus("Screen sharing active.");
      // Auto-detect when the user stops sharing via the browser's native stop button
      stream.getVideoTracks()[0].onended = stopScreen;
    } catch {
      setStatus("Screen sharing cancelled or unavailable.");
    }
  };

  const stopScreen = () => {
    stopStream(screenStream.current);
    screenStream.current = null;
    if (localVideo.current) localVideo.current.srcObject = null;
    setScreenActive(false);
    setStatus("Screen sharing stopped.");
  };

  // ── Recording ─────────────────────────────────────────────────────────────────
  const startRecording = () => {
    const stream = activeStream.current || screenStream.current;
    if (!stream) { setStatus("Start camera or screen share first."); return; }
    chunks.current = [];
    recorder.current = new MediaRecorder(stream);
    recorder.current.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
    recorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: "video/webm" });
      setRecordingUrl(URL.createObjectURL(blob));
      setStatus("Recording saved.");
    };
    recorder.current.start();
    setIsRecording(true);
    setStatus("Recording…");
  };

  const stopRecording = () => {
    if (recorder.current?.state === "recording") {
      recorder.current.stop();
    }
    setIsRecording(false);
  };

  // ── Call controls ─────────────────────────────────────────────────────────────
  const callFriend = async (friend: (typeof DEMO_FRIENDS)[0]) => {
    if (friend.status !== "online") return;
    setCallee(friend);
    setCallState("calling");
    setStatus(`Calling ${friend.name}…`);

    // Simulate the friend picking up after ~1.5 s
    await startCamera();
    window.setTimeout(() => {
      setCallState("in-call");
      setStatus(`In call with ${friend.name}`);
    }, 1500);
  };

  const hangUp = () => {
    stopCamera();
    stopStream(screenStream.current);
    screenStream.current = null;
    setScreenActive(false);
    if (isRecording) stopRecording();
    setCallState("idle");
    setCallee(null);
    setCaller(null);
    setStatus("Call ended.");
  };

  // Simulate an incoming call from a random online friend
  const simulateIncoming = () => {
    const online = DEMO_FRIENDS.filter((f) => f.status === "online");
    const from = online[Math.floor(Math.random() * online.length)];
    setCaller(from);
    setCallState("incoming");
    setStatus(`Incoming call from ${from.name}…`);
  };

  const acceptCall = async () => {
    await startCamera();
    setCallee(caller);
    setCaller(null);
    setCallState("in-call");
    setStatus(`In call with ${callee?.name || "friend"}`);
  };

  const rejectCall = () => {
    setCaller(null);
    setCallState("idle");
    setStatus("Call rejected.");
  };

  const statusColor =
    callState === "in-call"
      ? "text-emerald-400"
      : callState === "incoming"
      ? "text-yellow-400"
      : "text-muted";

  return (
    <Layout>
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Video preview ── */}
        <div>
          <h1 className="mb-4 text-2xl font-bold">Video Call & Screen Share</h1>

          <div className="relative overflow-hidden rounded bg-black">
            <video
              ref={localVideo}
              muted
              playsInline
              className="aspect-video w-full object-cover"
            />
            {!cameraActive && !screenActive && (
              <div className="absolute inset-0 flex items-center justify-center text-muted">
                <Camera size={40} className="opacity-30" />
              </div>
            )}
            {callState === "in-call" && callee && (
              <div className="absolute left-3 top-3 rounded bg-black/60 px-3 py-1 text-sm text-white">
                {callee.name}
              </div>
            )}
          </div>

          {/* Status */}
          {status && (
            <p className={`mt-3 text-sm ${statusColor}`}>{status}</p>
          )}

          {/* Incoming call banner */}
          {callState === "incoming" && caller && (
            <div className="mt-4 flex items-center justify-between rounded border border-yellow-400/30 bg-yellow-400/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <PhoneCall size={20} className="text-yellow-400" />
                <span className="font-semibold text-yellow-300">
                  Incoming call from {caller.name}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={acceptCall}
                  className="flex items-center gap-1.5 rounded bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white"
                >
                  <Phone size={16} /> Accept
                </button>
                <button
                  onClick={rejectCall}
                  className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-sm font-semibold text-white"
                >
                  <PhoneOff size={16} /> Reject
                </button>
              </div>
            </div>
          )}

          {/* Recording download */}
          {recordingUrl && (
            <a
              href={recordingUrl}
              download="recording.webm"
              className="mt-4 flex w-full items-center gap-2 rounded bg-emerald-500 px-4 py-2 font-semibold text-white"
            >
              <Download size={18} /> Download recording
            </a>
          )}
        </div>

        {/* ── Controls sidebar ── */}
        <aside className="space-y-3">
          {/* Camera */}
          <div className="rounded border border-white/10 p-4">
            <h2 className="mb-3 font-bold">Camera</h2>
            {!cameraActive ? (
              <button
                onClick={startCamera}
                disabled={callState === "calling"}
                className="flex w-full items-center gap-2 rounded bg-white px-4 py-2 font-semibold text-ink disabled:opacity-50"
              >
                <Camera size={18} /> Start camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex w-full items-center gap-2 rounded border border-white/10 px-4 py-2 font-semibold text-brand"
              >
                <CameraOff size={18} /> Stop camera
              </button>
            )}
          </div>

          {/* Screen share */}
          <div className="rounded border border-white/10 p-4">
            <h2 className="mb-3 font-bold">Screen share</h2>
            {!screenActive ? (
              <button
                onClick={shareScreen}
                className="flex w-full items-center gap-2 rounded bg-white px-4 py-2 font-semibold text-ink"
              >
                <Monitor size={18} /> Share screen
              </button>
            ) : (
              <button
                onClick={stopScreen}
                className="flex w-full items-center gap-2 rounded border border-white/10 px-4 py-2 font-semibold text-brand"
              >
                <MonitorOff size={18} /> Stop sharing
              </button>
            )}
          </div>

          {/* Recording */}
          <div className="rounded border border-white/10 p-4">
            <h2 className="mb-3 font-bold">Recording</h2>
            <div className="flex gap-2">
              <button
                onClick={startRecording}
                disabled={isRecording || (!cameraActive && !screenActive)}
                className="flex flex-1 items-center gap-2 rounded bg-brand px-3 py-2 font-semibold text-white disabled:opacity-50"
              >
                <Radio size={16} /> Record
              </button>
              <button
                onClick={stopRecording}
                disabled={!isRecording}
                className="flex flex-1 items-center gap-2 rounded border border-white/10 px-3 py-2 font-semibold disabled:opacity-50"
              >
                <StopCircle size={16} /> Stop
              </button>
            </div>
          </div>

          {/* Active call controls */}
          {callState === "in-call" && (
            <div className="rounded border border-brand/30 bg-brand/10 p-4">
              <h2 className="mb-3 font-bold text-brand">Active call</h2>
              <p className="mb-3 text-sm text-muted">With {callee?.name}</p>
              <button
                onClick={hangUp}
                className="flex w-full items-center gap-2 rounded bg-brand px-4 py-2 font-semibold text-white"
              >
                <PhoneOff size={18} /> End call
              </button>
            </div>
          )}

          {/* Friend list */}
          <div className="rounded border border-white/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2">
                <Users size={16} /> Friends
              </h2>
              <button
                onClick={simulateIncoming}
                className="flex items-center gap-1 text-xs text-muted hover:text-white transition"
                title="Simulate an incoming call"
              >
                <UserPlus size={13} /> Simulate call
              </button>
            </div>

            <div className="space-y-2">
              {DEMO_FRIENDS.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${
                        friend.status === "online"
                          ? "bg-emerald-400"
                          : friend.status === "in-call"
                          ? "bg-yellow-400"
                          : "bg-white/20"
                      }`}
                    />
                    <span className="truncate text-sm">{friend.name}</span>
                  </div>
                  <button
                    onClick={() => callFriend(friend)}
                    disabled={
                      friend.status !== "online" ||
                      callState === "in-call" ||
                      callState === "calling"
                    }
                    className="flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-30"
                    title={
                      friend.status === "online"
                        ? `Call ${friend.name}`
                        : friend.status === "in-call"
                        ? "Currently in another call"
                        : "Offline"
                    }
                  >
                    <PhoneCall size={12} />
                    {friend.status === "in-call" ? "Busy" : friend.status === "offline" ? "Offline" : "Call"}
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-muted">
              Green = online · Yellow = in call · Grey = offline
            </p>
          </div>

          {/* Logged-in user info */}
          {user && (
            <p className="text-xs text-muted px-1">
              Calling as: {user.name}
            </p>
          )}
        </aside>
      </section>
    </Layout>
  );
}
