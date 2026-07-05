"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TreeNode {
  id: string;
  label: string;
  icon?: ReactNode;
  children?: TreeNode[];
  disabled?: boolean;
  /** Marks a node whose children load on first expand; pairs with `onLoadChildren`. */
  lazy?: boolean;
}

export interface TreeViewProps {
  nodes: TreeNode[];
  selectedId?: string;
  onSelect?: (node: TreeNode) => void;
  /** Controlled expanded-id set; omit to let TreeView manage its own state. */
  expandedIds?: Set<string>;
  onExpandedChange?: (expandedIds: Set<string>) => void;
  /** Called when a `lazy` node is expanded for the first time. */
  onLoadChildren?: (node: TreeNode) => void;
  /** Node ids currently loading children (renders a spinner in place of the chevron). */
  loadingIds?: Set<string>;
  className?: string;
}

/**
 * Canonical Tree View — hierarchical navigation for nested categories such
 * as region › country › warehouse, order document folders, or asset
 * hierarchies. Use only when hierarchy genuinely matters; prefer List or
 * Data Table for flatter information.
 */
export function TreeView({
  nodes,
  selectedId,
  onSelect,
  expandedIds: controlledExpandedIds,
  onExpandedChange,
  onLoadChildren,
  loadingIds,
  className,
}: TreeViewProps) {
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(new Set());
  const expandedIds = controlledExpandedIds ?? internalExpandedIds;

  const setExpandedIds = (next: Set<string>) => {
    if (onExpandedChange) onExpandedChange(next);
    else setInternalExpandedIds(next);
  };

  const toggleExpanded = (node: TreeNode) => {
    const next = new Set(expandedIds);
    const willExpand = !next.has(node.id);
    if (willExpand) next.add(node.id);
    else next.delete(node.id);
    setExpandedIds(next);
    if (willExpand && node.lazy && !node.children?.length) {
      onLoadChildren?.(node);
    }
  };

  return (
    <div role="tree" className={cn("flex flex-col gap-0.5", className)}>
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          expandedIds={expandedIds}
          loadingIds={loadingIds}
          onSelect={onSelect}
          onToggle={toggleExpanded}
        />
      ))}
    </div>
  );
}

function TreeItem({
  node,
  depth,
  selectedId,
  expandedIds,
  loadingIds,
  onSelect,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedId?: string;
  expandedIds: Set<string>;
  loadingIds?: Set<string>;
  onSelect?: (node: TreeNode) => void;
  onToggle: (node: TreeNode) => void;
}) {
  const hasChildren = Boolean(node.children?.length) || node.lazy;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = node.id === selectedId;
  const isLoading = loadingIds?.has(node.id) ?? false;

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined} aria-selected={isSelected}>
      <div
        className={cn(
          "flex h-8 items-center gap-1 rounded-md pr-2 transition-colors",
          "focus-within:ring-2 focus-within:ring-focus-ring",
          isSelected ? "bg-nav-active text-fg-on-primary" : "text-fg-primary hover:bg-option-hover",
          node.disabled && "cursor-not-allowed text-fg-disabled hover:bg-transparent",
        )}
        style={{ paddingLeft: `${depth * 1.25 + 0.25}rem` }}
      >
        <button
          type="button"
          onClick={() => hasChildren && !node.disabled && onToggle(node)}
          disabled={!hasChildren || node.disabled}
          aria-label={hasChildren ? (isExpanded ? "Collapse" : "Expand") : undefined}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-sm transition-transform focus-visible:outline-none",
            !hasChildren && "invisible",
          )}
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin text-fg-muted" aria-hidden="true" />
          ) : (
            <ChevronRight
              className={cn("size-3.5 transition-transform", isExpanded && "rotate-90")}
              aria-hidden="true"
            />
          )}
        </button>
        <button
          type="button"
          disabled={node.disabled}
          onClick={() => !node.disabled && onSelect?.(node)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 py-1 text-left text-body-m",
            "focus-visible:outline-none",
          )}
        >
          {node.icon ? (
            <span className="inline-flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
              {node.icon}
            </span>
          ) : null}
          <span className="min-w-0 flex-1 truncate">{node.label}</span>
        </button>
      </div>
      {hasChildren && isExpanded && node.children?.length ? (
        <div role="group">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              loadingIds={loadingIds}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
