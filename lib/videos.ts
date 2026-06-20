import type { Video } from "./types";

export const videos: Video[] = [
  {
    id: "v1",
    title: "Building a Next.js Video Platform",
    channel: "YourTube Studio",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://assets.mixkit.co/videos/308/308-720.mp4",
    views: "28K views",
    uploadedAt: "2 days ago",
    duration: "08:42"
  },
  {
    id: "v2",
    title: "MongoDB Atlas Collections Explained",
    channel: "Data Classroom",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://video-previews.elements.envatousercontent.com/files/36300138-4088-458d-ab09-3ca7bbada5fe/video_preview_h264.mp4",
    views: "12K views",
    uploadedAt: "1 week ago",
    duration: "11:10"
  },
  {
    id: "v3",
    title: "WebRTC Calls and Screen Sharing Demo",
    channel: "Realtime Lab",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://assets.mixkit.co/videos/4957/4957-720.mp4",
    views: "44K views",
    uploadedAt: "3 weeks ago",
    duration: "06:18"
  },
  {
    id: "v4",
    title: "Roadtrip to Mountains",
    channel: "Stella Adventures",
    thumbnail: "https://plus.unsplash.com/premium_photo-1664547606209-fb31ec979c85?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cm9hZHRyaXB8ZW58MHx8MHx8fDA%3D",
    videoUrl: "https://assets.mixkit.co/videos/41576/41576-720.mp4",
    views: "9.7K views",
    uploadedAt: "1 month ago",
    duration: "09:05"
  },
  {
    id: "v5",
    title: "Disscussions on Current Market State",
    channel: "Community Build",
    thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://assets.mixkit.co/videos/4809/4809-720.mp4",
    views: "17K views",
    uploadedAt: "4 days ago",
    duration: "05:24"
  },
  {
    id: "v6",
    title: "Timelapse of Central Park",
    channel: "Product Notes",
    thumbnail: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Y2l0eXxlbnwwfHwwfHx8MA%3D%3D",
    videoUrl: "https://assets.mixkit.co/videos/3428/3428-720.mp4",
    views: "31K views",
    uploadedAt: "5 days ago",
    duration: "12:36"
  }
];

export const getVideo = (id: string) => videos.find((video) => video.id === id) ?? videos[0];

export const getNextVideo = (id: string) => {
  const index = videos.findIndex((video) => video.id === id);
  return videos[(index + 1 + videos.length) % videos.length];
};
