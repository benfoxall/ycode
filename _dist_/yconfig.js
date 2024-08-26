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
const provider = new WebrtcProvider(name, doc, {password, signaling: ["wss://y-ben.fly.dev"]});
const config = {room, doc, provider, initiator};
export default config;
