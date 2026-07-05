"use client";
import { useEffect } from "react";
function Starling(props = {}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    let cancelled = false;
    import("../index.js").then((m) => {
      if (!cancelled) m.mountStarling(props);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
var Starling_default = Starling;
export {
  Starling,
  Starling_default as default
};
//# sourceMappingURL=Starling.js.map