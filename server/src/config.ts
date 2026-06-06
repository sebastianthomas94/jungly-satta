export const PORT = process.env.PORT || 3001;

export const CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"];

export const JWT_SECRET = process.env.JWT_SECRET || "jungly-satta-secret-change-in-prod";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "643362371367-ci57ulekvp6saqhq3o2n1k1mmjiurk8l.apps.googleusercontent.com";

export const ROUND_DURATION_MS = 30000;
export const BETTING_CUTOFF_MS = 5000;
export const RESULT_DISPLAY_MS = 3000;