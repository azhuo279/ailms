import { HumanBubble } from "./human-bubble";
import { AiTurn } from "./ai-turn";
import type { ChatTurn } from "./types";
import type { RenderBlockContext } from "./render-block";

export interface MessageTurnProps {
  turn: ChatTurn;
  ctx: RenderBlockContext;
}

/**
 * Branches on role. A user turn is a single text block in a bright contained
 * `HumanBubble`; an assistant turn is a frameless `AiTurn` block stack. An
 * sr-only prefix names the speaker since the bubbles are visual-only.
 */
export function MessageTurn({ turn, ctx }: MessageTurnProps) {
  if (turn.role === "user") {
    const [first] = turn.blocks;
    const content = first && first.kind === "text" ? first.content : null;
    return (
      <div>
        <span className="sr-only">You said </span>
        <HumanBubble>{content}</HumanBubble>
      </div>
    );
  }

  return (
    <div>
      <span className="sr-only">Kase said </span>
      <AiTurn blocks={turn.blocks} ctx={ctx} />
    </div>
  );
}
