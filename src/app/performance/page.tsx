import type { Metadata } from "next";
import { PerformanceContent } from "./components/performance-content";

export const metadata: Metadata = {
  title: "Performance · AiLMS",
};

/**
 * Performance — one page, two peer tabs. Tab 1 "Zone Performance" (all users,
 * inventor Direction A); Tab 2 "AI Adoption" (director-only, inventor
 * Direction C, folds in the former /adoption-tracker route). Thin route entry
 * that composes the client content directly (framework doc §3).
 */
export default function PerformancePage() {
  return <PerformanceContent />;
}
