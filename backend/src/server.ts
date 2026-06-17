import http from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { env } from './config/env';
import { attachSocketHandlers } from './realtime/socket';
import { startDocumentWorker } from './jobs/document-worker';
import { startAnalyticsWorker } from './jobs/analytics-worker';

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

attachSocketHandlers(io);
startDocumentWorker();
startAnalyticsWorker();

server.listen(env.PORT, () => {
  console.log(`SupportGPT backend listening on http://localhost:${env.PORT}`);
});
