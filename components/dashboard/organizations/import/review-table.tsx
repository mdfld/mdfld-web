"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Input,
  Spinner,
  Select,
  SelectItem,
  Checkbox,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { ImportRow, ImportRowStatus } from "@/lib/import/types";
import type { SizeSystem } from "@prisma/client";

const SIZE_SYSTEMS: SizeSystem[] = ["UK", "US", "EU", "JP", "CM", "STANDARD", "ONE_SIZE"];

const STATUS_BADGE: Record<ImportRowStatus, { label: string; className: string }> = {
  ready: { label: "Ready", className: "bg-success-50 text-success-700" },
  fix_size: { label: "Fix size", className: "bg-warning-50 text-warning-700" },
  skip: { label: "Skip", className: "bg-danger-50 text-danger-700" },
};

interface Props {
  rows: ImportRow[];
  sessionId?: string;
  onConfirmed: (count: number) => void;
  onBack: () => void;
}

export default function ImportReviewTable({ rows, sessionId, onConfirmed, onBack }: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(rows.filter((r) => r.status !== "skip").map((r) => r.id))
  );
  const [sizeFixMap, setSizeFixMap] = useState<Record<string, SizeSystem>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category).filter((c): c is NonNullable<typeof c> => c !== null))],
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || r.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [rows, search, categoryFilter]);

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const actionable = filtered.filter((r) => r.status !== "skip");
    if (actionable.every((r) => selected.has(r.id))) {
      setSelected((prev) => {
        const next = new Set(prev);
        actionable.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        actionable.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const readyCount = [...selected].filter((id) => {
    const r = rows.find((row) => row.id === id);
    return r && (r.status === "ready" || (r.status === "fix_size" && sizeFixMap[id]));
  }).length;

  const canConfirm = useMemo(() => {
    return readyCount > 0;
  }, [readyCount]);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);

    const selectedRows = rows
      .filter((r) => selected.has(r.id))
      .filter((r) => r.status !== "fix_size" || sizeFixMap[r.id])
      .map((r) => ({
        ...r,
        sizeSystem: r.status === "fix_size" ? sizeFixMap[r.id] : r.sizeSystem,
        // sizeDisplay removed — server derives from sizeSystem + sizeValue
      }));

    try {
      const res = await fetch("/api/products/bulk-import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: selectedRows, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed. Please try again.");
        return;
      }
      onConfirmed(data.created);
    } catch {
      setError("Something went wrong. No products were created. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fixCount = rows.filter((r) => r.status === "fix_size").length;
  const skipCount = rows.filter((r) => r.status === "skip").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-sm text-default-400 flex items-center gap-1 mb-2 hover:text-foreground">
            <Icon icon="solar:arrow-left-outline" className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-semibold">Review your listings</h1>
          <p className="text-sm text-default-500 mt-1">
            {rows.length} products found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            size="sm"
            className="w-40"
            placeholder="All categories"
            selectedKeys={categoryFilter ? [categoryFilter] : []}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((cat) => (
              <SelectItem key={cat}>{cat}</SelectItem>
            ))}
          </Select>
          <Input
            placeholder="Search listings..."
            size="sm"
            className="w-56"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startContent={<Icon icon="solar:magnifer-outline" className="w-4 h-4 text-default-400" />}
          />
        </div>
      </div>

      <div className="border border-divider rounded-xl overflow-hidden mb-4">
        {/* Select all header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-content2 border-b border-divider">
          {(() => {
            const actionableFiltered = filtered.filter((r) => r.status !== "skip");
            return (
              <Checkbox
                isSelected={actionableFiltered.length > 0 && actionableFiltered.every((r) => selected.has(r.id))}
                isIndeterminate={actionableFiltered.some((r) => selected.has(r.id)) && !actionableFiltered.every((r) => selected.has(r.id))}
                onValueChange={toggleAll}
                size="sm"
              />
            );
          })()}
          <span className="text-xs text-default-500">
            {selected.size} of {rows.length} selected
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-divider max-h-[480px] overflow-y-auto">
          {filtered.map((row) => {
            const badge = STATUS_BADGE[row.status];
            const isSelected = selected.has(row.id);
            return (
              <div
                key={row.id}
                className={`flex items-center gap-3 px-4 py-3 transition-opacity ${
                  !isSelected && row.status !== "skip" ? "opacity-60" : ""
                } ${row.status === "skip" ? "opacity-40" : ""}`}
              >
                <Checkbox
                  isSelected={isSelected}
                  onValueChange={() => toggleRow(row.id)}
                  isDisabled={row.status === "skip" && !isSelected}
                  size="sm"
                />
                {row.sourceThumbnail ? (
                  <>
                    <img
                      src={row.sourceThumbnail}
                      alt=""
                      className="w-9 h-9 rounded object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("hidden");
                      }}
                    />
                    <div className="w-9 h-9 rounded bg-content2 flex-shrink-0" hidden />
                  </>
                ) : (
                  <div className="w-9 h-9 rounded bg-content2 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{row.title}</p>
                  <p className="text-xs text-default-400 truncate">
                    {row.category ?? "Unknown category"}
                    {row.sizeDisplay ? ` · ${row.sizeDisplay}` : ""}
                  </p>
                </div>
                <span className="text-sm text-foreground flex-shrink-0">
                  ${row.price.toFixed(2)}
                </span>

                {row.status === "fix_size" ? (
                  <Select
                    size="sm"
                    className="w-28 flex-shrink-0"
                    placeholder="Size system"
                    selectedKeys={sizeFixMap[row.id] ? [sizeFixMap[row.id]] : []}
                    onChange={(e) =>
                      setSizeFixMap((prev) => ({ ...prev, [row.id]: e.target.value as SizeSystem }))
                    }
                  >
                    {SIZE_SYSTEMS.map((s) => (
                      <SelectItem key={s}>{s}</SelectItem>
                    ))}
                  </Select>
                ) : (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0 ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-default-400">
          {fixCount > 0 && `${fixCount} need size fix · `}
          {skipCount > 0 && `${skipCount} skipped (unrecognised category)`}
        </p>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button
            color="primary"
            isDisabled={!canConfirm || loading}
            isLoading={loading}
            onPress={handleConfirm}
            startContent={!loading && <Icon icon="solar:import-outline" className="w-4 h-4" />}
          >
            {loading ? "Importing..." : `Import ${readyCount} products`}
          </Button>
        </div>
      </div>
    </div>
  );
}
