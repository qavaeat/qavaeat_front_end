
"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  Zap,
  CheckCircle2,
  Download,
  ChevronDown,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Customer } from "./types";

type CustomerFilter =
  | "All Customers"
  | "Active Subscribers"
  | "Paused Subscribers";
type SortOption = "Recently Joined" | "Most Orders" | "Highest Spent";

const MEAL_PLANS = [
  "Performance Fuel",
  "Vitality Veggie",
  "Low Carb Focus",
  null,
];

const DUMMY_CUSTOMERS: Customer[] = Array.from({ length: 32 }, (_, i) => ({
  id: `USR-${100 + i}`,
  name: [
    "John Waswa",
    "Peter Muli",
    "Emma Oketch",
    "Eunice Wendo",
    "Sarah Kim",
    "Brian Mutua",
    "Grace Njeri",
    "Kevin Otieno",
  ][i % 8],
  email: `user${i + 1}@example.com`,
  phone: "07346382729",
  totalOrders: Math.floor(Math.random() * 20) + 1,
  totalSpent: Math.floor(Math.random() * 15000) + 500,
  lastOrderDate:
    i < 3 ? "Today: 8:30AM" : i < 8 ? "Yesterday: 12:30PM" : `${i} days ago`,
  joinedDate: `0${(i % 9) + 1}/04/2026`,
  activeMealPlan: MEAL_PLANS[i % 4],
  status: i % 5 === 0 ? "inactive" : "active",
  avatarUrl: null,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SortableHeader({ label, column }: { label: string; column: any }) {
  return (
    <button
      className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="w-3 h-3" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  );
}

export function TabCustomers() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [customerFilter, setCustomerFilter] =
    useState<CustomerFilter>("All Customers");
  const [sort, setSort] = useState<SortOption>("Recently Joined");
  const [showSort, setShowSort] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const SORTS: SortOption[] = [
    "Recently Joined",
    "Most Orders",
    "Highest Spent",
  ];
  const FILTERS: CustomerFilter[] = [
    "All Customers",
    "Active Subscribers",
    "Paused Subscribers",
  ];

  const filteredData = useMemo(() => {
    return DUMMY_CUSTOMERS.filter((c) => {
      if (customerFilter === "Active Subscribers")
        return c.status === "active" && c.activeMealPlan !== null;
      if (customerFilter === "Paused Subscribers")
        return c.status === "inactive";
      return true;
    });
  }, [customerFilter]);

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="rounded border-border accent-primary"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-border accent-primary"
          />
        ),
        size: 40,
      },
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader label="Name" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-black text-muted-foreground flex-shrink-0">
              {row.original.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-foreground whitespace-nowrap">
                  {row.original.name}
                </p>
                <CheckCircle2 className="w-3 h-3 text-[#007606]" />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {row.original.totalOrders} order
                {row.original.totalOrders !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Contact",
        cell: ({ getValue }) => (
          <span className="text-xs text-foreground whitespace-nowrap">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "activeMealPlan",
        header: "Active Meal Plan",
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v ? (
            <span className="text-xs font-medium text-foreground whitespace-nowrap">
              {v}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "joinedDate",
        header: ({ column }) => (
          <SortableHeader label="Joined" column={column} />
        ),
        cell: ({ getValue }) => (
          <span className="text-xs text-foreground whitespace-nowrap">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "totalOrders",
        header: ({ column }) => (
          <SortableHeader label="Order" column={column} />
        ),
        cell: ({ getValue }) => (
          <span className="text-xs font-bold text-foreground">
            {getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: "lastOrderDate",
        header: ({ column }) => (
          <SortableHeader label="Last Order" column={column} />
        ),
        cell: ({ getValue }) => (
          <span className="text-xs text-foreground whitespace-nowrap">
            {getValue() as string}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 7 } },
    enableRowSelection: true,
  });

  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();

  const totalSubs = DUMMY_CUSTOMERS.filter(
    (c) => c.activeMealPlan !== null,
  ).length;
  const withPlans = DUMMY_CUSTOMERS.filter(
    (c) => c.activeMealPlan !== null && c.status === "active",
  ).length;
  const ordersCompleted = DUMMY_CUSTOMERS.reduce(
    (a, c) => a + c.totalOrders,
    0,
  );

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="bg-background rounded-2xl border border-border flex flex-wrap divide-x divide-border overflow-hidden">
        {[
          {
            icon: Users,
            value: totalSubs,
            label: "Total Subscribers",
            color: "#F4CD2E",
            iconBg: "#8E771B",
          },
          {
            icon: Zap,
            value: withPlans,
            label: "With Active Meal Plans",
            color: "#DD3131",
            iconBg: "#DD3131",
          },
          {
            icon: CheckCircle2,
            value: ordersCompleted,
            label: "Orders Completed",
            color: "#007606",
            iconBg: "#007606",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 flex-1 min-w-[160px]"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.iconBg}20` }}
              >
                <Icon className="w-6 h-6" style={{ color: stat.iconBg }} />
              </div>
              <div>
                <p
                  className="text-2xl font-black"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
        {/* Sort by */}
        <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0 relative">
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
            Sort by:
          </span>
          <button
            onClick={() => setShowSort((p) => !p)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground border border-border rounded-xl px-3 py-1.5 hover:bg-muted transition-colors whitespace-nowrap"
          >
            {sort}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showSort ? "rotate-180" : ""}`}
            />
          </button>
          {showSort && (
            <div className="absolute right-4 top-full mt-1 w-48 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-30">
              {SORTS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSort(s);
                    setShowSort(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sort === s
                      ? "text-primary font-semibold bg-primary/5"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-border flex-wrap">
          <Button
            variant="outline"
            className="rounded-full border-border text-sm flex items-center gap-2 h-8 px-4"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {FILTERS.map((f) => {
              const count =
                f === "All Customers"
                  ? DUMMY_CUSTOMERS.length
                  : f === "Active Subscribers"
                    ? DUMMY_CUSTOMERS.filter(
                        (c) => c.status === "active" && c.activeMealPlan,
                      ).length
                    : DUMMY_CUSTOMERS.filter((c) => c.status === "inactive")
                        .length;
              return (
                <button
                  key={f}
                  onClick={() => {
                    setCustomerFilter(f);
                    table.setPageIndex(0);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap ${
                    customerFilter === f
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary bg-background"
                  }`}
                >
                  {f} ({count})
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search customers..."
              className="pl-9 pr-3 rounded-full border-border bg-background h-8 text-xs w-48"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <button className="w-8 h-8 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border bg-muted/20">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left text-xs font-bold text-muted-foreground px-4 py-3"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className={`border-b border-border/50 last:border-0 transition-colors ${
                    row.getIsSelected() ? "bg-primary/5" : "hover:bg-muted/20"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-sm text-muted-foreground"
                  >
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 px-4 py-4 border-t border-border">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground font-medium">
            {pageIndex + 1} out of {pageCount || 1}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
