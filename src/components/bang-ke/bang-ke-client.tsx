"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  FileText,
  Loader2,
  Info,
  CalendarPlus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMonthlyStatements,
  getMonthlyStatement,
  confirmMonthlyStatement,
  createMonthlyStatement,
  autoRolloverStatements,
  updateMonthlyStatement,
  getDeletedMonthlyStatements,
  restoreMonthlyStatement,
} from "@/actions/monthly-statements";
import type { StatementListItem, StatementDTO, PlantItem } from "@/types/monthly-statement";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

// Dynamic imports for heavy components - reduces initial bundle size
const EditablePlantTable = dynamic(
  () => import("@/components/bang-ke/editable-plant-table").then((m) => m.EditablePlantTable),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden="true" />
        <span className="sr-only">Đang tải...</span>
      </div>
    ),
  }
);

const DeletedStatementsModal = dynamic(
  () => import("@/components/bang-ke/deleted-statements-modal").then((m) => m.DeletedStatementsModal),
  { ssr: false }
);

// =============================================================================
// TYPES
// =============================================================================
interface CustomerItem {
  id: string;
  code: string;
  companyName: string;
  shortName: string | null;
  district: string | null;
  address: string;
  contactName: string | null;
  accountingName: string | null;
}

interface DeletedStatement {
  id: string;
  customerId: string;
  year: number;
  month: number;
  deletedAt: Date;
  deletedBy: { name: string; email: string } | null;
  daysSinceDeleted: number;
  canRestore: boolean;
  customer: {
    code: string;
    companyName: string;
    shortName: string | null;
  };
}

interface BangKeClientProps {
  initialCustomers: CustomerItem[];
  initialStatements: StatementListItem[];
  initialYears: Array<{ year: number; count: number }>;
  initialYear: number;
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================
export function BangKeClient({
  initialCustomers,
  initialStatements,
  initialYears,
  initialYear,
}: BangKeClientProps) {
  const searchParams = useSearchParams();
  const customerIdFromUrl = searchParams.get("customerId");

  // ===== STATE =====
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customerIdFromUrl);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statements, setStatements] = useState<StatementListItem[]>(initialStatements);
  const [customers] = useState<CustomerItem[]>(initialCustomers);
  const [currentStatementDetail, setCurrentStatementDetail] = useState<StatementDTO | null>(null);
  const [availableYears] = useState<Array<{ year: number; count: number }>>(initialYears);

  // Loading states
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingPlants, setIsSavingPlants] = useState(false);
  const [isRollingOver, setIsRollingOver] = useState(false);
  const [rolloverResult, setRolloverResult] = useState<{ created: number; message: string } | null>(null);

  // Deleted statements state
  const [deletedStatements, setDeletedStatements] = useState<DeletedStatement[]>([]);
  const [isDeletedModalOpen, setIsDeletedModalOpen] = useState(false);
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);

  // ===== DEBOUNCED SEARCH =====
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ===== SAVE SELECTED YEAR TO LOCALSTORAGE =====
  useEffect(() => {
    if (selectedYear !== null) {
      localStorage.setItem("bangke-selected-year", selectedYear.toString());
    }
  }, [selectedYear]);

  // ===== LOAD STATEMENTS WHEN YEAR CHANGES =====
  useEffect(() => {
    // Skip initial load since we have initialStatements
    if (selectedYear === initialYear && statements === initialStatements) {
      return;
    }

    async function loadStatements() {
      try {
        setIsLoadingList(true);
        const statementsResult = await getMonthlyStatements({
          year: selectedYear,
          limit: 500,
          offset: 0,
        });

        if (statementsResult.success && statementsResult.data) {
          setStatements(statementsResult.data.items || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Không thể tải dữ liệu");
      } finally {
        setIsLoadingList(false);
      }
    }
    loadStatements();
  }, [selectedYear, initialYear, initialStatements, statements]);

  // ===== AUTO-SELECT FROM URL =====
  useEffect(() => {
    if (customerIdFromUrl && customers.length > 0 && !selectedCustomerId) {
      const customerExists = customers.some((c) => c.id === customerIdFromUrl);
      if (customerExists) {
        setSelectedCustomerId(customerIdFromUrl);
      }
    }
  }, [customerIdFromUrl, customers, selectedCustomerId]);

  // ===== PRE-COMPUTED MAPS (O(1) Lookups) =====
  const statementsByCustomer = useMemo(() => {
    const grouped = new Map<string, StatementListItem[]>();
    statements.forEach((s) => {
      const existing = grouped.get(s.customerId) || [];
      existing.push(s);
      grouped.set(s.customerId, existing);
    });
    return grouped;
  }, [statements]);

  const customerStatements = useMemo(
    () => (selectedCustomerId ? statementsByCustomer.get(selectedCustomerId) || [] : []),
    [selectedCustomerId, statementsByCustomer]
  );

  const currentStatement = useMemo(
    () => customerStatements.find((s) => s.month === selectedMonth),
    [customerStatements, selectedMonth]
  );

  // ===== LOAD STATEMENT DETAIL =====
  const loadStatementDetail = useCallback(async (id: string) => {
    try {
      setIsLoadingDetail(true);
      setCurrentStatementDetail(null);

      const result = await getMonthlyStatement({ id });
      if (result.success && result.data) {
        setCurrentStatementDetail(result.data);
      } else {
        console.error("Failed to load statement detail:", !result.success && result.error);
        toast.error("Không thể tải chi tiết bảng kê");
      }
    } catch (error) {
      console.error("Error loading statement detail:", error);
      toast.error("Lỗi khi tải chi tiết bảng kê");
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  // ===== LOAD DETAIL WHEN SELECTION CHANGES =====
  useEffect(() => {
    setCurrentStatementDetail(null);

    if (currentStatement?.id) {
      loadStatementDetail(currentStatement.id);
    }
  }, [currentStatement?.id, loadStatementDetail]);

  // ===== ACTIONS =====
  async function handleConfirmStatement(id: string) {
    try {
      setIsConfirming(true);
      const result = await confirmMonthlyStatement({ id });
      if (result.success) {
        toast.success(result.data?.message || "Đã xác nhận bảng kê");
        const statementsResult = await getMonthlyStatements({
          year: selectedYear,
          limit: 500,
          offset: 0,
        });
        if (statementsResult.success && statementsResult.data) {
          setStatements(statementsResult.data.items || []);
        }
        if (currentStatementDetail) {
          await loadStatementDetail(id);
        }
      } else {
        throw new Error(result.error || "Không thể xác nhận");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể xác nhận bảng kê";
      toast.error(message);
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleCreateStatement() {
    if (!selectedCustomerId) return;
    setIsCreating(true);
    try {
      const rollover = await autoRolloverStatements({
        targetYear: selectedYear,
        targetMonth: selectedMonth,
        customerIds: [selectedCustomerId],
      });

      if (rollover.success && rollover.data && rollover.data.created > 0) {
        toast.success(rollover.data.message);
      } else {
        if (!rollover.success) {
          console.warn("Rollover failed, creating empty statement:", rollover.error);
        }
        const customer = customers.find((c) => c.id === selectedCustomerId);
        const defaultContactName = customer?.accountingName || customer?.contactName || "";
        const created = await createMonthlyStatement({
          customerId: selectedCustomerId,
          year: selectedYear,
          month: selectedMonth,
          plants: [],
          contactName: defaultContactName,
          notes: "",
        });
        if (created.success) {
          toast.success("Đã tạo bảng kê mới (trống)");
        } else {
          toast.error(created.error || "Không thể tạo bảng kê");
        }
      }

      const statementsResult = await getMonthlyStatements({
        year: selectedYear,
        limit: 500,
        offset: 0,
      });
      if (statementsResult.success && statementsResult.data) {
        setStatements(statementsResult.data.items || []);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể tạo bảng kê";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleExportCSV() {
    if (!currentStatementDetail) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    try {
      const { generateMonthlyStatementCSV, getStatementFilename } =
        await import("@/lib/csv/export-monthly-statement");

      const csv = generateMonthlyStatementCSV(currentStatementDetail);
      const filename = getStatementFilename(
        currentStatementDetail.customer?.companyName || "company",
        currentStatementDetail.year,
        currentStatementDetail.month
      );

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Đã xuất file CSV");
    } catch (error) {
      console.error("Failed to export CSV:", error);
      toast.error("Không thể xuất file CSV");
    }
  }

  function handleExportPDF() {
    if (!currentStatementDetail) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    const pdfUrl = `/api/statements/${currentStatementDetail.id}/pdf`;
    window.open(pdfUrl, "_blank");
  }

  async function handleSavePlants(plants: PlantItem[]) {
    if (!currentStatementDetail) return;

    setIsSavingPlants(true);
    try {
      const result = await updateMonthlyStatement({
        id: currentStatementDetail.id,
        plants,
        contactName: currentStatementDetail.contactName,
        notes: currentStatementDetail.notes ?? undefined,
        internalNotes: currentStatementDetail.internalNotes ?? undefined,
      });

      if (result.success) {
        toast.success("Đã lưu thay đổi");
        await loadStatementDetail(currentStatementDetail.id);
        const statementsResult = await getMonthlyStatements({
          year: selectedYear,
          limit: 500,
          offset: 0,
        });
        if (statementsResult.success && statementsResult.data) {
          setStatements(statementsResult.data.items || []);
        }
      } else {
        throw new Error(result.error || "Không thể lưu");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể lưu thay đổi";
      toast.error(message);
    } finally {
      setIsSavingPlants(false);
    }
  }

  async function handleRollover() {
    const now = new Date();
    const targetYear = now.getFullYear();
    const targetMonth = now.getMonth() + 1;

    setIsRollingOver(true);
    setRolloverResult(null);

    try {
      const result = await autoRolloverStatements({
        targetYear,
        targetMonth,
      });

      if (result.success && result.data) {
        setRolloverResult(result.data);
        toast.success(`Đã tạo ${result.data.created} bảng kê mới`);

        const statementsResult = await getMonthlyStatements({
          year: selectedYear,
          limit: 500,
          offset: 0,
        });
        if (statementsResult.success && statementsResult.data) {
          setStatements(statementsResult.data.items || []);
        }
      } else {
        throw new Error("Không thể rollover");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể rollover bảng kê";
      toast.error(message);
    } finally {
      setIsRollingOver(false);
    }
  }

  async function handleOpenDeletedModal() {
    setIsDeletedModalOpen(true);
    setIsLoadingDeleted(true);

    try {
      const result = await getDeletedMonthlyStatements({
        year: selectedYear,
        limit: 100,
        offset: 0,
      });

      if (result.success) {
        // Cast to DeletedStatement[] as the API returns deleted statement data
        setDeletedStatements((result.data?.items || []) as unknown as DeletedStatement[]);
      } else {
        throw new Error("success" in result && !result.success && "error" in result ? result.error : "Không thể tải danh sách đã xóa");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách đã xóa";
      toast.error(message);
    } finally {
      setIsLoadingDeleted(false);
    }
  }

  async function handleRestoreStatement(id: string) {
    setIsRestoring(true);

    try {
      const result = await restoreMonthlyStatement({ id });

      if (result.success) {
        toast.success("Đã khôi phục bảng kê");

        await Promise.all([
          handleOpenDeletedModal(),
          (async () => {
            const statementsResult = await getMonthlyStatements({
              year: selectedYear,
              limit: 500,
              offset: 0,
            });
            if (statementsResult.success && statementsResult.data) {
              setStatements(statementsResult.data.items || []);
            }
          })(),
        ]);
      } else {
        throw new Error(result.error || "Không thể khôi phục");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể khôi phục bảng kê";
      toast.error(message);
    } finally {
      setIsRestoring(false);
    }
  }

  // ===== LOAD DELETED COUNT =====
  useEffect(() => {
    async function loadDeletedCount() {
      if (!selectedYear) return;

      try {
        const result = await getDeletedMonthlyStatements({
          year: selectedYear,
          limit: 1,
          offset: 0,
        });

        if (result.success && result.data) {
          setDeletedCount(result.data.total || 0);
        }
      } catch (error) {
        console.error("Failed to load deleted count:", error);
      }
    }

    loadDeletedCount();
  }, [selectedYear, statements]);

  // ===== COMPUTED VALUES =====
  const filteredCustomers = useMemo(
    () => customers.filter((c) => c.companyName.toLowerCase().includes(searchQuery.toLowerCase())),
    [customers, searchQuery]
  );

  const monthlyStatements = useMemo(
    () => statements.filter((s) => s.month === selectedMonth),
    [statements, selectedMonth]
  );

  const pendingStatements = useMemo(
    () => monthlyStatements.filter((s) => s.needsConfirmation),
    [monthlyStatements]
  );

  const confirmedStatements = useMemo(
    () => monthlyStatements.filter((s) => !s.needsConfirmation),
    [monthlyStatements]
  );

  const monthlyTotal = useMemo(
    () => monthlyStatements.reduce((sum, s) => sum + s.total, 0),
    [monthlyStatements]
  );

  const years = useMemo(() => {
    if (availableYears.length > 0) {
      return availableYears;
    }
    const currentYear = new Date().getFullYear();
    return [
      { year: currentYear, count: 0 },
      { year: currentYear - 1, count: 0 }
    ];
  }, [availableYears]);

  const months = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (selectedYear === currentYear) {
      return Array.from({ length: currentMonth }, (_, i) => i + 1);
    } else if (selectedYear === currentYear - 1) {
      return [12];
    }
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, [selectedYear]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ===== SIDEBAR ===== */}
      <CustomerSidebar
        customers={filteredCustomers}
        selectedCustomerId={selectedCustomerId}
        selectedMonth={selectedMonth}
        statementsByCustomer={statementsByCustomer}
        searchInput={searchInput}
        isLoadingList={isLoadingList}
        onSearchChange={setSearchInput}
        onSelectCustomer={setSelectedCustomerId}
      />

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50">
        {selectedCustomerId ? (
          <CustomerStatementView
            customer={selectedCustomer}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            years={years}
            months={months}
            customerStatements={customerStatements}
            currentStatement={currentStatement}
            currentStatementDetail={currentStatementDetail}
            isLoadingDetail={isLoadingDetail}
            isConfirming={isConfirming}
            isCreating={isCreating}
            isSavingPlants={isSavingPlants}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            onConfirm={handleConfirmStatement}
            onCreate={handleCreateStatement}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            onSavePlants={handleSavePlants}
          />
        ) : (
          <OverviewDashboard
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            years={years}
            months={months}
            monthlyStatements={monthlyStatements}
            pendingStatements={pendingStatements}
            confirmedStatements={confirmedStatements}
            monthlyTotal={monthlyTotal}
            customers={customers}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            onSelectCustomer={setSelectedCustomerId}
            isRollingOver={isRollingOver}
            rolloverResult={rolloverResult}
            onRollover={handleRollover}
            deletedCount={deletedCount}
            onOpenDeleted={handleOpenDeletedModal}
          />
        )}
      </div>

      {/* Deleted Statements Modal */}
      <DeletedStatementsModal
        isOpen={isDeletedModalOpen}
        onClose={() => setIsDeletedModalOpen(false)}
        onRestore={handleRestoreStatement}
        deletedStatements={deletedStatements}
        isLoading={isLoadingDeleted}
        isRestoring={isRestoring}
      />
    </div>
  );
}

// =============================================================================
// CUSTOMER SIDEBAR
// =============================================================================
interface CustomerSidebarProps {
  customers: CustomerItem[];
  selectedCustomerId: string | null;
  selectedMonth: number;
  statementsByCustomer: Map<string, StatementListItem[]>;
  searchInput: string;
  isLoadingList: boolean;
  onSearchChange: (value: string) => void;
  onSelectCustomer: (id: string) => void;
}

function CustomerSidebar({
  customers,
  selectedCustomerId,
  selectedMonth,
  statementsByCustomer,
  searchInput,
  isLoadingList,
  onSearchChange,
  onSelectCustomer,
}: CustomerSidebarProps) {
  return (
    <div className="flex h-full w-80 flex-col border-r bg-white">
      {/* Sidebar Header */}
      <div className="sticky top-0 z-10 border-b bg-white/95 p-5 backdrop-blur-md">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Đối soát Bảng kê</h1>
        <p className="text-muted-foreground mt-0.5 text-xs font-medium">
          Cây xanh văn phòng & Dịch vụ
        </p>
        <div className="relative mt-4">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" aria-hidden="true" />
          <Input
            placeholder="Tìm công ty..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 border-slate-200 bg-slate-50 pl-9 text-sm transition-colors focus:bg-white"
            aria-label="Tìm kiếm khách hàng"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingList ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden="true" />
            <p className="mt-2 text-xs font-medium text-slate-400">Đang tải...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">
            {searchInput ? "Không tìm thấy khách hàng" : "Chưa có khách hàng"}
          </div>
        ) : (
          customers.map((customer) => {
            const customerStmts = statementsByCustomer.get(customer.id) || [];
            const hasUnconfirmed = customerStmts.some((s) => s.needsConfirmation);
            const monthlyTotalCustomer = customerStmts.find((s) => s.month === selectedMonth)?.total || 0;
            const isSelected = selectedCustomerId === customer.id;

            return (
              <button
                key={customer.id}
                type="button"
                onClick={() => onSelectCustomer(customer.id)}
                className={cn(
                  "w-full cursor-pointer border-b border-slate-100 p-4 text-left transition-all",
                  isSelected
                    ? "border-l-primary bg-primary/5 border-l-4"
                    : "hover:bg-slate-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors",
                      isSelected
                        ? "bg-primary text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-600"
                    )}
                  >
                    {customer.shortName?.substring(0, 2).toUpperCase() ||
                      customer.companyName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={cn(
                          "truncate text-sm font-semibold",
                          isSelected ? "text-primary" : "text-slate-800"
                        )}
                      >
                        {customer.companyName}
                      </div>
                      {hasUnconfirmed && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase">
                          Cần duyệt
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-[10px] font-medium">
                      <span>{customer.district}</span>
                      <span>•</span>
                      <span>{customerStmts.length} bản ghi</span>
                    </div>
                    {monthlyTotalCustomer > 0 && (
                      <div className="mt-1.5 text-xs font-bold text-slate-700">
                        {formatCurrency(monthlyTotalCustomer)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CUSTOMER STATEMENT VIEW
// =============================================================================
interface CustomerStatementViewProps {
  customer: CustomerItem | undefined;
  selectedYear: number;
  selectedMonth: number;
  years: Array<{ year: number; count: number }>;
  months: number[];
  customerStatements: StatementListItem[];
  currentStatement: StatementListItem | undefined;
  currentStatementDetail: StatementDTO | null;
  isLoadingDetail: boolean;
  isConfirming: boolean;
  isCreating: boolean;
  isSavingPlants: boolean;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onConfirm: (id: string) => void;
  onCreate: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onSavePlants: (plants: PlantItem[]) => Promise<void>;
}

function CustomerStatementView({
  customer,
  selectedYear,
  selectedMonth,
  years,
  months,
  customerStatements,
  currentStatement,
  currentStatementDetail,
  isLoadingDetail,
  isConfirming,
  isCreating,
  isSavingPlants,
  onYearChange,
  onMonthChange,
  onConfirm,
  onCreate,
  onExportCSV,
  onExportPDF,
  onSavePlants,
}: CustomerStatementViewProps) {
  return (
    <div className="mx-auto max-w-5xl p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {customer?.companyName}
          </h2>
          <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{customer?.address}</span>
          </div>
        </div>
        <div className="flex items-center rounded-lg border bg-white p-1 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExportCSV}
            disabled={!currentStatementDetail}
            className="h-8 gap-1.5 text-[10px] font-bold tracking-wider uppercase"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Excel
          </Button>
          <div className="bg-border mx-1 h-4 w-px" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onExportPDF}
            disabled={!currentStatementDetail}
            className="h-8 gap-1.5 text-[10px] font-bold tracking-wider uppercase"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            In PDF
          </Button>
        </div>
      </div>

      {/* Old Year Notification */}
      {selectedYear < new Date().getFullYear() && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <Info className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
          <p className="text-sm font-medium text-blue-800">
            Đang xem dữ liệu năm {selectedYear}. Năm hiện tại là {new Date().getFullYear()}.
          </p>
        </div>
      )}

      {/* Year & Month Selector */}
      <div className="mb-8 rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Thời gian đối soát
          </p>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {years.map((yearData) => (
              <button
                key={yearData.year}
                onClick={() => onYearChange(yearData.year)}
                className={cn(
                  "flex flex-col items-center rounded-md px-3 py-1.5 text-xs font-bold transition-all",
                  selectedYear === yearData.year
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <span>{yearData.year}</span>
                {yearData.count > 0 && (
                  <span className={cn(
                    "mt-0.5 text-[9px] font-medium",
                    selectedYear === yearData.year ? "text-primary" : "text-slate-400"
                  )}>
                    ({yearData.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {months.map((month) => {
            const stmt = customerStatements.find((s) => s.month === month);
            const isSelected = selectedMonth === month;
            const needsConfirm = stmt?.needsConfirmation;

            return (
              <button
                key={month}
                onClick={() => onMonthChange(month)}
                className={cn(
                  "relative flex h-11 min-w-[80px] flex-col items-center justify-center rounded-lg border text-xs font-bold transition-all",
                  isSelected
                    ? "bg-primary border-primary text-white shadow-md"
                    : "hover:border-primary/50 border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  needsConfirm && !isSelected ? "border-amber-300 bg-amber-50/50" : ""
                )}
              >
                Tháng {month}
                {needsConfirm && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full border-2 border-white",
                      isSelected ? "bg-white" : "bg-amber-500"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Statement Card */}
      {currentStatement ? (
        <StatementCard
          currentStatement={currentStatement}
          currentStatementDetail={currentStatementDetail}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          isLoadingDetail={isLoadingDetail}
          isConfirming={isConfirming}
          isSavingPlants={isSavingPlants}
          onConfirm={onConfirm}
          onSavePlants={onSavePlants}
        />
      ) : (
        <EmptyStatementState
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          years={years}
          isCreating={isCreating}
          onCreate={onCreate}
        />
      )}
    </div>
  );
}

// =============================================================================
// STATEMENT CARD
// =============================================================================
interface StatementCardProps {
  currentStatement: StatementListItem;
  currentStatementDetail: StatementDTO | null;
  selectedYear: number;
  selectedMonth: number;
  isLoadingDetail: boolean;
  isConfirming: boolean;
  isSavingPlants: boolean;
  onConfirm: (id: string) => void;
  onSavePlants: (plants: PlantItem[]) => Promise<void>;
}

function StatementCard({
  currentStatement,
  currentStatementDetail,
  selectedYear,
  selectedMonth,
  isLoadingDetail,
  isConfirming,
  isSavingPlants,
  onConfirm,
  onSavePlants,
}: StatementCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white shadow-sm",
        currentStatement.needsConfirmation ? "border-amber-200" : "border-slate-200"
      )}
    >
      {/* Card Header */}
      <div
        className={cn(
          "flex items-start justify-between border-b p-6",
          currentStatement.needsConfirmation ? "bg-amber-50/50" : "bg-slate-50/50"
        )}
      >
        <div>
          <div className="flex items-center gap-3">
            <Calendar
              className={cn(
                "h-5 w-5",
                currentStatement.needsConfirmation ? "text-amber-500" : "text-primary"
              )}
              aria-hidden="true"
            />
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Tháng {selectedMonth} / {selectedYear}
            </h3>
            {currentStatement.needsConfirmation ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700 uppercase">
                Chờ xác nhận
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 uppercase">
                Đã duyệt
              </span>
            )}
          </div>
          {currentStatementDetail && (
            <p className="mt-1 ml-8 text-xs font-semibold text-blue-600">
              Đợt ({new Date(currentStatementDetail.periodStart).toLocaleDateString("vi-VN")} - {new Date(currentStatementDetail.periodEnd).toLocaleDateString("vi-VN")})
            </p>
          )}
          <p className="text-muted-foreground mt-1 ml-8 text-sm font-medium">
            {currentStatement.plantCount} loại cây xanh đang thuê
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground mb-1 text-[10px] font-bold tracking-widest uppercase">
            Tổng cộng (Đã có VAT)
          </p>
          <div className="text-primary text-3xl font-black">
            {formatCurrency(currentStatement.total)}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        {/* Pending Banner */}
        {currentStatement.needsConfirmation && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-amber-900">Thông tin mới cập nhật</p>
                <p className="mt-0.5 text-xs font-medium text-amber-700">
                  Hệ thống đã tự động sao chép dữ liệu từ tháng trước. Vui lòng đối soát số
                  lượng & đơn giá thực tế.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="h-9 shrink-0 bg-amber-600 px-5 font-bold text-white shadow-sm hover:bg-amber-700"
              onClick={() => onConfirm(currentStatement.id)}
              disabled={isConfirming}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
              {isConfirming ? "Đang xử lý..." : "Duyệt Bảng Kê"}
            </Button>
          </div>
        )}

        {/* Plant Table */}
        {isLoadingDetail ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-slate-400">Đang tải chi tiết...</p>
          </div>
        ) : currentStatementDetail ? (
          <div>
            <EditablePlantTable
              plants={currentStatementDetail.plants}
              isEditable={currentStatementDetail.needsConfirmation}
              onSave={onSavePlants}
              isSaving={isSavingPlants}
            />

            {/* Financial Summary */}
            <FinancialSummary
              subtotal={currentStatementDetail.subtotal}
              vatRate={currentStatementDetail.vatRate}
              isEditable={currentStatementDetail.needsConfirmation}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-20 text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-400">
              Không thể tải chi tiết bảng kê
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EMPTY STATEMENT STATE
// =============================================================================
interface EmptyStatementStateProps {
  selectedYear: number;
  selectedMonth: number;
  years: Array<{ year: number; count: number }>;
  isCreating: boolean;
  onCreate: () => void;
}

function EmptyStatementState({
  selectedYear,
  selectedMonth,
  years,
  isCreating,
  onCreate,
}: EmptyStatementStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-24">
      <Calendar className="mb-6 h-16 w-16 text-slate-200" aria-hidden="true" />
      <h3 className="text-lg font-bold text-slate-900">Chưa có Bảng Kê</h3>
      <p className="mt-1 max-w-xs text-center text-sm font-medium text-slate-500">
        Bảng kê cho tháng {selectedMonth}/{selectedYear} chưa được tạo hoặc khách hàng chưa bắt
        đầu dịch vụ trong kỳ này.
      </p>
      {years.some(y => y.year !== selectedYear && y.count > 0) && (
        <div className="mt-4 max-w-xs rounded-lg bg-blue-50 p-4 text-left">
          <p className="text-xs font-semibold text-blue-700 mb-2">💡 Gợi ý:</p>
          <p className="text-xs text-blue-600">
            Có dữ liệu cho{" "}
            {years
              .filter(y => y.year !== selectedYear && y.count > 0)
              .map(y => `năm ${y.year}`)
              .join(", ")}
            . Thử chọn năm khác ở góc phải trên.
          </p>
        </div>
      )}
      <Button
        className="mt-6 h-10 bg-slate-900 px-8 font-bold text-white hover:bg-slate-800"
        variant="default"
        onClick={onCreate}
        disabled={isCreating}
      >
        {isCreating ? "Đang tạo..." : "Khởi tạo dữ liệu tháng mới"}
      </Button>
    </div>
  );
}

// =============================================================================
// OVERVIEW DASHBOARD
// =============================================================================
interface OverviewDashboardProps {
  selectedYear: number;
  selectedMonth: number;
  years: Array<{ year: number; count: number }>;
  months: number[];
  monthlyStatements: StatementListItem[];
  pendingStatements: StatementListItem[];
  confirmedStatements: StatementListItem[];
  monthlyTotal: number;
  customers: CustomerItem[];
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onSelectCustomer: (id: string) => void;
  isRollingOver: boolean;
  rolloverResult: { created: number; message: string } | null;
  onRollover: () => void;
  deletedCount: number;
  onOpenDeleted: () => void;
}

function OverviewDashboard({
  selectedYear,
  selectedMonth,
  years,
  months,
  monthlyStatements,
  pendingStatements,
  confirmedStatements,
  monthlyTotal,
  customers,
  onYearChange,
  onMonthChange,
  onSelectCustomer,
  isRollingOver,
  rolloverResult,
  onRollover,
  deletedCount,
  onOpenDeleted,
}: OverviewDashboardProps) {
  return (
    <div className="mx-auto max-w-5xl p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Tổng quan Bảng kê</h2>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              Chọn khách hàng từ danh sách bên trái để xem chi tiết
            </p>
          </div>
          <div className="flex items-center gap-3">
            {deletedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenDeleted}
                className="text-slate-600 hover:text-slate-900"
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Đã xóa
                <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold">
                  {deletedCount}
                </span>
              </Button>
            )}

            {/* Year Selector */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {years.map((yearData) => (
                <button
                  key={yearData.year}
                  onClick={() => onYearChange(yearData.year)}
                  className={cn(
                    "flex flex-col items-center rounded-md px-3 py-1.5 text-xs font-bold transition-all",
                    selectedYear === yearData.year
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <span>{yearData.year}</span>
                  {yearData.count > 0 && (
                    <span className={cn(
                      "mt-0.5 text-[9px] font-medium",
                      selectedYear === yearData.year ? "text-primary" : "text-slate-400"
                    )}>
                      ({yearData.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {months.map((month) => (
            <button
              key={month}
              onClick={() => onMonthChange(month)}
              className={cn(
                "h-8 rounded-md border px-3 text-xs font-bold transition-all",
                selectedMonth === month
                  ? "bg-primary border-primary text-white shadow-sm"
                  : "hover:border-primary/50 hover:text-primary border-slate-200 bg-white text-slate-600"
              )}
            >
              Tháng {month}
            </button>
          ))}
        </div>
      </div>

      {/* Old Year Notification */}
      {selectedYear < new Date().getFullYear() && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <Info className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
          <p className="text-sm font-medium text-blue-800">
            Đang xem dữ liệu năm {selectedYear}. Năm hiện tại là {new Date().getFullYear()}.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-l-4 border-l-slate-400 bg-white p-5 shadow-sm">
          <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Tổng bảng kê
          </p>
          <p className="mt-1 text-3xl font-black text-slate-900">{monthlyStatements.length}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-400">Kỳ hiện tại</p>
        </div>

        <div className="rounded-xl border border-l-4 border-l-amber-500 bg-white p-5 shadow-sm">
          <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Chờ duyệt
          </p>
          <p className="mt-1 text-3xl font-black text-amber-600">{pendingStatements.length}</p>
          <p className="mt-1 text-[10px] font-medium text-amber-500">Cần xử lý</p>
        </div>

        <div className="rounded-xl border border-l-4 border-l-emerald-500 bg-white p-5 shadow-sm">
          <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Đã xác nhận
          </p>
          <p className="mt-1 text-3xl font-black text-emerald-600">{confirmedStatements.length}</p>
          <p className="mt-1 text-[10px] font-medium text-emerald-500">Sẵn sàng xuất đơn</p>
        </div>

        <div className="border-l-primary rounded-xl border border-l-4 bg-white p-5 shadow-sm">
          <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Tổng giá trị
          </p>
          <p className="text-primary mt-1 text-2xl font-black">{formatCurrency(monthlyTotal)}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-400">Doanh thu kỳ</p>
        </div>
      </div>

      {/* Rollover Management Section */}
      <RolloverSection
        isRollingOver={isRollingOver}
        rolloverResult={rolloverResult}
        onRollover={onRollover}
      />

      {/* Pending List */}
      {pendingStatements.length > 0 && (
        <PendingStatementsList
          pendingStatements={pendingStatements}
          customers={customers}
          onSelectCustomer={onSelectCustomer}
        />
      )}

      {/* All Clear State */}
      {pendingStatements.length === 0 && monthlyStatements.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" aria-hidden="true" />
          <h3 className="text-lg font-bold text-emerald-700">Tất cả bảng kê đã được duyệt</h3>
          <p className="mt-1 text-sm font-medium text-emerald-600">
            Sẵn sàng xuất hóa đơn VAT cho kỳ này
          </p>
        </div>
      )}

      {/* Empty State */}
      {monthlyStatements.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Calendar className="mx-auto mb-4 h-16 w-16 text-slate-300" aria-hidden="true" />
          <h3 className="text-lg font-bold text-slate-600">Chưa có dữ liệu</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm font-medium text-slate-400">
            Không có bảng kê nào cho tháng {selectedMonth}/{selectedYear}.
          </p>
          {years.some(y => y.year !== selectedYear && y.count > 0) && (
            <div className="mx-auto mt-4 max-w-sm rounded-lg bg-blue-50 p-4 text-left">
              <p className="text-xs font-semibold text-blue-700 mb-2">💡 Gợi ý:</p>
              <p className="text-xs text-blue-600">
                Dữ liệu có sẵn cho{" "}
                {years
                  .filter(y => y.year !== selectedYear && y.count > 0)
                  .map(y => `năm ${y.year} (${y.count} bảng kê)`)
                  .join(", ")}
                . Thử chọn năm khác ở góc phải trên.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ROLLOVER SECTION
// =============================================================================
interface RolloverSectionProps {
  isRollingOver: boolean;
  rolloverResult: { created: number; message: string } | null;
  onRollover: () => void;
}

function RolloverSection({ isRollingOver, rolloverResult, onRollover }: RolloverSectionProps) {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const isFirstWeek = currentDay <= 7;

  return (
    <div className="mb-8 overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="border-b bg-gradient-to-r from-blue-50 to-blue-100/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2">
              <CalendarPlus className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Tạo Bảng kê Tháng mới
              </h3>
              <p className="text-xs font-medium text-slate-600">
                Tháng {currentMonth}/{currentYear} từ dữ liệu tháng {previousMonth}/{previousYear}
              </p>
            </div>
          </div>
          <Button
            onClick={onRollover}
            disabled={isRollingOver}
            size="sm"
            className="bg-blue-600 font-bold text-white hover:bg-blue-700"
          >
            {isRollingOver ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Đang tạo...
              </>
            ) : (
              <>
                <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                Tạo cho tất cả khách hàng
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* First Week Reminder */}
        {isFirstWeek && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
            <div className="text-sm text-green-900">
              <p className="font-semibold">Thời điểm tốt để tạo bảng kê!</p>
              <p className="mt-1 text-green-800">
                Đây là tuần đầu tiên của tháng {currentMonth}. Nên tạo bảng kê ngay để có thời gian kiểm tra và xác nhận.
              </p>
            </div>
          </div>
        )}

        {/* Success Result */}
        {rolloverResult && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div className="text-sm text-emerald-900">
              <p className="font-semibold">Hoàn thành!</p>
              <p className="mt-1 text-emerald-800">{rolloverResult.message}</p>
              <p className="mt-2 text-xs text-emerald-700">
                Kiểm tra danh sách bảng kê bên trái để xác nhận dữ liệu
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" aria-hidden="true" />
          <div className="text-xs text-slate-700">
            <p className="font-semibold">Lưu ý:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Sao chép dữ liệu từ tháng trước</li>
              <li>Chỉ tạo cho khách hàng chưa có bảng kê tháng này</li>
              <li>Bảng kê mới ở trạng thái "Chờ duyệt"</li>
              <li>Kiểm tra và xác nhận sau khi tạo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PENDING STATEMENTS LIST
// =============================================================================
interface PendingStatementsListProps {
  pendingStatements: StatementListItem[];
  customers: CustomerItem[];
  onSelectCustomer: (id: string) => void;
}

function PendingStatementsList({
  pendingStatements,
  customers,
  onSelectCustomer,
}: PendingStatementsListProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="border-b bg-amber-50/50 px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide text-amber-700 uppercase">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          Cần duyệt ({pendingStatements.length})
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {pendingStatements.slice(0, 5).map((stmt) => {
          const customer = customers.find((c) => c.id === stmt.customerId);
          return (
            <button
              key={stmt.id}
              type="button"
              className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
              onClick={() => onSelectCustomer(stmt.customerId)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-xs font-bold text-amber-600">
                  {customer?.shortName?.substring(0, 2).toUpperCase() ||
                    customer?.companyName?.substring(0, 2).toUpperCase() ||
                    "??"}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{stmt.companyName}</p>
                  <p className="text-muted-foreground text-xs font-medium">
                    {stmt.district} • {stmt.plantCount} loại cây
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">
                  {formatCurrency(stmt.total)}
                </p>
                <p className="text-[10px] font-bold text-amber-600 uppercase">Chờ duyệt</p>
              </div>
            </button>
          );
        })}
      </div>
      {pendingStatements.length > 5 && (
        <div className="border-t bg-slate-50 p-3 text-center">
          <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            +{pendingStatements.length - 5} bảng kê khác cần duyệt
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// FINANCIAL SUMMARY
// =============================================================================
interface FinancialSummaryProps {
  subtotal: number;
  vatRate: number;
  isEditable: boolean;
}

function FinancialSummary({ subtotal, vatRate: initialVatRate, isEditable }: FinancialSummaryProps) {
  const normalizedRate = initialVatRate < 1 ? initialVatRate * 100 : initialVatRate;
  const [vatRate, setVatRate] = useState(normalizedRate || 8);
  const [isEditingVat, setIsEditingVat] = useState(false);

  const vatAmount = Math.round(subtotal * vatRate / 100);
  const total = subtotal + vatAmount;

  return (
    <div className="mt-8 flex justify-end">
      <div className="w-80 space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-6">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Tạm tính:</span>
          <span className="font-bold text-slate-900">
            {formatCurrency(subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1">
            Thuế VAT (
            {isEditable && isEditingVat ? (
              <input
                type="number"
                value={vatRate}
                onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                onBlur={() => setIsEditingVat(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingVat(false)}
                autoFocus
                className="w-12 rounded border px-1 py-0.5 text-center text-xs font-bold"
                min={0}
                max={100}
                step={0.5}
                aria-label="Phần trăm thuế VAT"
              />
            ) : (
              <button
                type="button"
                onClick={() => isEditable && setIsEditingVat(true)}
                className={cn(
                  "font-bold",
                  isEditable && "cursor-pointer rounded px-1 hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                )}
                title={isEditable ? "Nhấp để chỉnh sửa thuế VAT" : undefined}
                disabled={!isEditable}
                aria-label={isEditable ? `Thuế VAT ${vatRate}%, nhấp để chỉnh sửa` : `Thuế VAT ${vatRate}%`}
              >
                {vatRate}
              </button>
            )}
            %):
          </span>
          <span className="font-bold text-slate-900">
            {formatCurrency(vatAmount)}
          </span>
        </div>
        <div className="my-2 h-px bg-slate-200" />
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-black text-slate-900 uppercase">
            Thành tiền:
          </span>
          <span className="text-primary text-2xl font-black">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
