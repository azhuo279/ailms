'use strict';

var babel = require('@babel/core');
var path = require('path');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var babel__namespace = /*#__PURE__*/_interopNamespace(babel);
var path__namespace = /*#__PURE__*/_interopNamespace(path);

// plugin/loader.ts
var PATH_ATTR = "data-inspector-relative-path";
var LINE_ATTR = "data-inspector-line";
var COL_ATTR = "data-inspector-column";
function starlingSourcePlugin(babel2, options = {}) {
  const t = babel2.types;
  const root = options.root ?? process.cwd();
  const exclude = options.exclude ?? ["node_modules"];
  return {
    name: "starling-source",
    visitor: {
      JSXOpeningElement(nodePath, state) {
        const filename = state.file?.opts?.filename ?? "";
        if (!filename) return;
        if (exclude.some((frag) => filename.includes(frag))) return;
        const nameNode = nodePath.node.name;
        if (!t.isJSXIdentifier(nameNode)) return;
        if (!/^[a-z]/.test(nameNode.name)) return;
        const already = nodePath.node.attributes.some(
          (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === PATH_ATTR
        );
        if (already) return;
        const loc = nodePath.node.loc;
        if (!loc) return;
        const rel = path__namespace.relative(root, filename).split(path__namespace.sep).join("/");
        nodePath.node.attributes.push(
          jsxAttr(t, PATH_ATTR, rel),
          jsxAttr(t, LINE_ATTR, String(loc.start.line)),
          jsxAttr(t, COL_ATTR, String(loc.start.column))
        );
      }
    }
  };
}
function jsxAttr(t, name, value) {
  return t.jsxAttribute(t.jsxIdentifier(name), t.stringLiteral(value));
}

// plugin/loader.ts
function starlingLoader(source) {
  const callback = this.async();
  if (this.cacheable) this.cacheable(true);
  const opts = typeof this.getOptions === "function" ? this.getOptions() : typeof this.query === "object" ? this.query : {};
  const root = opts?.root ?? process.cwd();
  if (!/\.[jt]sx$/.test(this.resourcePath)) {
    callback(null, source);
    return;
  }
  babel__namespace.transformAsync(source, {
    filename: this.resourcePath,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    parserOpts: { plugins: ["jsx", "typescript"] },
    plugins: [[starlingSourcePlugin, { root }]]
  }).then((result) => {
    callback(null, result?.code ?? source, result?.map ?? void 0);
  }).catch((err) => {
    callback(null, source);
  });
}
module.exports = starlingLoader;
module.exports.default = starlingLoader;

module.exports = starlingLoader;
//# sourceMappingURL=loader.cjs.map
//# sourceMappingURL=loader.cjs.map