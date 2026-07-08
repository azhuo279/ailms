"use client";

import { useMemo, useState } from "react";
import { Filter, Expand, Shrink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchField } from "@/components/ui/search-field";
import { Combobox } from "@/components/ui/combobox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  EVENT_TYPE_CONFIG,
  EVENT_TYPE_ORDER,
  TIER_ORDER,
  type AuditFilters,
} from "@/app/audit-log/lib/audit-log-format";
import type { AuditActor } from "@/app/audit-log/lib/audit-log-types";
import { AppliedFilterChips } from "./audit-log-content";

const FILTER_LABEL_CLASS = "text-label-s font-medium text-fg-muted";

/**
 * User-facing priority signals for each tier code. Mirrors the labels in
 * PriorityTierBadge's TIER_CONFIG (not exported there); the badge stays the
 * single source of the visual chip, this map only labels the filter checklist.
 * The underlying filter value stays the tier code so filterEvents keeps working.
 */
const TIER_PRIORITY_LABEL: Record<string, string> = {
  T1: "Critical",
  T2: "High",
  T3: "Medium",
  T4: "Low",
};

/**
 * Persistent left filter rail (Direction A) — always-visible faceted filters
 * for the audit log (FR-42). Actor-type toggle, action-type checklist with
 * select-all + search, tier, date range, exception id, and user multi-select.
 * The rail collapses to a narrow vertical strip (filter glyph + active-facet
 * count) to give the table more width; when expanded, applied filters surface
 * as removable chips under the Filters header (AppliedFilterChips).
 */
export function AuditFilterRail({
  filters,
  onChange,
  onClearAll,
  exceptionOptions,
  userOptions,
}: {
  filters: AuditFilters;
  onChange: (next: Partial<AuditFilters>) => void;
  onClearAll: () => void;
  exceptionOptions: { value: string; label: string }[];
  userOptions: AuditActor[];
}) {
  const [typeQuery, setTypeQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  // Count of active facet groups — surfaced as a small badge on the collapsed
  // rail so users see filters are still applied without re-expanding.
  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.actorKind !== "all") n += 1;
    if (filters.types.length > 0) n += 1;
    if (filters.tiers.length > 0) n += 1;
    if (filters.exceptionIds.length > 0) n += 1;
    if (filters.userIds.length > 0) n += 1;
    if (filters.dateStart !== null || filters.dateEnd !== null) n += 1;
    return n;
  }, [filters]);

  const typeRows = useMemo(() => {
    const q = typeQuery.trim().toLowerCase();
    return EVENT_TYPE_ORDER.filter((type) =>
      q ? EVENT_TYPE_CONFIG[type].label.toLowerCase().includes(q) : true,
    );
  }, [typeQuery]);

  const allTypesSelected = filters.types.length === EVENT_TYPE_ORDER.length;
  const someTypesSelected = filters.types.length > 0 && !allTypesSelected;

  const userComboOptions = useMemo(
    () =>
      userOptions.map((u) => ({ value: u.id, label: `${u.name} · ${u.role}` })),
    [userOptions],
  );

  const toggleType = (type: string) => {
    onChange({
      types: filters.types.includes(type)
        ? filters.types.filter((t) => t !== type)
        : [...filters.types, type],
    });
  };

  const toggleAllTypes = () => {
    onChange({ types: allTypesSelected ? [] : [...EVENT_TYPE_ORDER] });
  };

  const toggleTier = (tier: string) => {
    onChange({
      tiers: filters.tiers.includes(tier)
        ? filters.tiers.filter((t) => t !== tier)
        : [...filters.tiers, tier],
    });
  };

  // Author facet as a checkbox list over the single-value `actorKind` model.
  // Both-checked or none-checked reads as "all"; a single check narrows to that
  // kind. Toggling one box while "all" is active isolates the *other* kind, the
  // natural read of unchecking one of two logically-checked options.
  const aiChecked = filters.actorKind === "all" || filters.actorKind === "ai";
  const humanChecked =
    filters.actorKind === "all" || filters.actorKind === "human";

  const toggleAuthorKind = (kind: "ai" | "human", next: boolean) => {
    const other = kind === "ai" ? "human" : "ai";
    // Resolve the two booleans, then collapse to the single-value model.
    const kindOn = next;
    const otherOn = kind === "ai" ? humanChecked : aiChecked;
    let value: AuditFilters["actorKind"];
    if (kindOn === otherOn)
      value = "all"; // both or neither
    else value = kindOn ? kind : other;
    onChange({ actorKind: value });
  };

  if (collapsed) {
    return (
      <aside
        aria-label="Audit log filters"
        className="flex w-12 shrink-0 flex-col items-center gap-3 overflow-hidden rounded-lg border border-border-subtle bg-surface-raised p-2 shadow-sm motion-safe:transition-[width] motion-safe:duration-[200ms] motion-safe:ease-in-out"
      >
        <Button
          iconOnly
          variant="ghost"
          size="sm"
          icon={<Expand />}
          aria-label="Expand filters"
          aria-expanded={false}
          onClick={() => setCollapsed(false)}
        />
        {/* Vertical affordance: a filter glyph plus the active-facet count so a
            collapsed rail still signals that filters are applied. */}
        <span
          className="flex flex-col items-center gap-1 text-fg-muted"
          aria-label={
            activeCount > 0
              ? `${activeCount} active filters`
              : "No active filters"
          }
        >
          <Filter aria-hidden="true" className="size-4" />
          {activeCount > 0 ? (
            <Badge tone="brand" solid size="sm" count={activeCount} />
          ) : null}
        </span>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Audit log filters"
      className="flex w-72 shrink-0 flex-col gap-5 overflow-y-auto rounded-lg border border-border-subtle bg-surface-raised p-4 shadow-sm motion-safe:transition-[width] motion-safe:duration-[200ms] motion-safe:ease-in-out"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-title font-semibold text-fg-primary">Filters</p>
        <Button
          iconOnly
          variant="ghost"
          size="sm"
          icon={<Shrink />}
          aria-label="Collapse filters"
          aria-expanded
          onClick={() => setCollapsed(true)}
        />
      </div>

      {/* Applied-filter chips — the active facet values as removable Tags plus
          Clear all, surfaced here under the header (returns null when no filter
          is active, so the rail collapses back to its facet controls). */}
      <AppliedFilterChips
        filters={filters}
        exceptionOptions={exceptionOptions}
        userOptions={userOptions}
        onChange={onChange}
        onClearAll={onClearAll}
      />

      {/* Author facet — AI / Human as a checkbox list (FR-41), matching the
          Priority and Action-type facets in this rail. Both or neither checked
          reads as "all". */}
      <fieldset className="flex flex-col gap-2">
        <legend className={FILTER_LABEL_CLASS}>Author</legend>
        {/* pl-1.5 offsets the sm Checkbox's -m-1.5 hit-area bleed so the box
            resolves inside the rail padding instead of clipping past its edge. */}
        <div className="flex w-full flex-col gap-3 pl-2 pt-2">
          <Checkbox
            size="sm"
            className="min-w-0 gap-3"
            checked={aiChecked}
            onChange={(next) => toggleAuthorKind("ai", next)}
            label="AI actions"
          />
          <Checkbox
            size="sm"
            className="min-w-0 gap-3"
            checked={humanChecked}
            onChange={(next) => toggleAuthorKind("human", next)}
            label="Human actions"
          />
        </div>
      </fieldset>

      {/* Action-type checklist — searchable, with select-all (FR-42). */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className={FILTER_LABEL_CLASS}>Action type</span>
          {/* <button
            type="button"
            onClick={toggleAllTypes}
            className="text-label-m font-medium text-link transition-colors hover:text-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1"
          >
            {allTypesSelected ? "Clear" : "Select all"}
          </button> */}
        </div>
        <SearchField
          aria-label="Search action types"
          placeholder="Search types"
          value={typeQuery}
          onChange={(e) => setTypeQuery(e.target.value)}
          onClear={() => setTypeQuery("")}
        />
        <div className="flex w-full flex-col gap-3 pt-1 pl-2">
          {/* Explicit select-all row carries the indeterminate state. */}
          {typeQuery.trim() === "" ? (
            <Checkbox
              size="sm"
              className="w-full min-w-0 gap-3"
              checked={allTypesSelected}
              indeterminate={someTypesSelected}
              onChange={toggleAllTypes}
              label="All action types"
            />
          ) : null}
          {typeRows.map((type) => (
            <Checkbox
              key={type}
              size="sm"
              className="w-full min-w-0 gap-3"
              checked={filters.types.includes(type)}
              onChange={() => toggleType(type)}
              label={EVENT_TYPE_CONFIG[type].label}
            />
          ))}
          {typeRows.length === 0 ? (
            <p className="text-caption text-fg-muted">No types match.</p>
          ) : null}
        </div>
      </div>

      {/* Priority checklist — labels show the user-facing priority signal
          (Critical / High / Medium / Low); the filter value stays the tier
          code so filterEvents matches on e.tier unchanged. */}
      <div className="flex flex-col gap-2">
        <span className={FILTER_LABEL_CLASS}>Priority</span>
        <div className="flex flex-col gap-3 pl-2 pt-1">
          {TIER_ORDER.map((tier) => (
            <Checkbox
              key={tier}
              size="sm"
              className="w-full min-w-0 gap-3"
              checked={filters.tiers.includes(tier)}
              onChange={() => toggleTier(tier)}
              label={TIER_PRIORITY_LABEL[tier]}
            />
          ))}
        </div>
      </div>

      {/* Date range — relative presets + custom (FR-42). */}
      <DateRangePicker
        label="Date range"
        labelClassName={FILTER_LABEL_CLASS}
        value={{ start: filters.dateStart, end: filters.dateEnd }}
        onChange={(range) =>
          onChange({ dateStart: range.start, dateEnd: range.end })
        }
      />

      {/* Exception id — searchable multi-select. */}
      <Combobox
        multiple
        label="Exception"
        labelClassName={FILTER_LABEL_CLASS}
        placeholder="Any exception"
        options={exceptionOptions}
        value={filters.exceptionIds}
        onChange={(v) => onChange({ exceptionIds: Array.isArray(v) ? v : [v] })}
      />

      {/* User — multi-select searchable. */}
      <Combobox
        multiple
        label="User"
        labelClassName={FILTER_LABEL_CLASS}
        placeholder="Any user"
        options={userComboOptions}
        value={filters.userIds}
        onChange={(v) => onChange({ userIds: Array.isArray(v) ? v : [v] })}
      />
    </aside>
  );
}
