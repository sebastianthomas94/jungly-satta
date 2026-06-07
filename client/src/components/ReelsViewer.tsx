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
  const heartTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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
        style={{
          background: "var(--surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          padding: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setIsCollapsed(false)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem" }}>&#9654;&#65039;</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--gold)" }}>Watch Reels</span>
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
          Tap to expand
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "12px",
      border: "1px solid var(--border)",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.5rem 0.75rem",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "1rem" }}>&#127916;</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gold)" }}>Reels</span>
          {youtubeConnected ? (
            <button
              onClick={handleDisconnectYouTube}
              style={{
                fontSize: "0.6rem", background: "rgba(231,76,60,0.12)", color: "var(--red)",
                padding: "0.15rem 0.45rem", borderRadius: "10px",
                border: "none", cursor: "pointer", fontWeight: 600,
              }}
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnectYouTube}
              disabled={connecting}
              style={{
                fontSize: "0.6rem", background: connecting ? "var(--border)" : "rgba(52,152,219,0.12)",
                color: connecting ? "var(--text-dim)" : "var(--blue)",
                padding: "0.15rem 0.45rem", borderRadius: "10px",
                border: "none", cursor: connecting ? "not-allowed" : "pointer", fontWeight: 600,
              }}
            >
              {connecting ? "..." : "Connect YouTube"}
            </button>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            background: "none", border: "none", color: "var(--text-dim)",
            fontSize: "1.1rem", cursor: "pointer", padding: "0.1rem 0.3rem", lineHeight: 1,
          }}
        >
          &#8722;
        </button>
      </div>

      <div
        ref={scrollRef}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "9 / 16",
          maxHeight: "55vh",
          overflow: "hidden",
          background: "#000",
          cursor: "pointer",
        }}
        onClick={handleDoubleTap}
      >
        {currentVideo && (
          <iframe
            key={currentVideo.id}
            src={embedUrl}
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "177.78%",
              height: "100%",
              transform: "translate(-50%, -50%) scale(56.25%)",
              transformOrigin: "center center",
              border: "none",
              pointerEvents: showComments ? "none" : "auto",
            }}
          />
        )}

        {showHeart && (
          <div
            className="reels-heart-burst"
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "4.5rem", zIndex: 10, pointerEvents: "none",
            }}
          >
            &#10084;&#65039;
          </div>
        )}

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: "52px",
          padding: "0.75rem",
          background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
          zIndex: 6, pointerEvents: "none",
        }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff", marginBottom: "0.15rem" }}>
            @{currentVideo?.creator}
          </div>
          <div style={{
            fontSize: "0.7rem", color: "rgba(255,255,255,0.8)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {currentVideo?.title}
          </div>
          <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)", marginTop: "0.15rem" }}>
            {youtubeConnected ? "From your YouTube" : "Trending picks"}
          </div>
        </div>

        <div style={{
          position: "absolute", right: "0.4rem", bottom: "0.6rem",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.85rem",
          zIndex: 6,
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); toggleLike(); }}
            style={{
              background: "none", border: "none", display: "flex",
              flexDirection: "column", alignItems: "center", gap: "0.15rem",
              cursor: "pointer", padding: "0.2rem",
            }}
          >
            <span
              className={isLiked ? "reels-like-pop" : undefined}
              style={{
                fontSize: "1.4rem",
                filter: isLiked ? "none" : "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
                transition: "transform 0.15s ease",
              }}
            >
              {isLiked ? "\u2764\uFE0F" : "\u2661"}
            </span>
            <span style={{ fontSize: "0.65rem", color: "#fff", fontWeight: 600 }}>
              {formatCount(likeCount)}
            </span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
            style={{
              background: "none", border: "none", display: "flex",
              flexDirection: "column", alignItems: "center", gap: "0.15rem",
              cursor: "pointer", padding: "0.2rem",
            }}
          >
            <span style={{ fontSize: "1.4rem", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>
              {"\uD83D\uDCAC"}
            </span>
            <span style={{ fontSize: "0.65rem", color: "#fff", fontWeight: 600 }}>
              {formatCount(currentComments.length)}
            </span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (currentVideo) window.open(`https://youtube.com/watch?v=${currentVideo.id}`, "_blank");
            }}
            style={{
              background: "none", border: "none", display: "flex",
              flexDirection: "column", alignItems: "center", gap: "0.15rem",
              cursor: "pointer", padding: "0.2rem",
            }}
          >
            <span style={{ fontSize: "1.4rem", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>
              {"\uD83D\uDD17"}
            </span>
            <span style={{ fontSize: "0.6rem", color: "#fff", fontWeight: 500 }}>Open</span>
          </button>
        </div>

        {currentIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            style={{
              position: "absolute", top: "0.4rem", left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%",
              width: "24px", height: "24px", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", zIndex: 7,
              color: "#fff", fontSize: "0.7rem", padding: 0,
            }}
          >
            &#9650;
          </button>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          style={{
            position: "absolute", bottom: "0.4rem", left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%",
            width: "24px", height: "24px", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", zIndex: 7,
            color: "#fff", fontSize: "0.7rem", padding: 0,
          }}
        >
          &#9660;
        </button>
      </div>

      <div style={{
        padding: "0.4rem 0.75rem", borderBottom: showComments ? "1px solid var(--border)" : "none",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
      }}>
        {videos.slice(Math.max(0, currentIndex - 2), currentIndex + 5).map((v, idx) => {
          const realIdx = Math.max(0, currentIndex - 2) + idx;
          return (
            <button
              key={`${v.id}-${realIdx}`}
              onClick={() => setCurrentIndex(realIdx)}
              style={{
                width: realIdx === currentIndex ? "14px" : "5px",
                height: "5px", borderRadius: "2.5px",
                background: realIdx === currentIndex ? "var(--gold)" : "var(--border)",
                border: "none", cursor: "pointer",
                transition: "all 0.2s ease", padding: 0,
              }}
            />
          );
        })}
      </div>

      {showComments && (
        <div
          className="reels-comments-enter"
          style={{
            background: "var(--surface2)",
            maxHeight: "220px",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          <div style={{
            padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>
              {currentComments.length} Comment{currentComments.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setShowComments(false)}
              style={{
                background: "none", border: "none", color: "var(--text-dim)",
                fontSize: "0.9rem", cursor: "pointer", padding: "0.1rem 0.3rem", lineHeight: 1,
              }}
            >
              &#10005;
            </button>
          </div>

          <div style={{
            flex: 1, overflowY: "auto", padding: "0.4rem 0.75rem",
            display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "130px",
          }}>
            {currentComments.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-dim)", fontSize: "0.7rem", padding: "0.75rem 0" }}>
                No comments yet. Be the first!
              </div>
            )}
            {currentComments.map((c) => (
              <div key={c.id} style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  background: c.user === "You" ? "var(--gold)" : "var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.5rem", fontWeight: 700, flexShrink: 0,
                  color: c.user === "You" ? "#000" : "var(--text)",
                }}>
                  {c.user === "You" ? "Y" : c.user.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 600, color: c.user === "You" ? "var(--gold)" : "var(--text)" }}>
                      {c.user}
                    </span>
                    <span style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>
                      {timeAgo(c.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text)", wordBreak: "break-word" }}>
                    {c.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            padding: "0.4rem 0.75rem", borderTop: "1px solid var(--border)",
            display: "flex", gap: "0.4rem", alignItems: "center",
          }}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              placeholder="Add a comment..."
              maxLength={200}
              style={{
                flex: 1, background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: "16px", padding: "0.35rem 0.65rem",
                color: "var(--text)", fontSize: "0.7rem", outline: "none",
              }}
            />
            <button
              onClick={addComment}
              disabled={!commentText.trim()}
              style={{
                background: commentText.trim() ? "var(--gold)" : "var(--border)",
                border: "none", borderRadius: "50%", width: "26px", height: "26px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: commentText.trim() ? "pointer" : "not-allowed",
                color: commentText.trim() ? "#000" : "var(--text-dim)",
                fontSize: "0.8rem", padding: 0,
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