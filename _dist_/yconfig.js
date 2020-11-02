import * as Y from "../web_modules/yjs.js";
import {WebrtcProvider} from "../web_modules/y-webrtc.js";
const key = ":room:";
const wat = window;
if (!wat.yi) {
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
  const provider = new WebrtcProvider(name, doc, {password});
  wat.yi = {room, doc, provider, initiator};
}
const config = wat.yi;
export default config;
