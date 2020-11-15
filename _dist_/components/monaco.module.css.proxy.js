
export let code = "._dist_components_monaco_module__container {\n  position: fixed;\n  left: 0;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  display: flex;\n  flex-direction: column;\n  gap: 1em;\n  padding: 1em;\n}\n\n._dist_components_monaco_module__header {\n  flex: 0;\n  display: flex;\n  justify-content: space-between;\n}\n\n._dist_components_monaco_module__main {\n  flex: 1;\n  overflow: hidden;\n}\n";
let json = {"container":"_dist_components_monaco_module__container","header":"_dist_components_monaco_module__header","main":"_dist_components_monaco_module__main"};
export default json;

// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';

  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}