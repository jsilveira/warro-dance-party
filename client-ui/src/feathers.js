import { feathers } from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'
import authentication from '@feathersjs/authentication-client'

let socketUri = 'http://local.opinautos.com:3030';
// let socketUri = window.realtimeChatUri || 'https://warro-dance-party.herokuapp.com';
// let socketUri = window.realtimeChatUri || 'https://warro-dance-party.herokuapp.com';
console.log(`✅ Using realtime sockets at ${socketUri}`);
window.socketUri = socketUri;

const socket = io(socketUri, {
  transports: ['websocket'],
  timeout: 30000
});

const app = feathers();
window.io = socket;

app.configure(socketio(socket));

app.configure(authentication({
  storage: window.localStorage,
  storageKey: 'feathers-jwt'
}));

export default app;
