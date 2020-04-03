import io from 'socket.io-client';
import feathers from '@feathersjs/client';

let socketUri = window.realtimeChatUri || 'http://local.opinautos.com:3030';
console.log(`Using realtime socket at${socketUri}`);

const socket = io(socketUri, {transports: ['websocket']});
const client = feathers();
window.io = socket;

client.configure(feathers.socketio(socket, {
  timeout: 30000
}));

client.configure(feathers.authentication({
  storage: window.localStorage
}));

export default client;
