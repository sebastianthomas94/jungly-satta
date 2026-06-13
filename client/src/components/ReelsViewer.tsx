import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../lib/api";

interface YTVideo {
  id: string;
  title: string;
  creator: string;
  likes: number;
}

interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

const FALLBACK_VIDEOS: YTVideo[] = [
  { id: "dQw4w9WgXcQ", title: "Never Gonna Give You Up", creator: "Rick Astley", likes: 15200 },
  { id: "jNQXAC9IVRw", title: "Me at the zoo", creator: "jawed", likes: 12800 },
  { id: "9bZkp7q19f0", title: "Gangnam Style", creator: "officialpsy", likes: 23100 },
  { id: "kJQP7kiw5Fk", title: "Despacito", creator: "Luis Fonsi", likes: 19400 },
  { id: "RgKAFK5dj16", title: "See You Again", creator: "Wiz Khalifa", likes: 17600 },
  { id: "JGwWNGJdvx8", title: "Shape of You", creator: "Ed Sheeran", likes: 14900 },
  { id: "fJ9rUzIMcZQ", title: "Bohemian Rhapsody", creator: "Queen Official", likes: 21300 },
  { id: "hT_nvWreIhg", title: "Counting Stars", creator: "OneRepublic", likes: 11200 },
  { id: "OPf0YbXqDm0", title: "Uptown Funk", creator: "Mark Ronson", likes: 16800 },
  { id: "YQHsXMglC9A", title: "Hello", creator: "Adele", likes: 13500 },
];

const STORAGE_KEY_LIKES = "reels_likes";
const STORAGE_KEY_COMMENTS = "reels_comments";

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function loadLikes(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIKES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLikes(likes: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(likes));
}

function loadComments(): Record<string, Comment[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMMENTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveComments(comments: Record<string, Comment[]>) {
  localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(comments));
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function ReelsViewer() {
  const [videos, setVideos] = useState<YTVideo[]>(() => shuffleArray(FALLBACK_VIDEOS));
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likes, setLikes] = useState<Record<string, boolean>>(loadLikes);
  const [comments, setComments] = useState<Record<string, Comment[]>>(loadComments);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showHeart, setShowHeart] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastTapRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const heartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartYRef = useRef<number>(0);

  useEffect(() => { saveLikes(likes); }, [likes]);
  useEffect(() => { saveComments(comments); }, [comments]);

  const loadYouTubeReels = useCallback(() => {
    api.youtube.status().then((data: { connected: boolean }) => {
      setYoutubeConnected(data.connected);
      if (data.connected) {
        api.youtube.reels().then((res: { connected: boolean; videos: YTVideo[] }) => {
          if (res.connected && res.videos.length > 0) {
            setVideos(res.videos);
          }
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadYouTubeReels();
    window.addEventListener("youtube-connected", loadYouTubeReels);
    return () => window.removeEventListener("youtube-connected", loadYouTubeReels);
  }, [loadYouTubeReels]);

  const handleConnectYouTube = useCallback(async () => {
    try {
      setConnecting(true);
      const data = await api.youtube.authUrl() as { url: string };
      const popup = window.open(data.url, "youtube-auth", "width=500,height=600,left=200,top=100");
      if (!popup) {
        window.location.href = data.url;
      }
    } catch {
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "youtube-connected") {
        loadYouTubeReels();
        setConnecting(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [loadYouTubeReels]);

  const handleDisconnectYouTube = useCallback(async () => {
    try {
      await api.youtube.disconnect();
      setYoutubeConnected(false);
      setVideos(shuffleArray(FALLBACK_VIDEOS));
      setCurrentIndex(0);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (currentIndex >= videos.length - 2) {
      setVideos((prev) => [...prev, ...shuffleArray(prev.length <= 15 ? FALLBACK_VIDEOS : prev)]);
    }
  }, [currentIndex, videos.length]);

  const currentVideo = videos[currentIndex];
  const isLiked = currentVideo ? !!likes[currentVideo.id] : false;
  const currentComments = currentVideo ? (comments[currentVideo.id] || []) : [];
  const likeCount = (currentVideo?.likes ?? 0) + (isLiked ? 1 : 0);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setShowComments(false);
    setCommentText("");
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let cooldown = false;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (cooldown) return;
      cooldown = true;
      setTimeout(() => { cooldown = false; }, 400);
      if (e.deltaY > 0) goNext();
      else goPrev();
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [goNext, goPrev]);

  const handleDoubleTap = useCallback(() => {
    if (!currentVideo) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        setLikes((prev) => ({ ...prev, [currentVideo.id]: true }));
      }
      setShowHeart(true);
      if (heartTimeoutRef.current) clearTimeout(heartTimeoutRef.current);
      heartTimeoutRef.current = setTimeout(() => setShowHeart(false), 800);
    }
    lastTapRef.current = now;
  }, [isLiked, currentVideo]);

  const toggleLike = useCallback(() => {
    if (!currentVideo) return;
    setLikes((prev) => ({ ...prev, [currentVideo.id]: !prev[currentVideo.id] }));
  }, [currentVideo]);

  const addComment = useCallback(() => {
    if (!currentVideo || !commentText.trim()) return;
    const newComment: Comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      user: "You",
      text: commentText.trim(),
      timestamp: Date.now(),
    };
    setComments((prev) => ({
      ...prev,
      [currentVideo.id]: [...(prev[currentVideo.id] || []), newComment],
    }));
    setCommentText("");
  }, [commentText, currentVideo]);

  const handleCommentKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        addComment();
      }
    },
    [addComment],
  );

  const embedUrl = currentVideo
    ? `https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&mute=1&loop=1&playsinline=1&rel=0&modestbranding=1&controls=0`
    : "";

  if (isCollapsed) {
    return (
      <div
        className="bg-surface rounded-xl border border-border p-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsCollapsed(false)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">&#9654;&#65039;</span>
          <span className="text-[0.85rem] font-semibold text-gold">Watch Reels</span>
        </div>
        <span className="text-xs text-text-dim">
          Tap to expand
        </span>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="flex justify-between items-center py-2 px-3 border-b border-border">
        <div className="flex items-center gap-[0.4rem]">
          <span className="text-base">&#127916;</span>
          <span className="text-[0.85rem] font-bold text-gold">Reels</span>
          {youtubeConnected ? (
            <button
              onClick={handleDisconnectYouTube}
              className="text-[0.6rem] bg-red/12 text-red px-[0.45rem] py-[0.15rem] rounded-full border-none cursor-pointer font-semibold"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnectYouTube}
              disabled={connecting}
              className="text-[0.6rem] border-none rounded-full px-[0.45rem] py-[0.15rem] cursor-pointer font-semibold"
              style={{
                background: connecting ? "var(--color-border)" : "rgba(255,215,0,0.12)",
                color: connecting ? "var(--color-text-dim)" : "var(--color-blue)",
                pointerEvents: connecting ? "none" : "auto",
              }}
            >
              {connecting ? "..." : "Connect YouTube"}
            </button>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="bg-none border-none text-text-dim text-[1.1rem] cursor-pointer py-[0.1rem] px-[0.3rem] leading-none"
        >
          &#8722;
        </button>
      </div>

      <div
        ref={scrollRef}
        className="relative w-full aspect-[9/16] max-h-[70vh] overflow-hidden bg-black cursor-pointer"
        onClick={handleDoubleTap}
        onTouchStart={(e) => { touchStartYRef.current = e.touches[0].clientY; }}
        onTouchEnd={(e) => {
          const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
          if (Math.abs(deltaY) > 50) {
            if (deltaY > 0) goNext();
            else goPrev();
          }
        }}
      >
        {currentVideo && (
          <iframe
            key={currentVideo.id}
            src={embedUrl}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute top-1/2 left-1/2 w-[177.78%] h-full -translate-x-1/2 -translate-y-1/2 scale-[0.5625] origin-center border-none"
            style={{ pointerEvents: showComments ? "none" : "auto" }}
          />
        )}

        {showHeart && (
          <div
            className="animate-reels-heart-burst absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[4.5rem] z-10 pointer-events-none"
            style={{ color: "#ff2d55", filter: "drop-shadow(0 0 10px rgba(255,45,85,0.6))" }}
          >
            &#10084;&#65039;
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-[44px] py-3 px-3 z-[6] pointer-events-none max-[767px]:right-[44px]"
          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}
        >
          <div className="text-[0.8rem] font-bold text-white mb-[0.15rem]">
            @{currentVideo?.creator}
          </div>
          <div className="text-[0.7rem] text-white/80 overflow-hidden text-ellipsis whitespace-nowrap">
            {currentVideo?.title}
          </div>
          <div className="text-[0.6rem] text-white/50 mt-[0.15rem]">
            {youtubeConnected ? "From your YouTube" : "Trending picks"}
          </div>
        </div>

        <div className="absolute right-[0.4rem] bottom-[0.6rem] flex flex-col items-center gap-[0.65rem] z-[6] max-[767px]:gap-[0.65rem]">
          <button
            onClick={(e) => { e.stopPropagation(); toggleLike(); }}
            className="bg-none border-none flex flex-col items-center gap-[0.15rem] cursor-pointer py-[0.2rem]"
          >
            <span
              className={isLiked ? "animate-reels-like-pop" : undefined}
              style={{
                fontSize: "1.4rem",
                filter: isLiked ? "none" : "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
                transition: "transform 0.15s ease",
              }}
            >
              {isLiked ? "\u2764\uFE0F" : "\u2661"}
            </span>
            <span className="text-[0.65rem] text-white font-semibold">
              {formatCount(likeCount)}
            </span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
            className="bg-none border-none flex flex-col items-center gap-[0.15rem] cursor-pointer py-[0.2rem]"
          >
            <span className="text-[1.4rem]" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>
              {"\uD83D\uDCAC"}
            </span>
            <span className="text-[0.65rem] text-white font-semibold">
              {formatCount(currentComments.length)}
            </span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (currentVideo) window.open(`https://youtube.com/watch?v=${currentVideo.id}`, "_blank");
            }}
            className="bg-none border-none flex flex-col items-center gap-[0.15rem] cursor-pointer py-[0.2rem]"
          >
            <span className="text-[1.4rem]" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>
              {"\uD83D\uDD17"}
            </span>
            <span className="text-[0.6rem] text-white font-medium">Open</span>
          </button>
        </div>

        {currentIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute top-[0.4rem] left-1/2 -translate-x-1/2 bg-black/45 border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer z-[7] text-white text-[0.7rem] p-0"
          >
            &#9650;
          </button>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute bottom-[0.4rem] left-1/2 -translate-x-1/2 bg-black/45 border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer z-[7] text-white text-[0.7rem] p-0"
        >
          &#9660;
        </button>
      </div>

      <div
        className="py-[0.4rem] px-3 flex items-center justify-center gap-[0.35rem]"
        style={{ borderBottom: showComments ? "1px solid var(--color-border)" : "none" }}
      >
        {videos.slice(Math.max(0, currentIndex - 2), currentIndex + 5).map((v, idx) => {
          const realIdx = Math.max(0, currentIndex - 2) + idx;
          return (
            <button
              key={`${v.id}-${realIdx}`}
              onClick={() => setCurrentIndex(realIdx)}
              className="h-[5px] rounded-[2.5px] border-none cursor-pointer transition-all duration-200"
              style={{
                width: realIdx === currentIndex ? "14px" : "5px",
                background: realIdx === currentIndex ? "var(--color-gold)" : "var(--color-border)",
                padding: 0,
              }}
            />
          );
        })}
      </div>

      {showComments && (
        <div
          className="animate-reels-comments-enter bg-surface2 flex flex-col overflow-hidden"
          style={{ maxHeight: "220px" }}
        >
          <div className="py-[0.5rem] px-3 border-b border-border flex justify-between items-center">
            <span className="text-[0.75rem] font-bold">
              {currentComments.length} Comment{currentComments.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setShowComments(false)}
              className="bg-none border-none text-text-dim text-[0.9rem] cursor-pointer py-[0.1rem] px-[0.3rem] leading-none"
            >
              &#10005;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-[0.4rem] px-3 flex flex-col gap-[0.4rem] max-h-[130px]">
            {currentComments.length === 0 && (
              <div className="text-center text-text-dim text-[0.7rem] py-3">
                No comments yet. Be the first!
              </div>
            )}
            {currentComments.map((c) => (
              <div key={c.id} className="flex gap-[0.4rem] items-start">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[0.5rem] font-bold shrink-0"
                  style={{
                    background: c.user === "You" ? "var(--color-gold)" : "var(--color-border)",
                    color: c.user === "You" ? "#000" : "var(--color-text)",
                  }}
                >
                  {c.user === "You" ? "Y" : c.user.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-[0.3rem]">
                    <span className="text-[0.65rem] font-semibold" style={{ color: c.user === "You" ? "var(--color-gold)" : "var(--color-text)" }}>
                      {c.user}
                    </span>
                    <span className="text-[0.55rem] text-text-dim">
                      {timeAgo(c.timestamp)}
                    </span>
                  </div>
                  <div className="text-[0.7rem] text-text break-words">
                    {c.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="py-[0.4rem] px-3 border-t border-border flex gap-[0.4rem] items-center">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              placeholder="Add a comment..."
              maxLength={200}
              className="flex-1 bg-bg border border-border rounded-2xl py-[0.35rem] px-[0.65rem] text-text text-[0.7rem] outline-none"
            />
            <button
              onClick={addComment}
              disabled={!commentText.trim()}
              className="border-none rounded-full w-[26px] h-[26px] flex items-center justify-center text-[0.8rem] p-0"
              style={{
                background: commentText.trim() ? "var(--color-gold)" : "var(--color-border)",
                color: commentText.trim() ? "#000" : "var(--color-text-dim)",
                cursor: commentText.trim() ? "pointer" : "not-allowed",
              }}
            >
              &#8593;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}