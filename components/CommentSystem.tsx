import { useEffect, useMemo, useState } from "react";
import { Languages, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { storage } from "@/lib/storage";
import type { Comment } from "@/lib/types";

// Seed comments only written once on a fresh install
const seedComments: Comment[] = [
  {
    id: "c1",
    videoId: "v1",
    userId: "seed-aarav",
    author: "Aarav Mehta",
    city: "Mumbai",
    text: "Great Video",
    createdAt: "2026-06-01T10:00:00.000Z",
    votes: {
      "seed-like-1": "like",
      "seed-like-2": "like",
      "seed-like-3": "like",
    },
  },
  {
    id: "c2",
    videoId: "v1",
    userId: "seed-meera",
    author: "Meera Nair",
    city: "Kochi",
    text: "Very useful explanation",
    createdAt: "2026-06-02T10:00:00.000Z",
    votes: { "seed-like-4": "like", "seed-like-5": "like" },
  },
];

const countVotes = (comment: Comment, type: "like" | "dislike") =>
  Object.values(comment.votes || {}).filter((v) => v === type).length;

export function CommentSystem({ videoId }: { videoId: string }) {
  const { user, selectedLanguage, setSelectedLanguage, isLightTheme } =
    useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  // translations: commentId → translated string
  const [translations, setTranslations] = useState<Record<string, string>>({});
  // loading state per comment id
  const [translating, setTranslating] = useState<Record<string, boolean>>({});

  // Load comments — seed only when the global store is empty
  useEffect(() => {
    const load = window.setTimeout(() => {
      const stored = storage.comments.all();
      if (stored.length === 0) {
        storage.comments.saveAll(seedComments);
        setComments(seedComments.filter((c) => c.videoId === videoId));
      } else {
        setComments(stored.filter((c) => c.videoId === videoId));
      }
    }, 0);
    return () => window.clearTimeout(load);
  }, [videoId]);

  // When language changes, clear existing translations so they are re-fetched
  useEffect(() => {
    setTranslations({});
  }, [selectedLanguage]);

  const visibleComments = useMemo(
    () => comments.filter((c) => countVotes(c, "dislike") < 2),
    [comments],
  );

  const persistComments = (nextVideoComments: Comment[]) => {
    const all = storage.comments.all();
    const others = all.filter((c) => c.videoId !== videoId);
    storage.comments.saveAll([...nextVideoComments, ...others]);
    setComments(nextVideoComments);
  };

  const addComment = () => {
    setError("");
    if (!user) {
      setError("Please login before commenting.");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Comment cannot be empty.");
      return;
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) {
      setError("Special characters are blocked in comments.");
      return;
    }
    const newComment: Comment = {
      id: crypto.randomUUID(),
      videoId,
      userId: user._id,
      author: user.name,
      city: user.city || "Unknown City",
      text: trimmed,
      createdAt: new Date().toISOString(),
      votes: {},
    };
    persistComments([newComment, ...comments]);
    setText("");
  };

  const vote = (id: string, type: "like" | "dislike") => {
    setError("");
    if (!user) {
      setError("Please login before voting.");
      return;
    }
    const nextComments = comments
      .map((c) => {
        if (c.id !== id) return c;
        const votes = { ...(c.votes || {}) };
        if (votes[user._id] === type) {
          delete votes[user._id];
        } else {
          votes[user._id] = type;
        }
        return { ...c, votes };
      })
      .filter((c) => countVotes(c, "dislike") < 2);
    persistComments(nextComments);
  };

  // Call the /api/translate route for the selected language
  const translate = async (comment: Comment) => {
    if (selectedLanguage === "English") {
      setTranslations((prev) => ({ ...prev, [comment.id]: comment.text }));
      return;
    }

    setTranslating((prev) => ({ ...prev, [comment.id]: true }));
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: comment.text,
          language: selectedLanguage,
        }),
      });
      const data = (await res.json()) as { translation: string };
      setTranslations((prev) => ({ ...prev, [comment.id]: data.translation }));
    } catch {
      setTranslations((prev) => ({
        ...prev,
        [comment.id]: `${comment.text} [${selectedLanguage}]`,
      }));
    } finally {
      setTranslating((prev) => ({ ...prev, [comment.id]: false }));
    }
  };

  return (
    <section id="comments" className="mt-8">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Comments</h2>

        {/* Language dropdown */}
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

      {/* Comment input */}
      <div className="flex gap-2">
<input
  value={text}
  onChange={(e) => setText(e.target.value)}
  onKeyDown={(e) => e.key === "Enter" && addComment()}
  className={`min-w-0 flex-1 rounded border px-3 py-2 outline-none focus:border-brand/50 ${
    isLightTheme
      ? "border-black/20 bg-white text-black placeholder:text-gray-500"
      : "border-white/10 bg-white/10 text-white placeholder:text-white/40"
  }`}
  placeholder="Add a comment"
/>
        <button
          onClick={addComment}
          className="rounded bg-brand px-4 py-2 font-semibold text-white transition hover:opacity-90"
        >
          Post
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {/* Comments list */}
      <div className="mt-5 space-y-4">
        {visibleComments.length === 0 && (
          <p className="text-sm text-muted">No comments yet. Be the first!</p>
        )}

        {visibleComments.map((comment) => {
          const currentVote = user ? comment.votes?.[user._id] : undefined;
          const likeCount = countVotes(comment, "like");
          const dislikeCount = countVotes(comment, "dislike");
          const isTranslating = translating[comment.id];

          return (
            <article
              key={comment.id}
              className="rounded border border-white/10 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{comment.author}</p>
                  {comment.city && (
                    <p className="text-xs text-muted">{comment.city}</p>
                  )}
                  <p className="text-xs text-muted/60">
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Like / Dislike — mutually exclusive */}
                <div className="flex gap-2">
                  <button
                    onClick={() => vote(comment.id, "like")}
                    title="Like"
                    className={`flex items-center gap-1 rounded px-2 py-1 text-sm transition hover:bg-white/10 ${
                      currentVote === "like"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "text-muted"
                    }`}
                  >
                    <ThumbsUp size={15} />
                    <span>{likeCount}</span>
                  </button>
                  <button
                    onClick={() => vote(comment.id, "dislike")}
                    title="Dislike"
                    className={`flex items-center gap-1 rounded px-2 py-1 text-sm transition hover:bg-white/10 ${
                      currentVote === "dislike"
                        ? "bg-brand/20 text-brand"
                        : "text-muted"
                    }`}
                  >
                    <ThumbsDown size={15} />
                    <span>{dislikeCount}</span>
                  </button>
                </div>
              </div>

              {/* Original text — never replaced */}
              <p className="mt-3 text-sm leading-relaxed">{comment.text}</p>

              {/* Translate button */}
              <button
                onClick={() => translate(comment)}
                disabled={isTranslating}
                className="mt-3 flex items-center gap-2 rounded border border-white/10 px-3 py-1.5 text-xs text-muted transition hover:bg-white/10 disabled:opacity-60"
              >
                {isTranslating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Languages size={14} />
                )}
                {isTranslating
                  ? "Translating…"
                  : `Translate to ${selectedLanguage}`}
              </button>

              {/* Translation result */}
              {translations[comment.id] && (
                <p className="mt-2 rounded bg-white/5 px-3 py-2 text-sm italic text-muted">
                  {translations[comment.id]}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
