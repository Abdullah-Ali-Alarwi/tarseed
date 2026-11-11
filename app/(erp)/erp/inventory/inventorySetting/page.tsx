"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

import {
  FiHome,
  FiLayers,
  FiBox,
  FiPackage,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiX,
  FiRefreshCw,
  FiSearch,
  FiAlertCircle,
} from "react-icons/fi";

import { toast } from "sonner";

// ========================================
// API
// ========================================

const API_URL = "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ========================================
// Types
// ========================================

type Status = "active" | "inactive";

type Section = "warehouses" | "categories" | "units" | "products";

interface BaseItem {
  id: string;
  companyId: string;
  status: Status;
}

interface Warehouse extends BaseItem {
  name: string;
  code: string;
  location: string;
  description: string;
  isDefault: boolean;
}

interface Category extends BaseItem {
  name: string;
  code: string;
  description: string;
}

interface Unit extends BaseItem {
  name: string;
  symbol: string;
  isDefault: boolean;
}

interface Product extends BaseItem {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  categoryName: string;
  unitId: string;
  unitName: string;
  trackInventory: boolean;
}

type FormData = Record<string, string | boolean>;

// ========================================
// Default Units
// ========================================

const DEFAULT_UNITS = [
  {
    name: "جرام",
    symbol: "g",
  },
  {
    name: "كيلوجرام",
    symbol: "kg",
  },
  {
    name: "لتر",
    symbol: "L",
  },
  {
    name: "حبة",
    symbol: "pcs",
  },
  {
    name: "كرتونة",
    symbol: "ctn",
  },
];

// ========================================
// Main Component
// ========================================

export default function InventorySettingPage() {
  const [companyId, setCompanyId] = useState("");

  const [activeSection, setActiveSection] = useState<Section>("warehouses");

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({});

  // ======================================
  // Default Forms
  // ======================================

  const emptyWarehouse = {
    name: "",
    code: "",
    location: "",
    description: "",
    isDefault: false,
    status: "active",
  };

  const emptyCategory = {
    name: "",
    code: "",
    description: "",
    status: "active",
  };

  const emptyUnit = {
    name: "",
    symbol: "",
    status: "active",
  };

  const emptyProduct = {
    name: "",
    categoryId: "",
    unitId: "",
    trackInventory: true,
    status: "active",
  };

  // ======================================
  // Load Current User
  // ======================================

  useEffect(() => {
    initialize();
  }, []);
  const initialize = async () => {
    try {
      // قراءة نوع الحساب من Cookies
      const cookies = document.cookie.split("; ");

      const getCookie = (name: string) => {
        const cookie = cookies.find((item) => item.startsWith(`${name}=`));

        return cookie
          ? decodeURIComponent(cookie.substring(name.length + 1))
          : "";
      };

      const userType = getCookie("type");

      // منع حساب منصة Wezzan
      if (userType === "platform") {
        toast.error("هذا القسم مخصص لمستخدمي الشركات");
        return;
      }

      // قراءة companyId من Cookies
      const currentCompanyId = getCookie("companyId");

      if (!currentCompanyId) {
        console.error("Cookies:", document.cookie);
        toast.error("لم يتم العثور على الشركة المرتبطة بالمستخدم");
        return;
      }

      setCompanyId(currentCompanyId);

      await loadData(currentCompanyId);
    } catch (error) {
      console.error("Initialize Error:", error);
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };
  // ======================================
  // Seed Default Units Per Company
  // ======================================

  const seedDefaultUnits = async (
    currentCompanyId: string,
    existingUnits: Unit[],
  ) => {
    const missingUnits = DEFAULT_UNITS.filter(
      (defaultUnit) =>
        !existingUnits.some(
          (unit) =>
            unit.companyId === currentCompanyId &&
            unit.symbol.toLowerCase() === defaultUnit.symbol.toLowerCase(),
        ),
    );

    if (missingUnits.length === 0) return;

    await Promise.all(
      missingUnits.map((unit) =>
        api.post("/units", {
          companyId: currentCompanyId,
          name: unit.name,
          symbol: unit.symbol,
          status: "active",
          isDefault: true,
        }),
      ),
    );
  };

  // ======================================
  // Load Data
  // ======================================

  const loadData = async (currentCompanyId: string) => {
    try {
      const [warehouseRes, categoryRes, unitRes, productRes] =
        await Promise.all([
          api.get("/warehouses", {
            params: { companyId: currentCompanyId },
          }),

          api.get("/categories", {
            params: { companyId: currentCompanyId },
          }),

          api.get("/units", {
            params: { companyId: currentCompanyId },
          }),

          api.get("/products", {
            params: { companyId: currentCompanyId },
          }),
        ]);

      let companyUnits: Unit[] = unitRes.data;

      await seedDefaultUnits(currentCompanyId, companyUnits);

      // Reload units after inserting defaults

      const updatedUnits = await api.get("/units", {
        params: { companyId: currentCompanyId },
      });

      companyUnits = updatedUnits.data;

      setWarehouses(warehouseRes.data);
      setCategories(categoryRes.data);
      setUnits(companyUnits);
      setProducts(productRes.data);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل بيانات المخزون");
    }
  };

  // ======================================
  // Sections
  // ======================================

  const sections = [
    {
      id: "warehouses" as Section,
      title: "المستودعات",
      description: "إدارة مستودعات الشركة",
      icon: FiHome,
    },
    {
      id: "categories" as Section,
      title: "مجموعات الأصناف",
      description: "تصنيف الأصناف",
      icon: FiLayers,
    },
    {
      id: "units" as Section,
      title: "وحدات القياس",
      description: "إدارة وحدات القياس",
      icon: FiBox,
    },
    {
      id: "products" as Section,
      title: "الأصناف",
      description: "إدارة أصناف الشركة",
      icon: FiPackage,
    },
  ];

  // ======================================
  // Current Data
  // ======================================

  const getCurrentData = () => {
    switch (activeSection) {
      case "warehouses":
        return warehouses;

      case "categories":
        return categories;

      case "units":
        return units;

      case "products":
        return products;

      default:
        return [];
    }
  };

  // ======================================
  // Current Endpoint
  // ======================================

  const getEndpoint = () => `/${activeSection}`;

  // ======================================
  // Open Add Form
  // ======================================

  const handleAdd = () => {
    setEditingId(null);

    switch (activeSection) {
      case "warehouses":
        setForm(emptyWarehouse);
        break;

      case "categories":
        setForm(emptyCategory);
        break;

      case "units":
        setForm(emptyUnit);
        break;

      case "products":
        setForm(emptyProduct);
        break;
    }

    setShowForm(true);
  };

  // ======================================
  // Open Edit Form
  // ======================================

  const handleEdit = (item: BaseItem) => {
    setEditingId(String(item.id));

    if (activeSection === "products") {
      setForm({
        name: (item as Product).name,
        categoryId: (item as Product).categoryId,
        unitId: (item as Product).unitId,
        trackInventory: (item as Product).trackInventory,
        status: item.status,
      });
    } else {
      setForm({ ...item });
    }

    setShowForm(true);
  };

  // ======================================
  // Handle Form Changes
  // ======================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;

    const finalValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  // ======================================
  // Generate Product Number
  // ======================================

  const generateProductNumber = () => {
    const maxNumber = products.reduce((max, product) => {
      const match = product.sku?.match(/^PRD-(\d+)$/);

      if (!match) return max;

      return Math.max(max, Number(match[1]));
    }, 0);

    const nextNumber = maxNumber + 1;

    return {
      sku: `PRD-${String(nextNumber).padStart(4, "0")}`,
      barcode: `2${String(nextNumber).padStart(12, "0")}`,
    };
  };

  // ======================================
  // Save Form
  // ======================================

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!companyId) {
      toast.error("الشركة غير محددة");
      return;
    }

    if (!String(form.name || "").trim()) {
      toast.error("يرجى إدخال الاسم");
      return;
    }

    if (activeSection === "products" && (!form.categoryId || !form.unitId)) {
      toast.error("حدد المجموعة ووحدة القياس");
      return;
    }

    if (activeSection === "products") {
      const categoryExists = categories.some(
        (item) =>
          String(item.id) === String(form.categoryId) &&
          item.companyId === companyId &&
          item.status === "active",
      );

      const unitExists = units.some(
        (item) =>
          String(item.id) === String(form.unitId) &&
          item.companyId === companyId &&
          item.status === "active",
      );

      if (!categoryExists || !unitExists) {
        toast.error("المجموعة أو وحدة القياس غير متاحة");
        return;
      }
    }

    try {
      setSaving(true);

      let payload: Record<string, unknown> = {
        ...form,
        companyId,
      };

      // ----------------------------------
      // Product
      // ----------------------------------

      if (activeSection === "products") {
        const category = categories.find(
          (item) => String(item.id) === String(form.categoryId),
        );

        const unit = units.find(
          (item) => String(item.id) === String(form.unitId),
        );

        if (!category || !unit) {
          toast.error("تعذر العثور على المجموعة أو الوحدة");
          return;
        }

        payload = {
          companyId,
          name: String(form.name).trim(),

          categoryId: String(category.id),
          categoryName: category.name,

          unitId: String(unit.id),
          unitName: unit.name,

          trackInventory: Boolean(form.trackInventory),
          status: String(form.status || "active"),
        };

        // Generate SKU and barcode only on creation

        if (editingId === null) {
          const generated = generateProductNumber();

          payload.sku = generated.sku;
          payload.barcode = generated.barcode;
          payload.createdAt = new Date().toISOString();
        }
      }

      // ----------------------------------
      // Warehouse
      // ----------------------------------

      if (activeSection === "warehouses") {
        payload = {
          ...payload,
          name: String(form.name).trim(),
          code: String(form.code || "").trim(),
          location: String(form.location || ""),
          description: String(form.description || ""),
          isDefault: Boolean(form.isDefault),
          status: String(form.status || "active"),
        };

        if (!String(form.code || "").trim()) {
          toast.error("أدخل رمز المستودع");
          return;
        }

        if (Boolean(form.isDefault)) {
          const otherDefaults = warehouses.filter(
            (warehouse) =>
              warehouse.isDefault && String(warehouse.id) !== editingId,
          );

          await Promise.all(
            otherDefaults.map((warehouse) =>
              api.patch(`/warehouses/${warehouse.id}`, {
                isDefault: false,
              }),
            ),
          );
        }

        if (editingId === null) {
          payload.createdAt = new Date().toISOString();
        }
      }

      // ----------------------------------
      // Category
      // ----------------------------------

      if (activeSection === "categories") {
        if (!String(form.code || "").trim()) {
          toast.error("أدخل رمز المجموعة");
          return;
        }

        payload = {
          ...payload,
          name: String(form.name).trim(),
          code: String(form.code).trim(),
          description: String(form.description || ""),
          status: String(form.status || "active"),
        };
      }

      // ----------------------------------
      // Unit
      // ----------------------------------

      if (activeSection === "units") {
        if (!String(form.symbol || "").trim()) {
          toast.error("أدخل رمز الوحدة");
          return;
        }

        payload = {
          ...payload,
          name: String(form.name).trim(),
          symbol: String(form.symbol).trim(),
          status: String(form.status || "active"),
          isDefault: false,
        };
      }

      // ----------------------------------
      // Create / Update
      // ----------------------------------

      if (editingId !== null) {
        await api.patch(`${getEndpoint()}/${editingId}`, payload);

        toast.success("تم تحديث البيانات بنجاح");
      } else {
        await api.post(getEndpoint(), payload);

        toast.success("تمت الإضافة بنجاح");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({});

      await loadData(companyId);
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء حفظ البيانات");
    } finally {
      setSaving(false);
    }
  };

  // ======================================
  // Delete
  // ======================================

  const handleDelete = async (item: BaseItem) => {
    if (item.companyId !== companyId) {
      toast.error("لا يمكنك حذف بيانات شركة أخرى");
      return;
    }

    if (
      activeSection === "units" &&
      products.some((product) => product.unitId === String(item.id))
    ) {
      toast.error("لا يمكن حذف وحدة مستخدمة في أصناف");
      return;
    }

    if (
      activeSection === "categories" &&
      products.some((product) => product.categoryId === String(item.id))
    ) {
      toast.error("لا يمكن حذف مجموعة تحتوي على أصناف");
      return;
    }

    if (activeSection === "warehouses" && warehouses.length === 1) {
      toast.error("يجب الاحتفاظ بمستودع واحد على الأقل");
      return;
    }

    if (activeSection === "units" && (item as Unit).isDefault) {
      toast.error("لا يمكن حذف وحدة القياس الافتراضية");
      return;
    }

    const confirmed = window.confirm("هل أنت متأكد من حذف هذا السجل؟");

    if (!confirmed) return;

    try {
      await api.delete(`${getEndpoint()}/${item.id}`);

      toast.success("تم الحذف بنجاح");

      await loadData(companyId);
    } catch (error) {
      console.error(error);
      toast.error("تعذر حذف السجل");
    }
  };

  // ======================================
  // Search
  // ======================================

  const filteredData = getCurrentData().filter((item) => {
    const searchText = search.toLowerCase();

    const name = String(item.name || "").toLowerCase();

    const code =
      "sku" in item
        ? String(item.sku)
        : "symbol" in item
          ? String(item.symbol)
          : "code" in item
            ? String(item.code)
            : "";

    return (
      item.companyId === companyId &&
      (name.includes(searchText) || code.toLowerCase().includes(searchText))
    );
  });

  // ======================================
  // Styles
  // ======================================

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass = "mb-2 block text-sm font-medium text-gray-700";

  // ======================================
  // Loading
  // ======================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <FiRefreshCw className="animate-spin text-3xl text-blue-600" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div
        dir="rtl"
        className="m-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700"
      >
        لم يتم العثور على الشركة المرتبطة بالمستخدم.
        <p className="mt-2 text-sm">
          تحقق من وجود companyId في بيانات المستخدم المسجل.
        </p>
      </div>
    );
  }

  // ======================================
  // Main UI
  // ======================================

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* Header */}

      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <span>المخزون</span>
          <span>/</span>
          <span className="font-medium text-blue-600">إعدادات المخزون</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">إعدادات المخزون</h1>

        <p className="mt-2 text-sm text-gray-500">
          إدارة المستودعات ومجموعات الأصناف ووحدات القياس والأصناف.
        </p>
      </div>

      {/* Company ID */}

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        الشركة الحالية: <strong>{companyId}</strong>
      </div>

      {/* Statistics / Sections */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon;

          const count =
            section.id === "warehouses"
              ? warehouses.length
              : section.id === "categories"
                ? categories.length
                : section.id === "units"
                  ? units.length
                  : products.length;

          return (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setSearch("");
                setShowForm(false);
              }}
              className={`rounded-xl border bg-white p-4 text-right shadow-sm transition hover:border-blue-300 ${
                activeSection === section.id
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                  <Icon size={22} />
                </div>

                <span className="text-xl font-bold text-gray-800">{count}</span>
              </div>

              <h3 className="mt-4 font-bold text-gray-800">{section.title}</h3>

              <p className="mt-1 text-xs text-gray-500">
                {section.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Table */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar */}

        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {sections.find((section) => section.id === activeSection)?.title}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              عدد السجلات: {filteredData.length}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <FiSearch
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="text"
                placeholder="ابحث هنا..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2.5 pr-10 pl-3 text-sm outline-none focus:border-blue-500 sm:w-56"
              />
            </div>

            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <FiPlus size={18} />
              إضافة جديد
            </button>
          </div>
        </div>

        {/* Table */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-right text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-4">الاسم</th>

                <th className="px-5 py-4">الرقم / الرمز</th>

                {activeSection === "products" && (
                  <>
                    <th className="px-5 py-4">المجموعة</th>
                    <th className="px-5 py-4">وحدة القياس</th>
                    <th className="px-5 py-4">الباركود</th>
                  </>
                )}

                {activeSection === "warehouses" && (
                  <th className="px-5 py-4">الموقع</th>
                )}

                <th className="px-5 py-4">الحالة</th>

                <th className="px-5 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="transition hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-800">
                    {activeSection === "warehouses" ? (
                      <Link
                        href={`/erp/inventory/warehouses/${item.id}`}
                        className="text-blue-600 transition hover:text-blue-800 hover:underline"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      item.name
                    )}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {"sku" in item
                      ? item.sku
                      : "symbol" in item
                        ? item.symbol
                        : "code" in item
                          ? item.code
                          : "-"}
                  </td>

                  {activeSection === "products" && (
                    <>
                      <td className="px-5 py-4">
                        {(item as Product).categoryName}
                      </td>

                      <td className="px-5 py-4">
                        {(item as Product).unitName}
                      </td>

                      <td className="px-5 py-4 font-mono">
                        {(item as Product).barcode}
                      </td>
                    </>
                  )}

                  {activeSection === "warehouses" && (
                    <td className="px-5 py-4">
                      {(item as Warehouse).location || "-"}
                    </td>
                  )}

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        item.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {item.status === "active" ? "نشط" : "غير نشط"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        title="تعديل"
                        className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                      >
                        <FiEdit2 size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(item)}
                        title="حذف"
                        className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan={activeSection === "products" ? 6 : 4}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    لا توجد بيانات حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "تعديل" : "إضافة"}{" "}
                {
                  sections.find((section) => section.id === activeSection)
                    ?.title
                }
              </h2>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg bg-gray-100 p-2 text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                {/* Name */}

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    الاسم <span className="text-red-500">*</span>
                  </label>

                  <input
                    name="name"
                    value={String(form.name || "")}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>

                {/* Warehouse */}

                {activeSection === "warehouses" && (
                  <>
                    <div>
                      <label className={labelClass}>رمز المستودع</label>

                      <input
                        name="code"
                        value={String(form.code || "")}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="WH-001"
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClass}>الموقع</label>

                      <input
                        name="location"
                        value={String(form.location || "")}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          name="isDefault"
                          checked={Boolean(form.isDefault)}
                          onChange={handleChange}
                        />
                        المستودع الافتراضي
                      </label>
                    </div>
                  </>
                )}

                {/* Category */}

                {activeSection === "categories" && (
                  <div>
                    <label className={labelClass}>رمز المجموعة</label>

                    <input
                      name="code"
                      value={String(form.code || "")}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="CAT-001"
                      required
                    />
                  </div>
                )}

                {/* Unit */}

                {activeSection === "units" && (
                  <div>
                    <label className={labelClass}>رمز وحدة القياس</label>

                    <input
                      name="symbol"
                      value={String(form.symbol || "")}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="kg"
                      required
                    />
                  </div>
                )}

                {/* Product */}

                {activeSection === "products" && (
                  <>
                    <div>
                      <label className={labelClass}>مجموعة الصنف</label>

                      <select
                        name="categoryId"
                        value={String(form.categoryId || "")}
                        onChange={handleChange}
                        className={inputClass}
                        required
                      >
                        <option value="">اختر المجموعة</option>

                        {categories
                          .filter((item) => item.status === "active")
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>وحدة القياس</label>

                      <select
                        name="unitId"
                        value={String(form.unitId || "")}
                        onChange={handleChange}
                        className={inputClass}
                        required
                      >
                        <option value="">اختر وحدة القياس</option>

                        {units
                          .filter((item) => item.status === "active")
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.symbol})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="md:col-span-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                      سيتم إنشاء رقم الصنف والباركود تلقائياً عند الحفظ.
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          name="trackInventory"
                          checked={Boolean(form.trackInventory)}
                          onChange={handleChange}
                        />
                        تتبع مخزون هذا الصنف
                      </label>
                    </div>
                  </>
                )}

                {/* Description */}

                {(activeSection === "warehouses" ||
                  activeSection === "categories") && (
                  <div className="md:col-span-2">
                    <label className={labelClass}>الوصف</label>

                    <textarea
                      name="description"
                      value={String(form.description || "")}
                      onChange={handleChange}
                      rows={3}
                      className={inputClass}
                    />
                  </div>
                )}

                {/* Status */}

                <div>
                  <label className={labelClass}>الحالة</label>

                  <select
                    name="status"
                    value={String(form.status || "active")}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>
              </div>

              {/* Footer */}

              <div className="flex justify-end gap-3 border-t p-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-700"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? (
                    <FiRefreshCw className="animate-spin" />
                  ) : (
                    <FiSave />
                  )}

                  {saving ? "جارٍ الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
