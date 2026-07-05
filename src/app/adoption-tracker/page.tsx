import type { Metadata } from "next";
import { RouteStub } from "@/components/shared/route-stub";

export const metadata: Metadata = {
  title: "Adoption Tracker · AiLMS",
};

export default function AdoptionTrackerPage() {
  return <RouteStub title="Adoption Tracker" />;
}
