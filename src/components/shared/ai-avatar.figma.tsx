import figma from "@figma/code-connect/react";
import { AiAvatar } from "./ai-avatar";

/**
 * AiAvatar — the AI agent's animated 3D presence (react-three-fiber).
 *
 * The Figma mirror (node 39:12, "AI Avatar" page) is a STATIC reference only:
 * Figma cannot render a live WebGL canvas, so the two named states are shown
 * as flat vector approximations rather than the real animated geometry. The
 * real component (this file's target) renders continuous rotation/reveal
 * transitions between states — see src/components/shared/ai-avatar.tsx for
 * the actual behavior.
 */
figma.connect(
  AiAvatar,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=39-12",
  {
    props: {
      state: figma.enum("State", {
        dormant: "dormant",
        active: "active",
      }),
    },
    example: ({ state }) => <AiAvatar state={state} />,
  },
);
