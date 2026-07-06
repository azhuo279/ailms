"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useUserPersona } from "@/hooks/shared/use-user-persona";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { Menu, MenuItem } from "@/components/ui/menu";
import { MessageBar } from "@/components/ui/message-bar";
import { Button } from "@/components/ui/button";
import { usePerformanceFeed } from "../hooks/use-performance-feed";
import { ZonePerformanceTab } from "./zone-performance-tab";
import { AiAdoptionTab } from "./ai-adoption-tab";
import { PerformanceSkeleton } from "./performance-skeleton";

/**
 * /performance — one page, two peer tabs. Tab 1 "Zone Performance" (all users,
 * inventor Direction A); Tab 2 "AI Adoption" (director-only, inventor
 * Direction C). The director gate reuses the same persona signal the sidebar
 * uses to gate /adoption-tracker (`useUserPersona`): for a non-director the
 * second tab is HIDDEN ENTIRELY (not shown-locked), matching the sidebar's
 * `directorOnly` behavior.
 */
export function PerformanceContent() {
  const persona = useUserPersona((s) => s.persona);
  const isDirector = persona === "director";
  const { data: feed, isLoading, isError, refetch } = usePerformanceFeed();
  const [tab, setTab] = useState("zone");

  // Guard: if a non-director somehow lands on the adoption tab (e.g. persona
  // flips after selection), fall back to the always-visible zone tab.
  const activeTab = !isDirector && tab === "adoption" ? "zone" : tab;

  if (isLoading) {
    return <PerformanceSkeleton />;
  }

  if (isError || !feed) {
    return (
      <MessageBar
        severity="error"
        title="Couldn't load performance data"
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        The zone performance feed failed to load. Check your connection and try
        again.
      </MessageBar>
    );
  }

  const tabItems = [
    { value: "zone", label: "Zone Performance" },
    // Tab 2 is appended only for directors — hidden entirely otherwise.
    ...(isDirector ? [{ value: "adoption", label: "AI Adoption" }] : []),
  ];

  // Export is a director-only capability, surfaced on the tablist row for
  // directors on BOTH tabs. It sits on the tablist row (right-aligned) via the
  // Tabs `actions` slot. Non-directors never see it, matching the AI Adoption
  // tab being director-only.
  const exportMenu =
    isDirector ? (
      <Menu
        align="end"
        trigger={
          <Button variant="secondary" size="md" leadingIcon={<Download />}>
            Export
          </Button>
        }
      >
        <MenuItem onSelect={() => undefined}>Export as PNG</MenuItem>
        <MenuItem onSelect={() => undefined}>Export as PDF</MenuItem>
        <MenuItem onSelect={() => undefined}>Export as CSV</MenuItem>
      </Menu>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        items={tabItems}
        value={activeTab}
        onChange={setTab}
        actions={exportMenu}
      >
        <TabPanel value="zone">
          <ZonePerformanceTab feed={feed} />
        </TabPanel>
        {isDirector ? (
          <TabPanel value="adoption">
            <AiAdoptionTab feed={feed} />
          </TabPanel>
        ) : null}
      </Tabs>
    </div>
  );
}
