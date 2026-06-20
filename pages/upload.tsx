import { useRef, useState } from "react";
import { useRouter } from "next/router";
import { Upload, Video, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { storage } from "@/lib/storage";
import type { Video as VideoType } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [thumbPreview, setThumbPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }
    setError("");
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image for the thumbnail.");
      return;
    }
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const clearVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview("");
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const clearThumb = () => {
    if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    setThumbFile(null);
    setThumbPreview("");
    if (thumbInputRef.current) thumbInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("Please login to upload videos.");
      return;
    }
    if (!videoFile) {
      setError("Please select a video file.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a video title.");
      return;
    }

    setIsUploading(true);

    try {
      // Store the video as a blob URL (persists for the current browser session)
      // In production you would upload to a storage service (S3, Cloudinary, etc.)
      const videoUrl = URL.createObjectURL(videoFile);

      // Use the chosen thumbnail or generate a default placeholder
      const thumbnail =
        thumbPreview ||
        `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=900&q=80`;

      const newVideo: VideoType = {
        id: `user-${crypto.randomUUID()}`,
        title: title.trim(),
        channel: channel.trim() || user.name,
        thumbnail,
        videoUrl,
        views: "0 views",
        uploadedAt: "Just now",
        duration: "–",
        isUploaded: true
      };

      storage.uploadedVideos.add(newVideo);
      router.push("/");
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <section className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Upload a video</h1>

        {!user && (
          <div className="mb-4 rounded border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
            Please{" "}
            <a href="/login" className="underline">
              login
            </a>{" "}
            to upload videos.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Video file picker */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Video file <span className="text-brand">*</span>
            </label>
            {videoPreview ? (
              <div className="relative overflow-hidden rounded border border-white/10">
                <video
                  src={videoPreview}
                  controls
                  className="aspect-video w-full bg-black"
                />
                <button
                  type="button"
                  onClick={clearVideo}
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-white/20 py-10 text-muted transition hover:border-brand/50 hover:text-white"
              >
                <Video size={36} className="text-brand/60" />
                <span className="text-sm">Click to select a video file</span>
                <span className="text-xs">MP4, WebM, MOV supported</span>
              </button>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="hidden"
            />
          </div>

          {/* Thumbnail picker */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Thumbnail{" "}
              <span className="text-muted font-normal">(optional)</span>
            </label>
            {thumbPreview ? (
              <div className="relative inline-block">
                <img
                  src={thumbPreview}
                  alt="Thumbnail preview"
                  className="h-32 w-56 rounded object-cover"
                />
                <button
                  type="button"
                  onClick={clearThumb}
                  className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                className="flex items-center gap-2 rounded border border-white/10 px-4 py-2 text-sm text-muted hover:bg-white/5 transition"
              >
                <Upload size={16} /> Choose thumbnail image
              </button>
            )}
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbChange}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              Title <span className="text-brand">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-white/10 bg-white/10 px-3 py-2 outline-none focus:border-brand"
              placeholder="Enter a title for your video"
              maxLength={120}
              required
            />
          </div>

          {/* Channel name */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              Channel name{" "}
              <span className="text-muted font-normal">(defaults to your name)</span>
            </label>
            <input
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full rounded border border-white/10 bg-white/10 px-3 py-2 outline-none focus:border-brand"
              placeholder={user?.name || "Your channel name"}
              maxLength={80}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isUploading || !user}
              className="flex items-center gap-2 rounded bg-brand px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <Upload size={18} />
              {isUploading ? "Uploading…" : "Upload video"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded border border-white/10 px-5 py-2.5 font-semibold transition hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </Layout>
  );
}
