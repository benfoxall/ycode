import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

// don't allow hot reloading of this file
if (import.meta.hot) {
  import.meta.hot.decline();
}

interface YI {
  doc: Y.Doc;
  provider: WebrtcProvider;
  room: string;
  initiator: boolean;
}

const key = ':room:';

let initiator = true;
let room =
  sessionStorage.getItem(key) ||
  [
    Math.random().toString(32).slice(2),
    Math.random().toString(32).slice(2),
  ].join('~');

sessionStorage.setItem(key, room);

if (location.search) {
  initiator = false;
  room = location.search.slice(1);
}

const doc = new Y.Doc();

const [name, password] = room.split('~');

// @ts-expect-error
// WebrtcProvider expects full Opts object, though it seems that Partial<Opts> works okay
const provider = new WebrtcProvider(name, doc, { password, signaling: ['wss://y-ben.fly.dev'] });

const config: YI = { room, doc, provider, initiator };

export default config;
