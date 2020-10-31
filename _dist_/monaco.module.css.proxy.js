
export let code = "._dist_monaco_module__container {\n  position: fixed;\n  left: 0;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  display: flex;\n  flex-direction: column;\n  gap: 1em;\n  padding: 1em;\n}\n\n._dist_monaco_module__header {\n  flex: 0;\n  display: flex;\n  justify-content: space-between;\n}\n\n._dist_monaco_module__main {\n  flex: 1;\n  overflow: hidden;\n}\n\n._dist_monaco_module__share {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  line-height: 1em;\n  min-width: 1em;\n  height: 1em;\n  border-radius: 1em;\n  background: aquamarine;\n  color: #000;\n  text-decoration: none;\n}\n\n._dist_monaco_module__share:hover {\n  background: #000;\n  color: aquamarine;\n}\n\n._dist_monaco_module__share:hover:before {\n  content: 'share';\n}\n";
let json = {"container":"_dist_monaco_module__container","header":"_dist_monaco_module__header","main":"_dist_monaco_module__main","share":"_dist_monaco_module__share"};
export default json;

// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';

  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}