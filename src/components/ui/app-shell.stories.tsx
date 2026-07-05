import type { Meta, StoryObj } from "@storybook/nextjs";
import { Bell, Search } from "lucide-react";
import { AppShell } from "./app-shell";
import { Button } from "./button";

/**
 * **App Shell** — the reusable product-wide frame containing global
 * navigation (the persistent left `Sidebar`), an optional top bar utility
 * row, and the scrollable content region. Rendered once in the root layout;
 * every route's page content is composed inside it. Keep it thin — page
 * layout belongs in each route's own components.
 */
const meta: Meta<typeof AppShell> = {
  title: "UI/App Shell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof AppShell>;

const SampleContent = () => (
  <div className="flex flex-col gap-4">
    <h1 className="text-display-l font-bold text-fg-primary">Overview</h1>
    <div className="grid grid-cols-3 gap-4">
      {["Active shipments", "Delayed", "Delivered today"].map((label) => (
        <div key={label} className="rounded-lg border border-border-subtle bg-surface-raised p-4 shadow-sm">
          <p className="text-label-s font-medium uppercase text-fg-muted">{label}</p>
          <p className="mt-1 text-heading-xl font-semibold text-fg-primary">128</p>
        </div>
      ))}
    </div>
  </div>
);

export const Default: Story = {
  render: () => (
    <AppShell>
      <SampleContent />
    </AppShell>
  ),
};

export const WithTopBar: Story = {
  render: () => (
    <AppShell
      topBarStart={<h2 className="truncate text-title font-semibold text-fg-primary">Shipments</h2>}
      topBarEnd={
        <>
          <Button iconOnly variant="ghost" icon={<Search />} aria-label="Search" />
          <Button iconOnly variant="ghost" icon={<Bell />} aria-label="Notifications" />
        </>
      }
    >
      <SampleContent />
    </AppShell>
  ),
};

export const Scrolled: Story = {
  name: "Top bar — scrolled shadow",
  render: () => (
    <AppShell
      topBarStart={<h2 className="truncate text-title font-semibold text-fg-primary">Shipments</h2>}
      topBarEnd={<Button size="sm">New shipment</Button>}
    >
      <div className="flex flex-col gap-4">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="h-16 rounded-lg border border-border-subtle bg-surface-raised" />
        ))}
      </div>
    </AppShell>
  ),
};

export const NoTopBar: Story = {
  render: () => (
    <AppShell hideTopBar>
      <SampleContent />
    </AppShell>
  ),
};
