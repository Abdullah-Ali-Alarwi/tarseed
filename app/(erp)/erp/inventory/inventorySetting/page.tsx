"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
} from "react-icons/fi";

import { toast } from "sonner";

// ========================================
// Types
// ========================================

type Status = "active" | "inactive";

type Section = "warehouses" | "categories" | "units" | "products";

interface BaseItem {
  id: string;
  companyId: string;
  status: Status;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface Warehouse extends BaseItem {
  code?: string;
  location?: string;
  description?: string;
  isDefault?: boolean;
}

interface Category extends BaseItem {
  code: string;
  description?: string;
  extra?: Record<string, unknown>;
}

interface Unit extends BaseItem {
  symbol: string;
  isDefault: boolean;
  extra?: Record<string, unknown>;
}

interface Product extends BaseItem {
  sku: string;
  barcode?: string;
  categoryId: string;
  categoryName: string;
  unitId: string;
  unitName: string;
  trackInventory: boolean;
}

interface ReferenceRecord {
  id?: string;
  companyId?: string;

  productId?: string;
  warehouseId?: string;

  fromWarehouseId?: string;
  toWarehouseId?: string;

  sourceWarehouseId?: string;
  destinationWarehouseId?: string;

  itemId?: string;

  items?: Array<{
    productId?: string;
    itemId?: string;
  }>;
}

type FormData = Record<string, string | boolean>;

// ========================================
// Default Units
// ========================================

const DEFAULT_UNITS = [
  { name: "جرام", symbol: "g" },
  { name: "كيلوجرام", symbol: "kg" },
  { name: "لتر", symbol: "L" },
  { name: "حبة", symbol: "pcs" },
  { name: "كرتونة", symbol: "ctn" },
];

// ========================================
// Helpers
// ========================================

const createId = () => crypto.randomUUID();

const getRecordName = (item: BaseItem) => {
  return item.name || item.id;
};

const hasProductReference = (record: ReferenceRecord, productId: string) => {
  return (
    String(record.productId || "") === productId ||
    String(record.itemId || "") === productId ||
    Boolean(
      record.items?.some(
        (item) =>
          String(item.productId || "") === productId ||
          String(item.itemId || "") === productId,
      ),
    )
  );
};

const hasWarehouseReference = (
  record: ReferenceRecord,
  warehouseId: string,
) => {
  return (
    String(record.warehouseId || "") === warehouseId ||
    String(record.fromWarehouseId || "") === warehouseId ||
    String(record.toWarehouseId || "") === warehouseId ||
    String(record.sourceWarehouseId || "") === warehouseId ||
    String(record.destinationWarehouseId || "") === warehouseId
  );
};

const getErrorMessage = (error: any) => {
  return error?.message || "حدث خطأ غير متوقع";
};

// ========================================
// Main Component
// ========================================

export default function InventorySettingPage() {
  const [companyId, setCompanyId] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

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
  // Initialize
  // ======================================

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!authUser) {
        toast.error("يرجى تسجيل الدخول أولاً");
        return;
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select(
          "id,name,username,role,type,companyId,status,isActive,auth_user_id",
        )
        .eq("auth_user_id", authUser.id)
        .maybeSingle();

      if (userError) throw userError;

      if (!user) {
        toast.error("لم يتم العثور على بيانات المستخدم");
        return;
      }

      if (user.type === "platform") {
        toast.error("هذا القسم مخصص لمستخدمي الشركات");
        return;
      }

      if (!user.companyId) {
        toast.error("المستخدم غير مرتبط بشركة");
        return;
      }

      if (user.isActive === false || user.status === "inactive") {
        toast.error("حساب المستخدم غير نشط");
        return;
      }

      setCurrentUser(user);
      setCompanyId(String(user.companyId));

      await loadData(String(user.companyId));
    } catch (error) {
      console.error("Initialize Error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // Seed Default Units
  // ======================================

  const seedDefaultUnits = async (
    currentCompanyId: string,
    existingUnits: Unit[],
  ) => {
    const missingUnits = DEFAULT_UNITS.filter(
      (defaultUnit) =>
        !existingUnits.some(
          (unit) =>
            String(unit.companyId) === currentCompanyId &&
            String(unit.symbol || "").toLowerCase() ===
              defaultUnit.symbol.toLowerCase(),
        ),
    );

    if (!missingUnits.length) return;

    const payload = missingUnits.map((unit) => ({
      id: createId(),
      companyId: currentCompanyId,
      name: unit.name,
      symbol: unit.symbol,
      status: "active",
      isDefault: true,
      extra: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const { error } = await supabase.from("units").insert(payload);

    if (error) throw error;
  };

  // ======================================
  // Load Data
  // ======================================

  const loadData = async (currentCompanyId: string) => {
    try {
      const [warehouseResult, categoryResult, unitResult, productResult] =
        await Promise.all([
          supabase
            .from("warehouses")
            .select("*")
            .eq("companyId", currentCompanyId),

          supabase
            .from("categories")
            .select(
              "id,companyId,name,status,code,description,extra,createdAt,updatedAt",
            )
            .eq("companyId", currentCompanyId),

          supabase
            .from("units")
            .select(
              "id,companyId,name,symbol,status,isDefault,extra,createdAt,updatedAt",
            )
            .eq("companyId", currentCompanyId),

          supabase
            .from("products")
            .select("*")
            .eq("companyId", currentCompanyId),
        ]);

      if (warehouseResult.error) throw warehouseResult.error;
      if (categoryResult.error) throw categoryResult.error;
      if (unitResult.error) throw unitResult.error;
      if (productResult.error) throw productResult.error;

      let companyUnits = (unitResult.data || []) as Unit[];

      await seedDefaultUnits(currentCompanyId, companyUnits);

      const { data: updatedUnits, error: updatedUnitsError } = await supabase
        .from("units")
        .select(
          "id,companyId,name,symbol,status,isDefault,extra,createdAt,updatedAt",
        )
        .eq("companyId", currentCompanyId);

      if (updatedUnitsError) throw updatedUnitsError;

      companyUnits = (updatedUnits || []) as Unit[];

      setWarehouses((warehouseResult.data || []) as Warehouse[]);
      setCategories((categoryResult.data || []) as Category[]);
      setUnits(companyUnits);
      setProducts((productResult.data || []) as Product[]);
    } catch (error) {
      console.error("Load Data Error:", error);
      toast.error(`تعذر تحميل بيانات المخزون: ${getErrorMessage(error)}`);
    }
  };

  // ======================================
  // Generate Warehouse Code
  // ======================================

  const generateWarehouseCode = async (): Promise<string> => {
    if (!companyId) {
      throw new Error("الشركة غير محددة");
    }

    // قراءة الرموز الموجودة مباشرة من قاعدة البيانات
    const { data, error } = await supabase
      .from("warehouses")
      .select("code")
      .eq("companyId", companyId);

    if (error) throw error;

    const existingCodes = (data || []).map((item: any) =>
      String(item.code || "")
        .trim()
        .toUpperCase(),
    );

    // استخراج أكبر رقم مستخدم
    const maxNumber = existingCodes.reduce((max, code) => {
      const match = code.match(/^WH-(\d+)$/);

      if (!match) return max;

      return Math.max(max, Number(match[1]));
    }, 0);

    // البحث عن أول رقم غير مستخدم
    let nextNumber = maxNumber + 1;
    let generatedCode = "";

    do {
      generatedCode = `WH-${String(nextNumber).padStart(3, "0")}`;
      nextNumber++;
    } while (existingCodes.includes(generatedCode));

    return generatedCode;
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

  const getCurrentData = (): BaseItem[] => {
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

  const getEndpoint = () => activeSection;

  // ======================================
  // Open Add Form
  // ======================================

  const handleAdd = async () => {
    setEditingId(null);

    switch (activeSection) {
      case "warehouses":
        try {
          const generatedCode = await generateWarehouseCode();

          setForm({
            ...emptyWarehouse,
            code: generatedCode,
          });
        } catch (error) {
          console.error("Generate Warehouse Code Error:", error);
          toast.error(`تعذر إنشاء رمز المستودع: ${getErrorMessage(error)}`);
          return;
        }
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
    if (item.companyId !== companyId) {
      toast.error("لا يمكنك تعديل بيانات شركة أخرى");
      return;
    }

    setEditingId(String(item.id));

    if (activeSection === "products") {
      const product = item as Product;

      setForm({
        name: product.name,
        categoryId: product.categoryId,
        unitId: product.unitId,
        trackInventory: product.trackInventory,
        status: product.status,
      });
    } else if (activeSection === "units") {
      const unit = item as Unit;

      setForm({
        name: unit.name,
        symbol: unit.symbol,
        status: unit.status,
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
  // Verify Current User
  // ======================================

  const verifyCurrentUser = async () => {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!authUser) {
      throw new Error("انتهت جلسة تسجيل الدخول");
    }

    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id,name,username,role,type,companyId,status,isActive,auth_user_id",
      )
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (error) throw error;

    if (
      !user ||
      user.type === "platform" ||
      !user.companyId ||
      String(user.companyId) !== companyId ||
      user.isActive === false ||
      user.status === "inactive"
    ) {
      throw new Error("ليس لديك صلاحية لتنفيذ هذه العملية");
    }

    return user;
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

      const user = await verifyCurrentUser();
      setCurrentUser(user);

      const oldItem = editingId
        ? getCurrentData().find((item) => String(item.id) === editingId)
        : undefined;

      if (editingId && !oldItem) {
        toast.error("تعذر العثور على السجل المطلوب");
        return;
      }

      if (oldItem && oldItem.companyId !== companyId) {
        toast.error("لا يمكنك تعديل بيانات شركة أخرى");
        return;
      }

      const now = new Date().toISOString();

      let payload: Record<string, unknown> = {
        companyId,
        updatedAt: now,
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

          updatedAt: now,
        };

        if (!editingId) {
          const generated = generateProductNumber();

          payload.sku = generated.sku;
          payload.barcode = generated.barcode;

          payload.createdAt = now;
        }
      }

      // ----------------------------------
      // Warehouse
      // ----------------------------------

      if (activeSection === "warehouses") {
        // الاحتفاظ بالرمز الحالي عند التعديل
        // وإنشاء رمز جديد عند الإضافة
        let warehouseCode = "";

        if (editingId && oldItem) {
          warehouseCode = String((oldItem as Warehouse).code || "").trim();

          // إذا كان المستودع القديم بلا رمز، أنشئ له رمزًا تلقائيًا
          if (!warehouseCode) {
            warehouseCode = await generateWarehouseCode();
          }
        } else {
          warehouseCode = await generateWarehouseCode();
        }

        // التحقق من عدم وجود الرمز مسبقًا في قاعدة البيانات
        const { data: duplicateWarehouse, error: duplicateError } =
          await supabase
            .from("warehouses")
            .select("id")
            .eq("companyId", companyId)
            .ilike("code", warehouseCode)
            .maybeSingle();

        if (duplicateError) throw duplicateError;

        if (
          duplicateWarehouse &&
          String(duplicateWarehouse.id) !== String(editingId || "")
        ) {
          // إذا كان الرمز مكررًا، نحاول إنشاء رمز جديد عند الإضافة
          if (!editingId) {
            warehouseCode = await generateWarehouseCode();

            const { data: secondCheck, error: secondCheckError } =
              await supabase
                .from("warehouses")
                .select("id")
                .eq("companyId", companyId)
                .ilike("code", warehouseCode)
                .maybeSingle();

            if (secondCheckError) throw secondCheckError;

            if (secondCheck) {
              throw new Error("تعذر إنشاء رمز فريد للمستودع. حاول مرة أخرى.");
            }
          } else {
            toast.error("رمز المستودع مستخدم بالفعل");
            return;
          }
        }

        payload = {
          companyId,
          name: String(form.name).trim(),
          code: warehouseCode,
          location: String(form.location || ""),
          description: String(form.description || ""),
          isDefault: Boolean(form.isDefault),
          status: String(form.status || "active"),
          updatedAt: now,
        };

        if (!editingId) {
          payload.createdAt = now;
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
          companyId,
          name: String(form.name).trim(),
          code: String(form.code).trim(),
          description: String(form.description || ""),
          status: String(form.status || "active"),
          updatedAt: now,
        };

        if (!editingId) {
          payload.createdAt = now;
          payload.extra = {};
        }
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
          companyId,
          name: String(form.name).trim(),
          symbol: String(form.symbol).trim(),
          status: String(form.status || "active"),
          updatedAt: now,
        };

        if (!editingId) {
          payload.isDefault = false;
          payload.createdAt = now;
          payload.extra = {};
        }
      }

      // ----------------------------------
      // Create / Update
      // ----------------------------------

      const table = getEndpoint();

      if (editingId) {
        const { error } = await supabase
          .from(table)
          .update(payload)
          .eq("id", editingId)
          .eq("companyId", companyId);

        if (error) throw error;

        toast.success("تم تحديث البيانات بنجاح");
      } else {
        const { error } = await supabase.from(table).insert({
          id: createId(),
          ...payload,
        });

        if (error) throw error;

        toast.success("تمت الإضافة بنجاح");
      }

      // ----------------------------------
      // Default Warehouse
      // ----------------------------------

      if (activeSection === "warehouses" && Boolean(form.isDefault)) {
        const otherDefaults = warehouses.filter(
          (warehouse) =>
            warehouse.isDefault &&
            String(warehouse.id) !== editingId &&
            warehouse.companyId === companyId,
        );

        for (const warehouse of otherDefaults) {
          const { error } = await supabase
            .from("warehouses")
            .update({
              isDefault: false,
              updatedAt: new Date().toISOString(),
            })
            .eq("id", warehouse.id)
            .eq("companyId", companyId);

          if (error) throw error;
        }
      }

      setShowForm(false);
      setEditingId(null);
      setForm({});

      await loadData(companyId);
    } catch (error: any) {
      console.error("Save Inventory Setting Error:", error);

      // معالجة خطأ القيد الفريد في قاعدة البيانات
      if (
        error?.code === "23505" ||
        String(error?.message || "")
          .toLowerCase()
          .includes("duplicate")
      ) {
        toast.error("رمز المستودع مستخدم بالفعل، حاول مرة أخرى");
      } else {
        toast.error(`تعذر حفظ البيانات: ${getErrorMessage(error)}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // ======================================
  // Load References Before Delete
  // ======================================

  const loadDeleteReferences = async () => {
    const tables = [
      "warehouseStocks",
      "inventoryMovements",
      "transfers",
      "stockAdjustments",
      "stocktakes",
      "purchases",
      "sales",
    ];

    const results = await Promise.all(
      tables.map((table) =>
        supabase.from(table).select("*").eq("companyId", companyId),
      ),
    );

    for (let i = 0; i < results.length; i++) {
      if (results[i].error) {
        throw results[i].error;
      }
    }

    return {
      warehouseStocks: results[0].data as ReferenceRecord[],
      inventoryMovements: results[1].data as ReferenceRecord[],
      transfers: results[2].data as ReferenceRecord[],
      stockAdjustments: results[3].data as ReferenceRecord[],
      stocktakes: results[4].data as ReferenceRecord[],
      purchases: results[5].data as ReferenceRecord[],
      sales: results[6].data as ReferenceRecord[],
    };
  };

  // ======================================
  // Delete
  // ======================================

  const handleDelete = async (item: BaseItem) => {
    if (item.companyId !== companyId) {
      toast.error("لا يمكنك حذف بيانات شركة أخرى");
      return;
    }

    try {
      await verifyCurrentUser();

      // ----------------------------------
      // Unit References
      // ----------------------------------

      if (
        activeSection === "units" &&
        products.some(
          (product) =>
            product.companyId === companyId &&
            String(product.unitId) === String(item.id),
        )
      ) {
        toast.error("لا يمكن حذف وحدة مستخدمة في أصناف");
        return;
      }

      // ----------------------------------
      // Category References
      // ----------------------------------

      if (
        activeSection === "categories" &&
        products.some(
          (product) =>
            product.companyId === companyId &&
            String(product.categoryId) === String(item.id),
        )
      ) {
        toast.error("لا يمكن حذف مجموعة تحتوي على أصناف");
        return;
      }

      // ----------------------------------
      // Warehouse Rules
      // ----------------------------------

      if (activeSection === "warehouses") {
        if (
          warehouses.filter((warehouse) => warehouse.companyId === companyId)
            .length <= 1
        ) {
          toast.error("يجب الاحتفاظ بمستودع واحد على الأقل");
          return;
        }

        if ((item as Warehouse).isDefault) {
          toast.error(
            "لا يمكن حذف المستودع الافتراضي. عيّن مستودعًا آخر أولاً.",
          );
          return;
        }
      }

      // ----------------------------------
      // Default Unit
      // ----------------------------------

      if (activeSection === "units" && (item as Unit).isDefault) {
        toast.error("لا يمكن حذف وحدة القياس الافتراضية");
        return;
      }

      const confirmed = window.confirm(
        `هل أنت متأكد من حذف "${getRecordName(item)}"؟`,
      );

      if (!confirmed) return;

      setSaving(true);

      // ----------------------------------
      // Check Database References
      // ----------------------------------

      if (activeSection === "warehouses" || activeSection === "products") {
        let references;

        try {
          references = await loadDeleteReferences();
        } catch (error) {
          console.error("Load Delete References Error:", error);

          toast.error(
            "تعذر التحقق من ارتباطات السجل. لم يتم تنفيذ الحذف حفاظًا على البيانات.",
          );

          return;
        }

        const referenceGroups = [
          references.warehouseStocks,
          references.inventoryMovements,
          references.transfers,
          references.stockAdjustments,
          references.stocktakes,
          references.purchases,
          references.sales,
        ];

        if (activeSection === "warehouses") {
          const warehouseId = String(item.id);

          const isUsed = referenceGroups.some((records) =>
            records.some((record) =>
              hasWarehouseReference(record, warehouseId),
            ),
          );

          if (isUsed) {
            toast.error(
              "لا يمكن حذف المستودع لأنه مرتبط بأرصدة أو حركات أو مستندات مخزنية.",
            );
            return;
          }
        }

        if (activeSection === "products") {
          const productId = String(item.id);

          const isUsed = referenceGroups.some((records) =>
            records.some((record) => hasProductReference(record, productId)),
          );

          if (isUsed) {
            toast.error(
              "لا يمكن حذف الصنف لأنه مرتبط بأرصدة أو حركات أو مستندات.",
            );
            return;
          }
        }
      }

      // ----------------------------------
      // Delete Request
      // ----------------------------------

      const { error } = await supabase
        .from(getEndpoint())
        .delete()
        .eq("id", item.id)
        .eq("companyId", companyId);

      if (error) throw error;

      toast.success("تم الحذف بنجاح");

      await loadData(companyId);
    } catch (error) {
      console.error("Delete Inventory Setting Error:", error);

      toast.error(`تعذر حذف السجل: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
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
        ? String(item.sku || "")
        : "symbol" in item
          ? String(item.symbol || "")
          : String(item.code || "");

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
                        : item.code || "-"}
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
                        disabled={saving}
                        title="حذف"
                        className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
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
                        className={`${inputClass} cursor-not-allowed bg-gray-100 text-gray-500`}
                        placeholder="WH-001"
                        readOnly
                        disabled
                        dir="ltr"
                      />

                      <p className="mt-1 text-xs text-gray-500">
                        يتم إنشاء رمز المستودع تلقائيًا.
                      </p>
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
