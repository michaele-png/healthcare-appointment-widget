import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app.js';

const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: (process.env.ALLOWED_ORIGINS || '*').split(',') } });
app.set('io', io);

io.on('connection', () => {});

server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
