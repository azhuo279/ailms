import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure-function + DOM-helper unit tests run under jsdom. Full anchoring /
    // layout behavior needs a real browser (see test/browser, run separately).
    environment: "jsdom",
    include: ["test/unit/**/*.test.ts"],
  },
});
