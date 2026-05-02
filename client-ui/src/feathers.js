import { feathers } from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'
import authentication from '@feathersjs/authentication-client'

// Connection target resolution:
//   1. window.realtimeChatUri (runtime override, e.g. injected by embedder)
//   2. VITE_API_URL (build/dev env, e.g. `npm run dev:prod` points at production)
//   3. same-origin — in dev this goes through Vite's proxy to the local server;
//      in production the UI is served by the server itself.
const apiUrl = window.realtimeChatUri || import.meta.env.VITE_API_URL || undefined;
if (apiUrl) {
  console.log(`✅ Using realtime sockets at ${apiUrl}`);
} else {
  console.log(`✅ Using realtime sockets at same origin (${window.location.origin})`);
}
window.socketUri = apiUrl || window.location.origin;

const socket = apiUrl
  ? io(apiUrl, { transports: ['websocket'], timeout: 30000 })
  : io({ transports: ['websocket'], timeout: 30000 });

const app = feathers();
window.io = socket;

app.configure(socketio(socket));

app.configure(authentication({
  storage: window.localStorage,
  storageKey: 'feathers-jwt'
}));

export default app;
