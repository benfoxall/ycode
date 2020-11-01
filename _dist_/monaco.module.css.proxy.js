export let code=`._dist_monaco_module__container {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 1em;
  padding: 1em;
}

._dist_monaco_module__header {
  flex: 0;
  display: flex;
  justify-content: space-between;
}

._dist_monaco_module__main {
  flex: 1;
  overflow: hidden;
}

._dist_monaco_module__share {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1em;
  min-width: 1.5em;
  min-height: 1.5em;
  border-radius: 0.5em;
  background: aquamarine;
  color: #000;
  text-decoration: none;
  padding: 0;
}

._dist_monaco_module__share:hover {
  background: #000;
  color: aquamarine;
  padding: 0 0.5em;
}

._dist_monaco_module__share em {
  display: none;
  padding: 0.5em;
}
._dist_monaco_module__share:hover em {
  display: block;
}
`;let o={container:"_dist_monaco_module__container",header:"_dist_monaco_module__header",main:"_dist_monaco_module__main",share:"_dist_monaco_module__share"};export default o;if(typeof document!="undefined"){const n=document.createElement("style"),e=document.createTextNode(code);n.type="text/css",n.appendChild(e),document.head.appendChild(n)}
