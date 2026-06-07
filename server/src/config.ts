export const PORT = process.env.PORT || 3001;

export const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

export const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-development";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/auth/youtube/callback";

export const ROUND_DURATION_MS = Number(process.env.ROUND_DURATION_MS) || 30000;
export const BETTING_CUTOFF_MS = Number(process.env.BETTING_CUTOFF_MS) || 5000;
export const RESULT_DISPLAY_MS = Number(process.env.RESULT_DISPLAY_MS) || 3000;

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";