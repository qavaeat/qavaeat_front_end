"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, flexRender,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import {
  Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  Users, Zap, CheckCircle2, Download, ChevronDown, Filter, RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ChefCustomer } from "./types";

type CustomerFilter = "All Customers" | "Active Subscribers" | "Paused Subscribers";
type SortOption = "Recently Active" | "Most Schedules" | "Highest Spent";

interface PaginationMeta {
  total: number; page: number; limit: number;
  totalPages: number; hasNextPage: boolean; hasPrevPage: boolean;
}

const PAGE_SIZE = 7;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SortableHeader({ label, column }: { label: string; column: any }) {
  return (
    <button className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
      {label}
      {column.getIsSorted() === "asc" ? <ArrowUp className="w-3 h-3" /> :
       column.getIsSorted() === "desc" ? <ArrowDown className="w-3 h-3" /> :
       <ArrowUpDown className="w-3 h-3 opacity-50" />}
    </button>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export function TabCustomers() {
  const [customers, setCustomers] = useState<ChefCustomer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>("All Customers");
  const [sort, setSort] = useState<SortOption>("Recently Active");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(1);
  const sortRef = useRef<HTMLDivElement>(null);

  const SORTS: SortOption[] = ["Recently Active", "Most Schedules", "Highest Spent"];
  const FILTERS: CustomerFilter[] = ["All Customers", "Active Subscribers", "Paused Subscribers"];

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Close sort dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setShowSort(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(customerFilter !== "All Customers" ? { filter: customerFilter } : {}),
      });
      const res = await fetch(`/api/chefs/customers?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch customers");
      const json = await res.json();
      setCustomers(json?.data ?? []);
      setMeta(json?.meta ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, customerFilter]);

  useEffect(() => { load(); }, [load]);

  // Poll every 60s
  useEffect(() => {
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  // Client-side sort
  const sortedCustomers = useMemo(() => {
    const copy = [...customers];
    if (sort === "Most Schedules") return copy.sort((a, b) => b.totalSchedules - a.totalSchedules);
    if (sort === "Highest Spent") return copy.sort((a, b) => b.totalSpent - a.totalSpent);
    return copy.sort((a, b) => new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime());
  }, [customers, sort]);

  const columns = useMemo<ColumnDef<ChefCustomer>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <input type="checkbox" checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded border-border accent-primary" />
      ),
      cell: ({ row }) => (
        <input type="checkbox" checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-border accent-primary" />
      ),
      size: 40,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader label="Customer" column={column} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-black text-muted-foreground flex-shrink-0">
            {row.original.avatarUrl
              ? <img src={row.original.avatarUrl} alt="" className="w-full h-full object-cover" />
              : row.original.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-foreground whitespace-nowrap">{row.original.name}</p>
              {row.original.status === "active" && <CheckCircle2 className="w-3 h-3 text-[#007606]" />}
            </div>
            <p className="text-[10px] text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ getValue }) => (
        <span className="text-xs text-foreground whitespace-nowrap">
          {(getValue() as string | null) ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "activeMealPlan",
      header: "Meal Plan",
      cell: ({ row }) => {
        const v = row.original.activeMealPlan;
        const status = row.original.subscriptionStatus;
        return v ? (
          <div>
            <p className="text-xs font-medium text-foreground whitespace-nowrap">{v}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
              status === "ACTIVE" ? "bg-[#007606]/10 text-[#007606]" :
              status === "PAUSED" ? "bg-secondary/20 text-secondary-foreground" :
              "bg-muted text-muted-foreground"
            }`}>
              {status ?? "—"}
            </span>
          </div>
        ) : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: "totalSchedules",
      header: ({ column }) => <SortableHeader label="Schedules" column={column} />,
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground">{row.original.totalSchedules}</p>
          <p className="text-[10px] text-muted-foreground">{row.original.completedSchedules} completed</p>
        </div>
      ),
    },
    {
      accessorKey: "totalSpent",
      header: ({ column }) => <SortableHeader label="Total Spent" column={column} />,
      cell: ({ getValue }) => (
        <span className="text-xs font-bold text-foreground">
          Ksh {(getValue() as number).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "lastActivityDate",
      header: ({ column }) => <SortableHeader label="Last Active" column={column} />,
      cell: ({ getValue }) => (
        <span className="text-xs text-foreground whitespace-nowrap">
          {formatDate(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: "joinedDate",
      header: ({ column }) => <SortableHeader label="Joined" column={column} />,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(getValue() as string)}
        </span>
      ),
    },
  ], []);

  const table = useReactTable({
    data: sortedCustomers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    enableRowSelection: true,
    manualPagination: true,
  });

  // Stats
  const totalSubs = customers.filter((c) => c.activeMealPlan !== null).length;
  const activeSubs = customers.filter((c) => c.subscriptionStatus === "ACTIVE").length;
  const totalCompleted = customers.reduce((a, c) => a + c.completedSchedules, 0);

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="bg-background rounded-2xl border border-border flex flex-wrap divide-x divide-border overflow-hidden">
        {[
          { icon: Users,        value: meta?.total ?? 0, label: "Total Customers",         color: "#F4CD2E", iconBg: "#8E771B" },
          { icon: Zap,          value: activeSubs,        label: "Active Meal Plan Subs",   color: "#DD3131", iconBg: "#DD3131" },
          { icon: CheckCircle2, value: totalCompleted,    label: "Schedules Completed",     color: "#007606", iconBg: "#007606" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="flex items-center gap-4 px-6 py-4 flex-1 min-w-[160px]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.iconBg}20` }}>
                <Icon className="w-6 h-6" style={{ color: stat.iconBg }} />
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}

        {/* Sort */}
        <div ref={sortRef} className="flex items-center gap-3 px-6 py-4 flex-shrink-0 relative">
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Sort by:</span>
          <button onClick={() => setShowSort((p) => !p)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground border border-border rounded-xl px-3 py-1.5 hover:bg-muted transition-colors whitespace-nowrap">
            {sort}
            <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? "rotate-180" : ""}`} />
          </button>
          {showSort && (
            <div className="absolute right-4 top-full mt-1 w-48 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-30">
              {SORTS.map((s) => (
                <button key={s} onClick={() => { setSort(s); setShowSort(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sort === s ? "text-primary font-semibold bg-primary/5" : "text-foreground hover:bg-muted"
                  }`}>{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-border flex-wrap">
          <Button variant="outline" className="rounded-full border-border text-sm flex items-center gap-2 h-8 px-4">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <div className="flex items-center gap-1 flex-wrap">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => { setCustomerFilter(f); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap ${
                  customerFilter === f
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary bg-background"
                }`}>
                {f} {f === "All Customers" && meta ? `(${meta.total})` :
                     f === "Active Subscribers" ? `(${activeSubs})` :
                     `(${customers.filter(c => c.subscriptionStatus === "PAUSED").length})`}
              </button>
            ))}
          </div>
          <div className="relative ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="pl-9 rounded-full border-border bg-background h-8 text-xs w-48" />
            </div>
            <button onClick={load} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button className="w-8 h-8 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {error && (
          <div className="px-5 py-4 text-sm text-destructive text-center">
            {error} — <button onClick={load} className="underline">retry</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border bg-muted/20">
                  {hg.headers.map((header) => (
                    <th key={header.id} className="text-left text-xs font-bold text-muted-foreground px-4 py-3">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50 animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-3 bg-muted rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : (
                <>
                  {table.getRowModel().rows.map((row, i) => (
                    <motion.tr key={row.id}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className={`border-b border-border/50 last:border-0 transition-colors ${
                        row.getIsSelected() ? "bg-primary/5" : "hover:bg-muted/20"
                      }`}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                  {table.getRowModel().rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                        No customers found.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)}
              </span> of <span className="font-semibold text-foreground">{meta.total}</span>
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!meta.hasPrevPage}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-muted-foreground font-medium">{meta.page} / {meta.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={!meta.hasNextPage}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}