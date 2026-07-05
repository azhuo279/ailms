import type { Metadata } from "next";
import { RouteStub } from "@/components/shared/route-stub";

export const metadata: Metadata = {
  title: "Settings · AiLMS",
};

export default function SettingsPage() {
  return <RouteStub title="Settings" />;
}
