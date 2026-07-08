import type { Metadata } from "next";
import { RouteStub } from "@/components/shared/route-stub";

export const metadata: Metadata = {
  title: "Shipments · AiLMS",
};

export default function ShipmentsPage() {
  return <RouteStub title="Shipments" />;
}
