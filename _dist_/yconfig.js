import __SNOWPACK_ENV__ from '../__snowpack__/env.js';
import.meta.env = __SNOWPACK_ENV__;

import * as Y from "../web_modules/yjs.js";
import {WebrtcProvider} from "../web_modules/y-webrtc.js";
if (import.meta.hot) {
  import.meta.hot.decline();
}
const key = ":room:";
let initiator = true;
let room = sessionStorage.getItem(key) || [
  Math.random().toString(32).slice(2),
  Math.random().toString(32).slice(2)
].join("~");
sessionStorage.setItem(key, room);
if (location.search) {
  initiator = false;
  room = location.search.slice(1);
}
const doc = new Y.Doc();
const [name, password] = room.split("~");
const provider = fetch("https://nice.benfoxall.workers.dev/").then((res) => res.json()).then((config2) => {
  if (config2?.iceServers && !Array.isArray(config2?.iceServers)) {
    console.log("correcting ice servers");
    config2.iceServers = [config2.iceServers];
  }
  return config2;
}).catch(() => void 0).then((config2) => {
  const provider2 = new WebrtcProvider(name, doc, {
    password: null,
    signaling: ["wss://y-ben.fly.dev"],
    filterBcConns: false,
    peerOpts: config2 ? {config: config2} : void 0
  });
  console.log("INIT PROVIDER", provider2);
  return provider2;
});
const config = {room, doc, provider, initiator};
export default config;
