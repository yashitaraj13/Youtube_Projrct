import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { VideoCard } from "@/components/VideoCard";
import { videos as staticVideos } from "@/lib/videos";
import { storage } from "@/lib/storage";
import type { Video } from "@/lib/types";

export default function Home() {
  const [uploadedVideos, setUploadedVideos] = useState<Video[]>([]);

  useEffect(() => {
    setUploadedVideos(storage.uploadedVideos.all());
  }, []);

  const allVideos = [...uploadedVideos, ...staticVideos];

  return (
    <Layout>
      <section className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {allVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </section>
    </Layout>
  );
}
