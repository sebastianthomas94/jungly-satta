import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket"] });
  }
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export interface RoundState {
  roundId: number;
  status: "BETTING" | "ROLLING" | "COMPLETED";
  timeRemaining: number;
  resultColor?: string;
}