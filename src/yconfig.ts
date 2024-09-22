import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

// don't allow hot reloading of this file
if (import.meta.hot) {
  import.meta.hot.decline();
}

interface YI {
  doc: Y.Doc;
  provider: Promise<WebrtcProvider>;
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

const provider = fetch('https://nice.benfoxall.workers.dev/')
  .then((res) => res.json())
  .then((config) => {
    // correct iterable ice servers
    if (config?.iceServers && !Array.isArray(config?.iceServers)) {
      console.log('correcting ice servers');
      config.iceServers = [config.iceServers];
    }

    // nest for peerOpts
    return config;
  })
  .catch(() => undefined)
  .then((config) => {
    // @ts-expect-error
    // WebrtcProvider expects full Opts object, though it seems that Partial<Opts> works okay
    const provider = new WebrtcProvider(name, doc, {
      password: null,
      signaling: ['wss://y-ben.fly.dev'],
      filterBcConns: false,
      peerOpts: config ? { config } : undefined,
    });

    console.log('INIT PROVIDER', provider);

    return provider;
  });

const config: YI = { room, doc, provider, initiator };

export default config;
