"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import {
  FiArrowRight,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiChevronDown,
  FiChevronLeft,
  FiFolder,
  FiFolderPlus,
  FiFileText,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiLayers,
  FiGitBranch,
  FiFilter,
} from "react-icons/fi";

import { toast } from "sonner";

// ==========================================
// API
// ==========================================

import {
  getAccounts,
  type Account,
  type AccountType,
} from "@/lib/api/accounts";

import { getUserByUsername } from "@/lib/api/users";

// ==========================================
// Types
// ==========================================

interface TreeNode extends Account {
  treeKey: string;
  children: TreeNode[];
}

// ==========================================
// Helpers
// ==========================================

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

function getCurrentUsername(): string | null {
  const cookieUsername = getCookie("username");

  if (cookieUsername) {
    return cookieUsername;
  }

  if (typeof window !== "undefined") {
    try {
      const authUser = localStorage.getItem("authUser");

      if (authUser) {
        const user = JSON.parse(authUser);
        return user.username || null;
      }
    } catch (error) {
      console.error("Read authUser error:", error);
    }
  }

  return null;
}

function isAccountActive(account: Account): boolean {
  return account.isActive !== false && account.status !== "inactive";
}

function getAccountParentId(account: Account): string {
  return String(account.parentId ?? "").trim();
}

function getAccountType(account: Account): AccountType {
  return account.type;
}

// ==========================================
// Account Types
// ==========================================

const accountTypes: {
  value: AccountType;
  label: string;
}[] = [
  { value: "asset", label: "الأصول" },
  { value: "liability", label: "الالتزامات" },
  { value: "equity", label: "حقوق الملكية" },
  { value: "revenue", label: "الإيرادات" },
  { value: "expense", label: "المصروفات" },
];

function getAccountTypeName(type: AccountType) {
  return accountTypes.find((item) => item.value === type)?.label || "غير محدد";
}

// ==========================================
// Build Tree
// ==========================================

function buildAccountTree(accounts: Account[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // إنشاء جميع العقد أولاً
  accounts.forEach((account, index) => {
    const treeKey = account.id ? String(account.id) : `account-${index}`;

    map.set(treeKey, {
      ...account,
      treeKey,
      children: [],
    });
  });

  // ربط الحسابات بالأبناء
  accounts.forEach((account, index) => {
    const treeKey = account.id ? String(account.id) : `account-${index}`;

    const node = map.get(treeKey);

    if (!node) return;

    const parentId = getAccountParentId(account);

    // حساب رئيسي
    if (!parentId) {
      roots.push(node);
      return;
    }

    const parent = map.get(parentId);

    // إذا كان الأب موجوداً
    if (parent && parent !== node) {
      parent.children.push(node);
    } else {
      // حساب يتيم
      roots.push(node);
    }
  });

  // ترتيب الحسابات
  const sortNodes = (nodes: TreeNode[], visited = new Set<string>()) => {
    nodes.sort((a, b) =>
      String(a.code).localeCompare(String(b.code), undefined, {
        numeric: true,
      }),
    );

    nodes.forEach((node) => {
      if (visited.has(node.treeKey)) return;

      visited.add(node.treeKey);
      sortNodes(node.children, visited);
    });
  };

  sortNodes(roots);

  // معالجة الحسابات التي لم تصل إليها الشجرة
  const visited = new Set<string>();

  const markVisited = (nodes: TreeNode[]) => {
    nodes.forEach((node) => {
      if (visited.has(node.treeKey)) return;

      visited.add(node.treeKey);
      markVisited(node.children);
    });
  };

  markVisited(roots);

  map.forEach((node) => {
    if (!visited.has(node.treeKey)) {
      roots.push(node);
      markVisited([node]);
    }
  });

  sortNodes(roots);

  return roots;
}

// ==========================================
// Filter Tree
// ==========================================

function filterTree(
  nodes: TreeNode[],
  search: string,
  typeFilter: string,
): TreeNode[] {
  return nodes.reduce<TreeNode[]>((result, node) => {
    const filteredChildren = filterTree(node.children, search, typeFilter);

    const searchText = search.toLowerCase();

    const matchesSearch =
      !search ||
      String(node.name ?? "")
        .toLowerCase()
        .includes(searchText) ||
      String(node.code ?? "")
        .toLowerCase()
        .includes(searchText);

    const matchesType = typeFilter === "all" || node.type === typeFilter;

    if ((matchesSearch && matchesType) || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren,
      });
    }

    return result;
  }, []);
}

// ==========================================
// Main Component
// ==========================================

export default function AccountsTreePage() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [companyId, setCompanyId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // ========================================
  // Load Data
  // ========================================

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const username = getCurrentUsername();

      if (!username) {
        throw new Error("لم يتم العثور على المستخدم الحالي");
      }

      const user = await getUserByUsername(username);

      if (!user) {
        throw new Error("المستخدم غير موجود");
      }

      if (user.type === "platform") {
        throw new Error("لا يمكن لمستخدم المنصة عرض دليل حسابات الشركة");
      }

      if (!user.companyId) {
        throw new Error("المستخدم غير مرتبط بشركة");
      }

      if (user.isActive === false || user.status === "inactive") {
        throw new Error("حساب المستخدم غير نشط");
      }

      const currentCompanyId = String(user.companyId);

      setCompanyId(currentCompanyId);

      // جلب حسابات الشركة من Supabase
      // يجب أن تقوم getAccounts بفلترة companyId داخل الاستعلام
      const companyAccounts = await getAccounts(currentCompanyId);

      // تحقق إضافي من ملكية الحسابات
      const filteredAccounts = companyAccounts.filter(
        (account) => String(account.companyId) === currentCompanyId,
      );

      setAccounts(filteredAccounts);

      // فتح الحسابات الرئيسية تلقائياً
      const rootIds = filteredAccounts
        .filter((account) => !getAccountParentId(account))
        .map((account) => String(account.id))
        .filter(Boolean);

      setExpanded(new Set(rootIds));
    } catch (err) {
      console.error("Load accounts error:", err);

      const message =
        err instanceof Error ? err.message : "تعذر تحميل شجرة الحسابات";

      setError(message);
      setAccounts([]);
      setCompanyId("");
      setExpanded(new Set());

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================
  // Initial Load
  // ========================================

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;
      await loadAccounts();
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [loadAccounts]);

  // ========================================
  // Statistics
  // ========================================

  const statistics = useMemo(() => {
    return {
      total: accounts.length,

      groups: accounts.filter((account) => account.isGroup === true).length,

      posting: accounts.filter((account) => account.isGroup === false).length,

      active: accounts.filter((account) => isAccountActive(account)).length,

      inactive: accounts.filter((account) => !isAccountActive(account)).length,
    };
  }, [accounts]);

  // ========================================
  // Tree
  // ========================================

  const tree = useMemo(() => buildAccountTree(accounts), [accounts]);

  const filteredTree = useMemo(() => {
    let result = filterTree(tree, search.trim(), typeFilter);

    if (statusFilter !== "all") {
      const filterStatus = (nodes: TreeNode[]): TreeNode[] =>
        nodes.reduce<TreeNode[]>((acc, node) => {
          const children = filterStatus(node.children);

          const active = isAccountActive(node);

          const matchesStatus = statusFilter === "active" ? active : !active;

          if (matchesStatus || children.length > 0) {
            acc.push({
              ...node,
              children,
            });
          }

          return acc;
        }, []);

      result = filterStatus(result);
    }

    return result;
  }, [tree, search, typeFilter, statusFilter]);

  // ========================================
  // Expand / Collapse
  // ========================================

  function toggleExpand(id: string) {
    setExpanded((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function expandAll() {
    const ids = accounts
      .filter((account) => account.isGroup === true)
      .map((account) => String(account.id))
      .filter(Boolean);

    setExpanded(new Set(ids));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  // ========================================
  // Render Tree Node
  // ========================================

  function renderNode(
    node: TreeNode,
    depth = 0,
    path = new Set<string>(),
  ): ReactNode {
    if (path.has(node.treeKey)) {
      return null;
    }

    const currentPath = new Set(path);
    currentPath.add(node.treeKey);

    const hasChildren = node.children.length > 0;

    const isExpanded =
      search.trim().length > 0 ? true : expanded.has(node.treeKey);

    const isGroup = node.isGroup === true;

    const isActive = isAccountActive(node);

    const accountType = getAccountType(node);

    return (
      <div key={node.treeKey}>
        <div
          className={`group flex min-w-[700px] items-center border-b border-gray-100 transition hover:bg-blue-50/50 ${
            !isActive ? "opacity-60" : ""
          }`}
          style={{
            paddingRight: `${depth * 28 + 12}px`,
          }}
        >
          {/* Expand */}
          <div className="flex w-10 shrink-0 justify-center">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.treeKey)}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200"
                title={isExpanded ? "طي الحسابات" : "توسيع الحسابات"}
              >
                {isExpanded ? (
                  <FiChevronDown size={17} />
                ) : (
                  <FiChevronLeft size={17} />
                )}
              </button>
            ) : (
              <span className="w-7" />
            )}
          </div>

          {/* Account Code */}
          <div className="w-32 shrink-0 px-3 py-4">
            <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs font-bold text-gray-700">
              {node.code}
            </span>
          </div>

          {/* Account Name */}
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-4">
            {isGroup ? (
              <FiFolder size={18} className="shrink-0 text-amber-500" />
            ) : (
              <FiFileText size={17} className="shrink-0 text-blue-500" />
            )}

            <span
              className={`truncate text-sm ${
                isGroup
                  ? "font-bold text-gray-800"
                  : "font-medium text-gray-600"
              }`}
            >
              {node.name}
            </span>

            {!isActive && (
              <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] text-red-600">
                غير نشط
              </span>
            )}
          </div>

          {/* Type */}
          <div className="w-32 shrink-0 px-3 py-4">
            <span className="text-xs text-gray-600">
              {getAccountTypeName(accountType)}
            </span>
          </div>

          {/* Account Nature */}
          <div className="w-24 shrink-0 px-3 py-4">
            <span className="text-xs text-gray-600">
              {node.nature === "debit" ? "مدين" : "دائن"}
            </span>
          </div>

          {/* Account Status */}
          <div className="w-32 shrink-0 px-3 py-4">
            {isGroup ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                <FiFolderPlus size={13} />
                حساب تجميعي
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                <FiCheckCircle size={13} />
                قابل للترحيل
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex w-24 shrink-0 items-center justify-center gap-1 px-2">
            <button
              type="button"
              onClick={() =>
                router.push(`/erp/accounting/accounts/${node.id}/statement`)
              }
              disabled={!node.id}
              title="كشف حساب"
              className="rounded-lg p-2 text-gray-500 opacity-0 transition hover:bg-blue-100 hover:text-blue-700 group-hover:opacity-100 disabled:cursor-not-allowed"
            >
              <FiEye size={15} />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) =>
              renderNode(child, depth + 1, currentPath),
            )}
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // Loading
  // ========================================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <FiRefreshCw size={20} className="animate-spin" />
          جاري تحميل شجرة الحسابات...
        </div>
      </div>
    );
  }

  // ========================================
  // Error
  // ========================================

  if (error) {
    return (
      <div
        dir="rtl"
        className="m-6 rounded-xl border border-red-200 bg-red-50 p-6"
      >
        <h2 className="font-bold text-red-700">تعذر تحميل شجرة الحسابات</h2>

        <p className="mt-2 text-sm text-red-600">{error}</p>

        <button
          onClick={loadAccounts}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // ========================================
  // Main UI
  // ========================================

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>المحاسبة</span>
            <span>/</span>
            <span>دليل الحسابات</span>
            <span>/</span>
            <span className="text-blue-600">شجرة الحسابات</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-gray-800">
            شجرة الحسابات
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            عرض الهيكل الهرمي للحسابات وتصنيفها المحاسبي
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push("/erp/accounting/accounts")}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FiArrowRight size={16} />
            دليل الحسابات
          </button>

          <button
            onClick={() => router.push("/erp/accounting/accounts/create")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FiPlus size={17} />
            إضافة حساب
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          title="إجمالي الحسابات"
          value={statistics.total}
          icon={<FiLayers />}
          color="blue"
        />

        <StatCard
          title="الحسابات التجميعية"
          value={statistics.groups}
          icon={<FiFolder />}
          color="amber"
        />

        <StatCard
          title="الحسابات القابلة للترحيل"
          value={statistics.posting}
          icon={<FiFileText />}
          color="indigo"
        />

        <StatCard
          title="الحسابات النشطة"
          value={statistics.active}
          icon={<FiCheckCircle />}
          color="green"
        />

        <StatCard
          title="الحسابات غير النشطة"
          value={statistics.inactive}
          icon={<FiXCircle />}
          color="red"
        />
      </div>

      {/* Filters */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <h2 className="font-bold text-gray-800">البحث والتصفية</h2>
          </div>

          <button
            onClick={loadAccounts}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
          >
            <FiRefreshCw size={14} />
            تحديث البيانات
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <FiSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={17}
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الحساب أو اسمه..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pr-10 pl-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">جميع أنواع الحسابات</option>

            {accountTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">جميع الحالات</option>

            <option value="active">الحسابات النشطة</option>

            <option value="inactive">الحسابات غير النشطة</option>
          </select>
        </div>
      </section>

      {/* Tree */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Tree Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <div className="flex items-center gap-2">
              <FiGitBranch size={19} className="text-blue-600" />

              <h2 className="font-bold text-gray-800">الهيكل المحاسبي</h2>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              {filteredTree.length} مجموعة رئيسية ظاهرة
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
            >
              توسيع الكل
            </button>

            <button
              onClick={collapseAll}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
            >
              طي الكل
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            {/* Columns */}
            <div className="flex items-center bg-gray-50 text-xs font-bold text-gray-600">
              <div className="w-10" />
              <div className="w-32 px-3 py-4">رقم الحساب</div>
              <div className="flex-1 px-3 py-4">اسم الحساب</div>
              <div className="w-32 px-3 py-4">التصنيف</div>
              <div className="w-24 px-3 py-4">الطبيعة</div>
              <div className="w-32 px-3 py-4">نوع الحساب</div>
              <div className="w-24 px-3 py-4 text-center">الإجراءات</div>
            </div>

            {/* Rows */}
            {filteredTree.length > 0 ? (
              <div>{filteredTree.map((node) => renderNode(node))}</div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FiFolder size={42} className="text-gray-300" />

                <h3 className="mt-4 font-bold text-gray-700">لا توجد حسابات</h3>

                <p className="mt-2 text-sm text-gray-500">
                  لم يتم العثور على حسابات تطابق البحث أو التصفية.
                </p>

                {accounts.length === 0 && (
                  <button
                    onClick={() =>
                      router.push("/erp/accounting/accounts/create")
                    }
                    className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    <FiPlus />
                    إضافة أول حساب
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-5 border-t border-gray-100 bg-gray-50 px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FiFolder className="text-amber-500" />
            حساب تجميعي
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FiFileText className="text-blue-500" />
            حساب قابل للترحيل
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FiCheckCircle className="text-green-600" />
            نشط
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FiXCircle className="text-red-500" />
            غير نشط
          </div>
        </div>
      </section>
    </div>
  );
}

// ==========================================
// Statistics Card
// ==========================================

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
