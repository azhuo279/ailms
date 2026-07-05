import type { Metadata } from "next";
import { RouteStub } from "@/components/shared/route-stub";

export const metadata: Metadata = {
  title: "Performance · AiLMS",
};

export default function PerformancePage() {
  return <RouteStub title="Performance" />;
}
