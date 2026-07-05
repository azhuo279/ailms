import type { Metadata } from "next";
import { RouteStub } from "@/components/shared/route-stub";

export const metadata: Metadata = {
  title: "Audit Log · AiLMS",
};

export default function AuditLogPage() {
  return <RouteStub title="Audit Log" />;
}
