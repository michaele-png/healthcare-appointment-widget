import { io, Socket } from 'socket.io-client';
let socket: Socket | null = null;
export function getSocket(base = import.meta.env.VITE_API_BASE as string){
  if (!socket) socket = io(base, { transports: ['websocket'] });
  return socket;
}
