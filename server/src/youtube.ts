import { Router, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { AuthenticatedRequest, asyncHandler } from "./middleware.js";
import { authMiddleware } from "./auth.js";
import { prisma } from "./db.js";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from "./config.js";

const REDIRECT_URI = GOOGLE_REDIRECT_URI;

const router = Router();

const oauthClient = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  redirectUri: REDIRECT_URI,
});

function getAuthUrl(userId: number) {
  return oauthClient.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.force-ssl",
    ],
    state: userId.toString(),
    prompt: "consent",
  });
}

router.get("/auth-url", authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const url = getAuthUrl(req.userId);
  res.json({ url });
}));

router.post("/connect", authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: "Authorization code required" });
    return;
  }

  try {
    const { tokens } = await oauthClient.getToken(code as string);

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        youtubeToken: tokens.access_token || null,
        youtubeTokenExpiry: tokens.expiry_date
          ? Math.floor(Number(tokens.expiry_date) / 1000)
          : null,
      },
    });

    res.json({ connected: true });
  } catch (err) {
    console.error("YouTube OAuth connect error:", err);
    res.status(400).json({ error: "Failed to connect YouTube account" });
  }
}));

router.delete("/disconnect", authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await prisma.user.update({
    where: { id: req.userId },
    data: {
      youtubeToken: null,
      youtubeTokenExpiry: null,
    },
  });

  res.json({ connected: false });
}));

router.get("/status", authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { youtubeToken: true, youtubeTokenExpiry: true },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const connected = !!(
    user.youtubeToken &&
    user.youtubeTokenExpiry &&
    user.youtubeTokenExpiry > Math.floor(Date.now() / 1000)
  );

  res.json({ connected });
}));

interface YTVideo {
  id: string;
  title: string;
  creator: string;
  likes: number;
}

router.get("/reels", authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { youtubeToken: true, youtubeTokenExpiry: true },
  });

  if (!user?.youtubeToken) {
    res.json({ connected: false, videos: [] });
    return;
  }

  if (user.youtubeTokenExpiry && user.youtubeTokenExpiry < Math.floor(Date.now() / 1000)) {
    res.json({ connected: false, videos: [], expired: true });
    return;
  }

  try {
    const videos: YTVideo[] = [];
    const seenIds = new Set<string>();

    const likedRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?myRating=like&maxResults=15&part=snippet,statistics`,
      { headers: { Authorization: `Bearer ${user.youtubeToken}` } }
    );

    if (likedRes.ok) {
      const likedData = await likedRes.json();
      for (const item of likedData.items || []) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          videos.push({
            id: item.id,
            title: item.snippet?.title || "Untitled",
            creator: item.snippet?.channelTitle || "Unknown",
            likes: parseInt(item.statistics?.likeCount || "0", 10),
          });
        }
      }
    }

    const subsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/subscriptions?mine=true&maxResults=10&part=snippet`,
      { headers: { Authorization: `Bearer ${user.youtubeToken}` } }
    );

    if (subsRes.ok) {
      const subsData = await subsRes.json();
      const channelIds = (subsData.items || [])
        .map((item: { snippet: { channelId: string } }) => item.snippet.channelId)
        .filter(Boolean)
        .slice(0, 5);

      for (const channelId of channelIds) {
        try {
          const uploadRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&type=video&maxResults=3&order=date&part=snippet&videoDuration=short`,
            { headers: { Authorization: `Bearer ${user.youtubeToken}` } }
          );

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            for (const v of uploadData.items || []) {
              const vid = v.id?.videoId;
              if (vid && !seenIds.has(vid)) {
                seenIds.add(vid);
                videos.push({
                  id: vid,
                  title: v.snippet?.title || "Untitled",
                  creator: v.snippet?.channelTitle || "Unknown",
                  likes: 0,
                });
              }
            }
          }
        } catch { /* skip channel on error */ }
      }
    }

    const popularRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?chart=mostPopular&videoCategoryId=10&maxResults=10&part=snippet,statistics`,
      { headers: { Authorization: `Bearer ${user.youtubeToken}` } }
    );

    if (popularRes.ok) {
      const popData = await popularRes.json();
      for (const item of popData.items || []) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          videos.push({
            id: item.id,
            title: item.snippet?.title || "Untitled",
            creator: item.snippet?.channelTitle || "Unknown",
            likes: parseInt(item.statistics?.likeCount || "0", 10),
          });
        }
      }
    }

    res.json({ connected: true, videos });
  } catch (err) {
    console.error("YouTube reels fetch error:", err);
    res.json({ connected: true, videos: [] });
  }
}));

export default router;