# Jungly Satta 🎰

Pick a color. Place your bet. Pray to the RNG gods.

Red pays **3x** but hits less often. Green and Blue pay **2x** but come up more. That's the whole scam — I mean, *game*. Each round lasts 30 seconds, and you get locked out in the last 5 seconds so no last-second shenanigans.

Built with React + Vite up front, Express + Socket.IO in the back, and SQLite holding it all together.

## Quick Start

```bash
# Clone it
git clone https://github.com/sebastianthomas94/jungly-satta.git
cd jungly-satta

# Install everything (root, server, client)
npm install && cd server && npm install && cd ../client && npm install && cd ..

# Set up env files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Create the database
npm run db:push

# Fire it up
npm run dev
```

Backend runs on `http://localhost:3001`, frontend on `http://localhost:5173`.

## Environment Variables

### `server/.env`

```env
PORT=3001
DATABASE_URL="file:./dev.db"
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
JWT_SECRET=change-me-in-development        # pls change this lol
GOOGLE_CLIENT_ID=                          # Google OAuth
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/youtube/callback
RAZORPAY_KEY_ID=                            # Razorpay payments
RAZORPAY_KEY_SECRET=
ROUND_DURATION_MS=30000                      # round length
BETTING_CUTOFF_MS=5000                       # lockout before round ends
RESULT_DISPLAY_MS=3000                       # how long to show result
```

### `client/.env`

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=                       # same Google OAuth client ID
VITE_RAZORPAY_KEY_ID=                        # Razorpay public key
```

You'll need a [Google OAuth](https://console.cloud.google.com/apis/credentials) client ID to log in, and [Razorpay](https://dashboard.razorpay.com/) keys if you want real money stuff working. YouTube integration also needs Google credentials.

## Useful Commands

| What                              | Command              |
|-----------------------------------|----------------------|
| Run both server & client           | `npm run dev`         |
| Server only                        | `npm run dev:server`  |
| Client only                        | `npm run dev:client`  |
| Browse the database                | `npm run db:studio`   |
| Push schema changes                | `npm run db:push`     |
| Build client for production        | `cd client && npm run build` |
| Build server for production        | `cd server && npm run build` |

## How It Works

- Sign in with Google
- Deposit money (Razorpay) or use the demo wallet endpoint
- Pick Red (3x, 25%), Green (2x, 37.5%), or Blue (2x, 37.5%)
- Place your bet before the timer cuts you off
- Watch the dice roll, see if you won
- Repeat until rich or humble

Real-time updates flow through WebSockets — round starts, ticks, results, the whole deal shows up live without polling.

## Tech Stack

React 19 · Vite 8 · Tailwind CSS 4 · Express · Socket.IO · Prisma/SQLite · Google OAuth · Razorpay

## License

MIT