
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

interface YI {
  doc: Y.Doc;
  provider: WebrtcProvider;
  room: string;
  initiator: boolean;
}

const key = ':room:'

// cache because hmr
const wat = window as any;
if(!wat.yi) {
  let initiator = true;
  let room = sessionStorage.getItem(key) || [
    Math.random().toString(32).slice(2),
    Math.random().toString(32).slice(2),
  ].join('~');

  sessionStorage.setItem(key, room);

  if(location.search) {
    initiator = false;
    room = location.search.slice(1);
  }

  const doc = new Y.Doc();

  const [name, password] = room.split('~');
  // @ts-expect-error
  const provider = new WebrtcProvider(name, doc, { password });

  wat.yi = { room, doc, provider, initiator } as YI;
}

const config = wat.yi as YI;

export default config;