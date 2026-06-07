# Jungly Satta

A real-time color betting game built with a **React + Vite** frontend and an **Express + Socket.IO** backend. Players bet on colors (Red, Green, Blue) each round — Red pays 3x, Green and Blue pay 2x. Includes Google OAuth login, Razorpay payments, YouTube integration, and live game state via WebSockets.

## Architecture

```
jungly-satta/
├── client/          React 19 + Vite + Tailwind CSS 4
│   └── src/
│       ├── pages/       Game, Login, Wallet, YouTubeCallback
│       ├── components/  BetForm, ColorCards, GameTimer, RollingDice, etc.
│       └── lib/         api, auth, socket, gameContext, hooks, constants
└── server/          Express + Socket.IO + Prisma (SQLite)
    └── src/
        ├── index.ts        Entry point – HTTP + WebSocket server
        ├── game.ts          Core game loop & round lifecycle
        ├── gameRoutes.ts    Game state, history, leaderboard
        ├── auth.ts          Google OAuth + JWT auth
        ├── wallet.ts        Balance, deposits, withdrawals
        ├── bets.ts          Place bets, bet history
        ├── payment.ts       Razorpay order creation & verification
        ├── youtube.ts       YouTube OAuth connect & reels feed
        ├── middleware.ts     Auth middleware & async handler
        ├── config.ts        Environment configuration
        └── db.ts            Prisma client singleton
```

## Game Mechanics

| Color   | Payout | Weight (probability) |
|---------|--------|----------------------|
| Red     | 3x     | 2/8 (25%)            |
| Green   | 2x     | 3/8 (37.5%)          |
| Blue    | 2x     | 3/8 (37.5%)          |

- **Round duration**: 30 seconds (configurable via `ROUND_DURATION_MS`)
- **Betting cutoff**: Last 5 seconds before round resolves (configurable via `BETTING_CUTOFF_MS`)
- One bet per user per round
- Winners receive their bet multiplied by the color's payout

## API Reference

All endpoints are prefixed with `/api`.

### Auth (`/api/auth`)

| Method | Endpoint       | Auth | Description                    |
|--------|---------------|------|--------------------------------|
| POST   | `/auth/google`  | No   | Sign in/up with Google ID token |
| GET    | `/auth/me`      | Yes  | Get current user profile        |

### Wallet (`/api/wallet`)

| Method | Endpoint            | Auth | Description           |
|--------|--------------------|------|-----------------------|
| GET    | `/wallet/balance`    | Yes  | Get user balance      |
| POST   | `/wallet/deposit`    | Yes  | Add funds (demo)       |
| POST   | `/wallet/withdraw`   | Yes  | Withdraw funds         |
| GET    | `/wallet/transactions` | Yes | Recent transactions   |

### Bets (`/api/bets`)

| Method | Endpoint              | Auth | Description                    |
|--------|----------------------|------|--------------------------------|
| POST   | `/bets/place`         | Yes  | Place a bet on a color          |
| GET    | `/bets/history`        | Yes  | User's bet history (last 50)    |
| GET    | `/bets/current-round-bet` | Yes | Get user's bet for current round |

### Game (`/api/game`)

| Method | Endpoint               | Auth | Description                |
|--------|-----------------------|------|----------------------------|
| GET    | `/game/state`          | No   | Current round state & config |
| GET    | `/game/history`        | No   | Last 20 completed rounds     |
| GET    | `/game/leaderboard`    | No   | Top 20 players by winnings   |
| GET    | `/game/round/:roundId/winners` | No | Winners for a round |

### Payment (`/api/payment`)

| Method | Endpoint             | Auth | Description                        |
|--------|---------------------|------|------------------------------------|
| POST   | `/payment/create-order` | Yes | Create a Razorpay order for deposit |
| POST   | `/payment/verify`       | Yes | Verify & complete a payment         |

### YouTube (`/api/youtube`)

| Method | Endpoint            | Auth | Description                      |
|--------|--------------------|------|----------------------------------|
| GET    | `/youtube/auth-url`  | Yes  | Get YouTube OAuth consent URL     |
| POST   | `/youtube/connect`   | Yes  | Connect YouTube with auth code    |
| DELETE | `/youtube/disconnect` | Yes  | Disconnect YouTube account       |
| GET    | `/youtube/status`    | Yes  | Check YouTube connection status   |
| GET    | `/youtube/reels`     | Yes  | Fetch personalized video feed     |

## WebSocket Events

The server pushes real-time game updates via Socket.IO:

| Event           | Direction    | Description                        |
|-----------------|-------------|------------------------------------|
| `game:subscribe`  | Client → Server | Subscribe to game updates          |
| `round:current`   | Server → Client | Current round state on connect     |
| `round:new`       | Server → Client | New round started                  |
| `round:tick`      | Server → Client | Timer countdown (every second)     |
| `round:closing`   | Server → Client | Betting is closing                 |
| `round:rolling`   | Server → Client | Dice are rolling, result revealed  |
| `round:result`   | Server → Client | Round result with winners list     |

## Prisma Schema

Four models power the database:

- **User** — Google OAuth identity, balance, YouTube token
- **Round** — Game rounds with result color and status
- **Bet** — Per-user per-round bets with payout tracking
- **Transaction** — Deposit, withdrawal, win, and bet ledger entries
- **Payment** — Razorpay order tracking with verification

## Tech Stack

| Layer       | Technology                                  |
|-------------|---------------------------------------------|
| Frontend    | React 19, Vite 8, Tailwind CSS 4            |
| Backend     | Express 4, Socket.IO 4, TypeScript          |
| Database    | SQLite via Prisma 6                         |
| Auth        | Google OAuth 2.0 + JWT                      |
| Payments    | Razorpay                                    |
| YouTube     | YouTube Data API v3 (OAuth)                 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/jungly-satta.git
cd jungly-satta
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2. Configure environment variables

Copy the example env files and fill in your credentials:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

See [Environment Variables](#environment-variables) for details.

### 3. Set up the database

```bash
npm run db:push
```

### 4. Run the development servers

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently.

## Environment Variables

### Server (`server/.env`)

| Variable               | Default                            | Description                       |
|------------------------|------------------------------------|-----------------------------------|
| `PORT`                  | `3001`                             | Server port                       |
| `DATABASE_URL`          | `file:./dev.db`                    | Prisma database connection string |
| `CORS_ORIGINS`          | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `JWT_SECRET`            | `change-me-in-development`         | Secret for signing JWT tokens     |
| `GOOGLE_CLIENT_ID`      | —                                  | Google OAuth client ID            |
| `GOOGLE_CLIENT_SECRET`  | —                                  | Google OAuth client secret        |
| `GOOGLE_REDIRECT_URI`   | `http://localhost:5173/auth/youtube/callback` | YouTube OAuth redirect URI |
| `RAZORPAY_KEY_ID`       | —                                  | Razorpay API key ID               |
| `RAZORPAY_KEY_SECRET`   | —                                  | Razorpay API key secret           |
| `ROUND_DURATION_MS`     | `30000`                            | Duration of each betting round    |
| `BETTING_CUTOFF_MS`     | `5000`                            | Time before round end when betting closes |
| `RESULT_DISPLAY_MS`     | `3000`                            | Time to display result before next round |

### Client (`client/.env`)

| Variable               | Default                  | Description                      |
|------------------------|--------------------------|----------------------------------|
| `VITE_BACKEND_URL`      | `http://localhost:3001`  | Backend API base URL             |
| `VITE_GOOGLE_CLIENT_ID` | —                        | Google OAuth client ID           |
| `VITE_RAZORPAY_KEY_ID`  | —                        | Razorpay key ID (for checkout)   |

## Project Scripts

### Root

| Command            | Description                          |
|--------------------|--------------------------------------|
| `npm run dev`       | Start both server & client dev servers |
| `npm run dev:server`| Start backend dev server only         |
| `npm run dev:client`| Start frontend dev server only        |
| `npm run db:push`   | Push Prisma schema to the database   |
| `npm run db:studio` | Open Prisma Studio                    |

### Server

| Command              | Description                       |
|----------------------|-----------------------------------|
| `npm run dev`         | Start with tsx watch (hot reload) |
| `npm run build`       | Compile TypeScript to dist/       |
| `npm run start`       | Run compiled JS from dist/        |
| `npm run db:push`    | Push schema changes               |
| `npm run db:studio`  | Open Prisma database browser      |
| `npm run db:migrate` | Run Prisma migrations             |

### Client

| Command            | Description                    |
|--------------------|--------------------------------|
| `npm run dev`       | Start Vite dev server          |
| `npm run build`    | Build for production           |
| `npm run lint`     | Run ESLint                     |
| `npm run preview`  | Preview production build        |

## License

MIT