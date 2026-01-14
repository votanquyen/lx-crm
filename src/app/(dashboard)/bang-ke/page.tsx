"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getMonthlyStatements,
    getCustomersForStatements,
    getMonthlyStatement,
    confirmMonthlyStatement,
    createMonthlyStatement,
    autoRolloverStatements,
} from "@/actions/monthly-statements";
import type { StatementListItem, StatementDTO } from "@/types/monthly-statement";
import { formatCurrency } from "@/lib/format";
import { getMonthShort } from "@/lib/statement-utils";
import { BUSINESS_START_YEAR } from "@/lib/constants/billing";
import { toast } from "sonner";

export default function BangKePage() {
    const searchParams = useSearchParams();
    const customerIdFromUrl = searchParams.get("customerId");

    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Debounce search input (300ms delay)
    useEffect(() => {
        const timer = setTimeout(() => setSearchQuery(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Initialize selectedCustomerId from URL param if present
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customerIdFromUrl);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [statements, setStatements] = useState<StatementListItem[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [currentStatementDetail, setCurrentStatementDetail] = useState<StatementDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Auto-select customer from URL param when customers are loaded
    useEffect(() => {
        if (customerIdFromUrl && customers.length > 0 && !selectedCustomerId) {
            const customerExists = customers.some(c => c.id === customerIdFromUrl);
            if (customerExists) {
                setSelectedCustomerId(customerIdFromUrl);
            }
        }
    }, [customerIdFromUrl, customers, selectedCustomerId]);

    /**
     * PERFORMANCE: Load customers and statements in PARALLEL on mount/year change
     * This eliminates the waterfall: loadCustomers() -> loadStatements() (sequential)
     * Now both run simultaneously, saving ~200ms on initial load
     *
     * TODO: For further optimization, consider Option 4 (Hybrid SSR):
     * - Move this Promise.all to Server Component
     * - Pass data as props to client component
     * - Eliminates loading spinner entirely on first paint
     * - See: plans/260109-app-performance-optimization/phase-02-ssr-migration.md
     */
    useEffect(() => {
        async function loadInitialData() {
            try {
                setIsLoading(true);
                const [customersResult, statementsResult] = await Promise.all([
                    getCustomersForStatements({}),
                    getMonthlyStatements({
                        year: selectedYear,
                        limit: 500,
                        offset: 0,
                    }),
                ]);

                if (customersResult.success && customersResult.data) {
                    setCustomers(customersResult.data);
                }
                if (statementsResult.success && statementsResult.data) {
                    setStatements(statementsResult.data.items || []);
                }
            } catch (error) {
                console.error("Failed to load data:", error);
                toast.error("Không thể tải dữ liệu");
            } finally {
                setIsLoading(false);
            }
        }
        loadInitialData();
    }, [selectedYear]);

    // Load statement detail when customer/month changes
    useEffect(() => {
        // Compute current statement ID inside effect to avoid stale closure
        // Use statements directly (not the memoized map) since this runs once per filter change
        const customerStmts = selectedCustomerId
            ? statements.filter((s) => s.customerId === selectedCustomerId)
            : [];
        const currentStmt = customerStmts.find((s) => s.month === selectedMonth);

        if (selectedCustomerId && currentStmt) {
            loadStatementDetail(currentStmt.id);
        } else {
            setCurrentStatementDetail(null);
        }
    }, [selectedCustomerId, selectedMonth, statements]);

    async function loadStatementDetail(id: string) {
        try {
            setIsLoading(true);
            const result = await getMonthlyStatement({ id });
            if (result.success && result.data) {
                setCurrentStatementDetail(result.data);
            }
        } catch (error) {
            console.error("Failed to load statement detail:", error);
            setCurrentStatementDetail(null);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleConfirmStatement(id: string) {
        try {
            setIsConfirming(true);
            const result = await confirmMonthlyStatement({ id });
            if (result.success) {
                toast.success(result.data?.message || "Đã xác nhận bảng kê");
                // Reload statements after confirmation
                const statementsResult = await getMonthlyStatements({
                    year: selectedYear,
                    limit: 500,
                    offset: 0,
                });
                if (statementsResult.success && statementsResult.data) {
                    setStatements(statementsResult.data.items || []);
                }
                if (currentStatementDetail) {
                    await loadStatementDetail(currentStatementDetail.id);
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
            // Try auto-rollover from previous month first
            const rollover = await autoRolloverStatements({
                targetYear: selectedYear,
                targetMonth: selectedMonth,
                customerIds: [selectedCustomerId],
            });

            if (rollover.success && rollover.data && rollover.data.created > 0) {
                toast.success(rollover.data.message);
            } else {
                // Either rollover failed (permission/auth) or no previous data (created = 0)
                // Log rollover failure for debugging but proceed with fallback
                if (!rollover.success) {
                    console.warn("Rollover failed, falling back to create empty statement:", rollover.error);
                }
                // Fallback to creating empty statement
                const customer = customers.find(c => c.id === selectedCustomerId);
                const created = await createMonthlyStatement({
                    customerId: selectedCustomerId,
                    year: selectedYear,
                    month: selectedMonth,
                    plants: [],
                    contactName: customer?.contactName || "",
                    notes: "",
                });
                if (created.success) {
                    toast.success("Đã tạo bảng kê mới (trống)");
                } else {
                    toast.error(created.error || "Không thể tạo bảng kê");
                }
            }

            // Reload statements to update UI
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
            // Dynamic import to reduce initial bundle size
            const { generateMonthlyStatementCSV, getStatementFilename } = await import("@/lib/csv/export-monthly-statement");

            const csv = generateMonthlyStatementCSV(currentStatementDetail);
            const filename = getStatementFilename(
                currentStatementDetail.customer?.companyName || "company",
                currentStatementDetail.year,
                currentStatementDetail.month
            );

            // Create blob and download
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

    async function handleExportPDF() {
        if (!currentStatementDetail) {
            toast.error("Không có dữ liệu để xuất");
            return;
        }

        try {
            // Dynamic import to reduce initial bundle size
            const { generateMonthlyStatementPDF } = await import("@/lib/pdf/monthly-statement-pdf");
            const { getStatementFilename } = await import("@/lib/csv/export-monthly-statement");

            const doc = generateMonthlyStatementPDF(currentStatementDetail);
            const filename = getStatementFilename(
                currentStatementDetail.customer?.companyName || "company",
                currentStatementDetail.year,
                currentStatementDetail.month
            ).replace(".csv", ".pdf");

            doc.save(filename);
            toast.success("Đã tạo file PDF");
        } catch (error) {
            console.error("Failed to export PDF:", error);
            toast.error("Không thể xuất file PDF");
        }
    }

    // Filter customers by search (memoized)
    const filteredCustomers = useMemo(
        () =>
            customers.filter((c) =>
                c.companyName.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [customers, searchQuery]
    );

    // Pre-group statements by customerId for O(1) lookup (avoids O(n²) filter inside map)
    const statementsByCustomer = useMemo(() => {
        const grouped = new Map<string, StatementListItem[]>();
        statements.forEach((s) => {
            const existing = grouped.get(s.customerId) || [];
            existing.push(s);
            grouped.set(s.customerId, existing);
        });
        return grouped;
    }, [statements]);

    // Filter statements for selected customer (using pre-grouped map for O(1) lookup)
    const customerStatements = useMemo(
        () => (selectedCustomerId ? statementsByCustomer.get(selectedCustomerId) || [] : []),
        [selectedCustomerId, statementsByCustomer]
    );

    const currentStatement = useMemo(
        () => customerStatements.find((s) => s.month === selectedMonth),
        [customerStatements, selectedMonth]
    );

    // Memoized monthly statement filters for KPI cards (avoids repeated O(n) filters in render)
    const monthlyStatements = useMemo(
        () => statements.filter(s => s.month === selectedMonth),
        [statements, selectedMonth]
    );

    const pendingStatements = useMemo(
        () => monthlyStatements.filter(s => s.needsConfirmation),
        [monthlyStatements]
    );

    const confirmedStatements = useMemo(
        () => monthlyStatements.filter(s => !s.needsConfirmation),
        [monthlyStatements]
    );

    const monthlyTotal = useMemo(
        () => monthlyStatements.reduce((sum, s) => sum + s.total, 0),
        [monthlyStatements]
    );

    // Years selector - starts from business start year, expands as years pass
    const currentYear = new Date().getFullYear();
    const years = Array.from(
        { length: currentYear - BUSINESS_START_YEAR + 1 },
        (_, i) => BUSINESS_START_YEAR + i
    );

    // Months array
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Sidebar - Company List */}
            <div className="w-80 border-r bg-slate-50/30 flex flex-col h-full">
                <div className="p-5 border-b bg-white">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Đối soát Bảng kê</h1>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        Cây xanh văn phòng & Dịch vụ
                    </p>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Tìm công ty..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="h-9 pl-9 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 divide-y divide-border/50">
                    {filteredCustomers.map((customer) => {
                        const customerStmts = statementsByCustomer.get(customer.id) || [];
                        const hasUnconfirmed = customerStmts.some((s) => s.needsConfirmation);
                        const monthlyTotal = customerStmts.find(
                            (s) => s.month === selectedMonth
                        )?.total || 0;

                        const isSelected = selectedCustomerId === customer.id;

                        return (
                            <div
                                key={customer.id}
                                onClick={() => setSelectedCustomerId(customer.id)}
                                className={cn(
                                    "p-4 cursor-pointer transition-all data-table-row",
                                    isSelected ? "bg-white border-l-4 border-l-primary shadow-sm z-10" : ""
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded flex items-center justify-center font-bold text-sm shrink-0 border transition-colors",
                                        isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-white text-primary border-slate-200"
                                    )}>
                                        {customer.shortName?.substring(0, 2).toUpperCase() ||
                                            customer.companyName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className={cn(
                                                "text-sm font-bold truncate",
                                                isSelected ? "text-primary" : "text-slate-900"
                                            )}>
                                                {customer.companyName}
                                            </div>
                                            {hasUnconfirmed && (
                                                <div className="status-badge bg-amber-50 text-amber-700 border-amber-200 py-0 px-1.5 h-4 text-[9px] uppercase font-bold shrink-0">
                                                    Cần duyệt
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground mt-0.5">
                                            <span>{customer.district}</span>
                                            <span>•</span>
                                            <span>{customerStmts.length} bản ghi</span>
                                        </div>
                                        {monthlyTotal > 0 && (
                                            <div className="mt-1.5 text-xs font-bold text-slate-700">
                                                {formatCurrency(monthlyTotal)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50/20">
                {selectedCustomerId ? (
                    <div className="p-8 max-w-5xl mx-auto">
                        {/* Header with customer name */}
                        <div className="mb-8 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {customers.find((c) => c.id === selectedCustomerId)?.companyName}
                                </h2>
                                <div className="flex items-center gap-2 mt-1 text-sm font-medium text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>{customers.find((c) => c.id === selectedCustomerId)?.address}</span>
                                </div>
                            </div>
                            <div className="flex items-center border rounded-md p-1 bg-white shadow-sm">
                                <Button variant="ghost" size="sm" onClick={handleExportCSV} disabled={!currentStatementDetail} className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                    <Download className="h-3.5 w-3.5" />
                                    Excel
                                </Button>
                                <div className="w-px h-4 bg-border mx-1" />
                                <Button variant="ghost" size="sm" onClick={handleExportPDF} disabled={!currentStatementDetail} className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                    <Printer className="h-3.5 w-3.5" />
                                    In PDF
                                </Button>
                            </div>
                        </div>

                        {/* Year & Month Selector */}
                        <div className="flex flex-col gap-4 mb-8 enterprise-card p-4 bg-white">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Thời gian đối soát</p>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="h-8 px-3 text-sm font-bold border rounded bg-slate-50 border-slate-200 outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                                >
                                    {years.map((year) => (
                                        <option key={year} value={year}>
                                            Năm {year}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-1.5 flex-wrap">
                                {months.map((month) => {
                                    const stmt = customerStatements.find((s) => s.month === month);
                                    const isSelected = selectedMonth === month;
                                    const needsConfirm = stmt?.needsConfirmation;

                                    return (
                                        <button
                                            key={month}
                                            onClick={() => setSelectedMonth(month)}
                                            className={cn(
                                                "relative h-10 min-w-[56px] flex flex-col items-center justify-center rounded border text-[11px] font-bold transition-all",
                                                isSelected
                                                    ? "bg-primary text-white border-primary shadow-sm"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:bg-slate-50",
                                                needsConfirm && !isSelected ? "border-amber-300 bg-amber-50/30" : ""
                                            )}
                                        >
                                            {getMonthShort(month)}
                                            {needsConfirm && (
                                                <span className={cn(
                                                    "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white",
                                                    isSelected ? "bg-white" : "bg-amber-500"
                                                )} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Statement Card */}
                        {currentStatement ? (
                            <div
                                className={cn(
                                    "enterprise-card bg-white overflow-hidden",
                                    currentStatement.needsConfirmation ? "border-amber-300 shadow-amber-50/50" : ""
                                )}
                            >
                                <div className={cn(
                                    "p-6 border-b flex items-start justify-between min-h-[100px]",
                                    currentStatement.needsConfirmation ? "bg-amber-50/20" : "bg-slate-50/30"
                                )}>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <Calendar className={cn("h-5 w-5", currentStatement.needsConfirmation ? "text-amber-500" : "text-primary")} />
                                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                                Tháng {selectedMonth} / {selectedYear}
                                            </h3>
                                            {currentStatement.needsConfirmation && (
                                                <div className="status-badge bg-amber-50 text-amber-700 border-amber-200 uppercase font-bold text-[10px]">
                                                    Chờ xác nhận
                                                </div>
                                            )}
                                            {!currentStatement.needsConfirmation && (
                                                <div className="status-badge bg-emerald-50 text-emerald-700 border-emerald-200 uppercase font-bold text-[10px]">
                                                    Đã chốt
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground mt-1 ml-8">
                                            {currentStatement.plantCount} loại cây xanh đang thuê
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tổng cộng (Đã có VAT)</p>
                                        <div className="text-3xl font-black text-primary">
                                            {formatCurrency(currentStatement.total)}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {currentStatement.needsConfirmation && (
                                        <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-bold text-amber-900">Thông tin mới cập nhật</p>
                                                    <p className="text-xs font-medium text-amber-700 mt-0.5">
                                                        Hệ thống đã tự động sao chép dữ liệu từ tháng trước. Vui lòng đối soát số lượng & đơn giá thực tế.
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 px-5 shrink-0 shadow-sm"
                                                onClick={() => handleConfirmStatement(currentStatement.id)}
                                                disabled={isConfirming}
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                {isConfirming ? "Đang xử lý..." : "Chốt Bảng Kê"}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Plant Table */}
                                    {isLoading ? (
                                        <div className="py-20 flex flex-col items-center justify-center">
                                            <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                            <p className="text-sm font-bold text-slate-400 mt-4 uppercase tracking-widest">Đang trích xuất dữ liệu...</p>
                                        </div>
                                    ) : currentStatementDetail ? (
                                        <div>
                                            <div className="overflow-x-auto border rounded-lg whitespace-nowrap">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-200">
                                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tên danh mục cây</th>
                                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quy cách/Size</th>
                                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Đơn giá</th>
                                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-24">SL</th>
                                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Thành tiền</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {currentStatementDetail.plants.map((plant, idx) => (
                                                            <tr key={plant.id} className="hover:bg-slate-50 transition-colors">
                                                                <td className="px-4 py-3 text-xs font-bold text-slate-400 text-center">{idx + 1}</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-slate-800">{plant.name}</td>
                                                                <td className="px-4 py-3 text-xs font-medium text-slate-500 tracking-tight">{plant.sizeSpec}</td>
                                                                <td className="px-4 py-3 text-xs font-bold text-slate-700 text-right">{formatCurrency(plant.unitPrice)}</td>
                                                                <td className="px-4 py-3 text-sm font-black text-slate-900 text-center">{plant.quantity}</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-primary text-right">{formatCurrency(plant.total)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Financial Summary */}
                                            <div className="mt-8 flex justify-end">
                                                <div className="w-80 space-y-3 bg-slate-50/50 p-6 rounded-lg border border-slate-100">
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                                        <span>Tạm tính:</span>
                                                        <span className="text-slate-900">{formatCurrency(currentStatementDetail.subtotal)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                                        <span>Thuế VAT ({currentStatementDetail.vatRate}%):</span>
                                                        <span className="text-slate-900">{formatCurrency(currentStatementDetail.vatAmount)}</span>
                                                    </div>
                                                    <div className="h-px bg-slate-200 my-2" />
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="text-xs font-black text-slate-900 uppercase">Thành tiền:</span>
                                                        <span className="text-2xl font-black text-primary">{formatCurrency(currentStatementDetail.total)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Period Display */}
                                            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                <Calendar className="h-3 w-3" />
                                                <span>Kỳ đối soát: {new Date(currentStatementDetail.periodStart).toLocaleDateString('vi-VN')} → {new Date(currentStatementDetail.periodEnd).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
                                            <Calendar className="h-10 w-10 mx-auto mb-4 text-slate-300" />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Dữ liệu trống</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed border-slate-200">
                                <Calendar className="h-16 w-16 text-slate-200 mb-6" />
                                <h3 className="text-lg font-bold text-slate-900">Chưa có Bảng Kê</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1 max-w-xs text-center">
                                    Bảng kê cho tháng {selectedMonth}/{selectedYear} chưa được tạo hoặc khách hàng chưa bắt đầu dịch vụ trong kỳ này.
                                </p>
                                <Button
                                    className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-8"
                                    variant="default"
                                    onClick={handleCreateStatement}
                                    disabled={isCreating}
                                >
                                    {isCreating ? "Đang tạo..." : "Khởi tạo dữ liệu tháng mới"}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 max-w-5xl mx-auto">
                        {/* Stats Overview Header with Period Selector */}
                        <div className="mb-8">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                        Tổng quan Bảng kê
                                    </h2>
                                    <p className="text-sm font-medium text-muted-foreground mt-1">
                                        Chọn khách hàng từ danh sách bên trái để xem chi tiết
                                    </p>
                                </div>
                                {/* Year Selector */}
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                    {years.map((year) => (
                                        <button
                                            key={year}
                                            onClick={() => setSelectedYear(year)}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                                selectedYear === year
                                                    ? "bg-white shadow-sm text-slate-900"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Month Selector Grid */}
                            <div className="mt-4 flex items-center gap-1 flex-wrap">
                                {months.map((month) => (
                                    <button
                                        key={month}
                                        onClick={() => setSelectedMonth(month)}
                                        className={cn(
                                            "px-3 h-8 text-xs font-bold rounded-md transition-all border whitespace-nowrap",
                                            selectedMonth === month
                                                ? "bg-primary text-white border-primary shadow-sm"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary"
                                        )}
                                    >
                                        Tháng {month}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid gap-4 md:grid-cols-4 mb-8">
                            {/* Total Statements */}
                            <div className="enterprise-card p-5 bg-white border-l-4 border-l-slate-400">
                                <p className="kpi-title text-slate-500 mb-1">Tổng bảng kê</p>
                                <p className="text-3xl font-black text-slate-900">{monthlyStatements.length}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Kỳ hiện tại</p>
                            </div>

                            {/* Needs Confirmation */}
                            <div className="enterprise-card p-5 bg-white border-l-4 border-l-amber-500">
                                <p className="kpi-title text-slate-500 mb-1">Chờ duyệt</p>
                                <p className="text-3xl font-black text-amber-600">{pendingStatements.length}</p>
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tight mt-1">Cần xử lý</p>
                            </div>

                            {/* Confirmed */}
                            <div className="enterprise-card p-5 bg-white border-l-4 border-l-emerald-500">
                                <p className="kpi-title text-slate-500 mb-1">Đã xác nhận</p>
                                <p className="text-3xl font-black text-emerald-600">{confirmedStatements.length}</p>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight mt-1">Sẵn sàng xuất đơn</p>
                            </div>

                            {/* Total Revenue */}
                            <div className="enterprise-card p-5 bg-white border-l-4 border-l-primary">
                                <p className="kpi-title text-slate-500 mb-1">Tổng giá trị</p>
                                <p className="text-2xl font-black text-primary">{formatCurrency(monthlyTotal)}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Doanh thu kỳ</p>
                            </div>
                        </div>

                        {/* Pending Confirmation List */}
                        {pendingStatements.length > 0 && (
                            <div className="enterprise-card bg-white">
                                <div className="p-4 border-b bg-amber-50/50">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-amber-700 uppercase tracking-wider">
                                        <AlertCircle className="h-4 w-4" />
                                        Cần duyệt ({pendingStatements.length})
                                    </h3>
                                </div>
                                <div className="divide-y divide-border/50">
                                    {pendingStatements
                                        .slice(0, 5)
                                        .map((stmt) => {
                                            const customer = customers.find(c => c.id === stmt.customerId);
                                            return (
                                                <div
                                                    key={stmt.id}
                                                    className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                                                    onClick={() => setSelectedCustomerId(stmt.customerId)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-xs">
                                                            {customer?.shortName?.substring(0, 2).toUpperCase() || customer?.companyName?.substring(0, 2).toUpperCase() || "??"}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{stmt.companyName}</p>
                                                            <p className="text-xs font-medium text-muted-foreground">{stmt.district} • {stmt.plantCount} loại cây</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-slate-900">{formatCurrency(stmt.total)}</p>
                                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Chờ duyệt</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                                {pendingStatements.length > 5 && (
                                    <div className="p-3 bg-slate-50 border-t text-center">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            +{pendingStatements.length - 5} bảng kê khác cần duyệt
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* All Clear State */}
                        {pendingStatements.length === 0 && monthlyStatements.length > 0 && (
                            <div className="enterprise-card p-8 text-center bg-emerald-50/30 border-emerald-200">
                                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                                <h3 className="text-lg font-bold text-emerald-700">Tất cả bảng kê đã được duyệt</h3>
                                <p className="text-sm font-medium text-emerald-600 mt-1">Sẵn sàng xuất hóa đơn VAT cho kỳ này</p>
                            </div>
                        )}

                        {/* Empty State - No statements at all */}
                        {monthlyStatements.length === 0 && (
                            <div className="enterprise-card p-12 text-center bg-slate-50/50 border-dashed">
                                <Calendar className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-600">Chưa có dữ liệu</h3>
                                <p className="text-sm font-medium text-slate-400 mt-1 max-w-sm mx-auto">
                                    Bảng kê cho tháng {selectedMonth}/{selectedYear} chưa được tạo. Hãy chạy rollover từ tháng trước hoặc tạo mới.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}