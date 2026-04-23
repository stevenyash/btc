import { WebSocketServer } from 'ws';
import { Server } from 'http';

export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    (ws as any).isAlive = true;

    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('message', (message) => {
      console.log('Received:', message);

      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(`Echo: ${message}`);
        }
      });
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  setInterval(() => {
    wss.clients.forEach((client) => {
      if (!(client as any).isAlive) {
        return client.terminate();
      }

      (client as any).isAlive = false;
      client.ping();
    });
  }, 30000);

  return wss;
}

export default setupWebSocket;