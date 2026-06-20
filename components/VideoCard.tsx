import Link from "next/link";
import { Upload } from "lucide-react";
import type { Video } from "@/lib/types";

export function VideoCard({ video }: { video: Video }) {
  return (
    <Link href={`/watch/${video.id}`} className="group block">
      <div className="relative aspect-video overflow-hidden rounded bg-slate-800">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs font-semibold text-white">
          {video.duration}
        </span>
        {video.isUploaded && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-brand/90 px-2 py-0.5 text-xs font-semibold text-white">
            <Upload size={11} /> Uploaded
          </span>
        )}
      </div>
      <div className="mt-3">
        <h2 className="line-clamp-2 font-semibold leading-snug">{video.title}</h2>
        <p className="mt-1 text-sm text-muted">{video.channel}</p>
        <p className="text-sm text-muted">
          {video.views} · {video.uploadedAt}
        </p>
      </div>
    </Link>
  );
}
