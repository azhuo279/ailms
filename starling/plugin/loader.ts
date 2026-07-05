/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * webpack / Turbopack loader that stamps Starling's source-location attributes
 * onto JSX host elements by running the shared Babel plugin over module text.
 *
 * Built to CJS so bundlers can `require()` it. Registered (dev-only) via the
 * `withStarling()` config wrapper in `plugin/next.ts`. It transforms text in
 * memory only — it never edits files on disk.
 */
import * as babel from "@babel/core";
import starlingSourcePlugin from "./babel-plugin-starling-source";

interface LoaderContext {
  resourcePath: string;
  getOptions?: () => { root?: string };
  query?: { root?: string } | string;
  async(): (err: Error | null, code?: string, map?: any) => void;
  cacheable?: (flag: boolean) => void;
}

export default function starlingLoader(this: LoaderContext, source: string): void {
  const callback = this.async();
  if (this.cacheable) this.cacheable(true);

  const opts =
    typeof this.getOptions === "function"
      ? this.getOptions()
      : typeof this.query === "object"
        ? this.query
        : {};
  const root = opts?.root ?? process.cwd();

  // Only transform JSX/TSX; pass everything else through untouched.
  if (!/\.[jt]sx$/.test(this.resourcePath)) {
    callback(null, source);
    return;
  }

  babel
    .transformAsync(source, {
      filename: this.resourcePath,
      babelrc: false,
      configFile: false,
      sourceMaps: true,
      parserOpts: { plugins: ["jsx", "typescript"] },
      plugins: [[starlingSourcePlugin, { root }]],
    })
    .then((result) => {
      callback(null, result?.code ?? source, result?.map ?? undefined);
    })
    .catch((err) => {
      // Never break the host build over a stamping failure — pass source through.
      callback(null, source);
      void err;
    });
}

// CommonJS interop: webpack expects `module.exports` to be the loader function.
module.exports = starlingLoader;
module.exports.default = starlingLoader;
