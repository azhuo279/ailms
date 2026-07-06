"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Tooltip } from "@/components/ui/tooltip";
import { eventsToCsv } from "@/app/audit-log/lib/audit-log-format";
import type { AuditEvent } from "@/app/audit-log/lib/audit-log-types";

/**
 * Export control (FR-42). A single top-right Export button opens a menu
 * (CSV / PDF) operating on the CURRENTLY-FILTERED events, with the scope
 * labeled ("N filtered events"). Admin-gated: shown to admins, disabled with
 * an explanatory tooltip otherwise. The menu portals to document.body (Menu
 * primitive).
 */
export function AuditExportMenu({
  events,
  isAdmin,
}: {
  events: AuditEvent[];
  isAdmin: boolean;
}) {
  const count = events.length;
  const scopeLabel = `${count} filtered ${count === 1 ? "event" : "events"}`;

  const handleCsv = () => {
    const csv = eventsToCsv(events);
    downloadBlob(csv, "text/csv;charset=utf-8", "audit-log.csv");
  };

  const handlePdf = () => {
    // Mock PDF export — a real build renders server-side or via a PDF lib. Here
    // we hand off the same content as a printable text artifact so the action
    // is real (produces a file) without pulling in a PDF dependency.
    const text = eventsToCsv(events).replace(/","/g, "  |  ").replace(/"/g, "");
    downloadBlob(text, "text/plain;charset=utf-8", "audit-log.txt");
  };

  if (!isAdmin) {
    return (
      <Tooltip content="Exporting the audit log requires an Admin or Director role.">
        <span className="inline-flex">
          <Button size="sm" variant="secondary" leadingIcon={<Download />} disabled>
            Export
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Menu
      align="end"
      trigger={
        <Button size="sm" variant="secondary" leadingIcon={<Download />} disabled={count === 0}>
          Export
        </Button>
      }
    >
      <p className="px-3 pb-1 pt-1.5 text-caption text-fg-muted">
        Exports {scopeLabel}
      </p>
      <MenuItem icon={<FileSpreadsheet />} onSelect={handleCsv}>
        Export as CSV
      </MenuItem>
      <MenuItem icon={<FileText />} onSelect={handlePdf}>
        Export as PDF
      </MenuItem>
    </Menu>
  );
}

function downloadBlob(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
