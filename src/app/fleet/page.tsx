import type { Metadata } from "next";
import { RouteStub } from "@/components/shared/route-stub";

export const metadata: Metadata = {
  title: "Fleet · AiLMS",
};

export default function FleetPage() {
  return <RouteStub title="Fleet" />;
}
