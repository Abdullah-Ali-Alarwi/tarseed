"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiSave,
  FiRefreshCw,
  FiPackage,
  FiFileText,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

type AnyRecord = Record<string, any>;

type PurchaseItem = {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
};

type PaymentMethod = "cash" | "bank" | "credit";

const today = () => new Date().toISOString().slice(0, 10);

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const money = (value: number) =>
  new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const normalize = (value: any) => String(value ?? "");

export default function NewPurchasePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");

  // المستخدم الحالي
  const [currentUser, setCurrentUser] = useState<AnyRecord | null>(null);

  const [suppliers, setSuppliers] = useState<AnyRecord[]>([]);
  const [products, setProducts] = useState<AnyRecord[]>([]);
  const [warehouses, setWarehouses] = useState<AnyRecord[]>([]);
  const [accounts, setAccounts] = useState<AnyRecord[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<AnyRecord[]>([]);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState(today());
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      id: createId(),
      productId: "",
      productName: "",
      productCode: "",
      warehouseId: "",
      warehouseName: "",
      quantity: 1,
      price: 0,
      discount: 0,
      total: 0,
    },
  ]);

  // =========================================
  // المستخدم الذي نفذ العملية
  // =========================================

  const actorName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.username ||
    "غير معروف";

  const actorData = useMemo(
    () => ({
      createdBy: actorName,
      createdById: normalize(currentUser?.id),
      createdByUsername: normalize(currentUser?.username),
      createdByRole: normalize(currentUser?.role),
      createdByType: normalize(currentUser?.type),
    }),
    [currentUser, actorName],
  );

  // =========================================
  // البيانات المختارة
  // =========================================

  const selectedSupplier = useMemo(
    () => suppliers.find((item) => normalize(item.id) === supplierId),
    [suppliers, supplierId],
  );

  const inventoryAccount = useMemo(
    () =>
      accounts.find(
        (item) =>
          normalize(item.code) === "1104" &&
          item.isGroup !== true &&
          item.status !== "inactive" &&
          item.isActive !== false,
      ) ||
      accounts.find(
        (item) =>
          normalize(item.code) === "1104" &&
          item.status !== "inactive" &&
          item.isActive !== false,
      ),
    [accounts],
  );

  const paymentAccounts = useMemo(
    () =>
      accounts.filter((account) => {
        const code = normalize(account.code);

        return (
          (code === "1101" || code.startsWith("1102")) &&
          account.isGroup !== true &&
          account.status !== "inactive" &&
          account.isActive !== false
        );
      }),
    [accounts],
  );

  const selectedPaymentAccount = useMemo(
    () =>
      paymentAccounts.find(
        (account) => normalize(account.id) === paymentAccountId,
      ),
    [paymentAccounts, paymentAccountId],
  );

  // =========================================
  // الحسابات
  // =========================================

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            Number(item.quantity) * Number(item.price) - Number(item.discount),
          ),
        0,
      ),
    [items],
  );

  const taxAmount = useMemo(
    () => (subtotal * Number(taxRate || 0)) / 100,
    [subtotal, taxRate],
  );

  const total = useMemo(
    () => Math.max(0, subtotal - Number(invoiceDiscount || 0) + taxAmount),
    [subtotal, invoiceDiscount, taxAmount],
  );

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items],
  );

  // =========================================
  // تحميل بيانات الشركة والمستخدم
  // =========================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        toast.error("يرجى تسجيل الدخول أولاً");
        router.push("/login");
        return;
      }

      const authUser = JSON.parse(storedUser);

      if (authUser.type === "platform") {
        toast.error("لا يمكن لمستخدم المنصة إنشاء فاتورة شراء");
        router.push("/wezzan/dashboard");
        return;
      }

      const username = authUser.username;

      if (!username) {
        toast.error("بيانات المستخدم غير مكتملة");
        return;
      }

      // جلب المستخدم من قاعدة البيانات
      const usersResponse = await api.get("/users", {
        params: { username },
      });

      const user = usersResponse.data.find(
        (item: AnyRecord) => item.username === username,
      );

      if (!user || !user.companyId) {
        toast.error("المستخدم غير مرتبط بشركة");
        return;
      }

      const currentCompanyId = normalize(user.companyId);

      // حفظ المستخدم الحالي
      setCurrentUser({
        ...user,
        name:
          user.name ||
          user.fullName ||
          authUser.name ||
          authUser.fullName ||
          user.username,
      });

      setCompanyId(currentCompanyId);

      const [
        companiesRes,
        suppliersRes,
        productsRes,
        warehousesRes,
        accountsRes,
        stocksRes,
        purchasesRes,
      ] = await Promise.all([
        api.get("/companies", {
          params: { id: currentCompanyId },
        }),
        api.get("/suppliers", {
          params: { companyId: currentCompanyId },
        }),
        api.get("/products", {
          params: { companyId: currentCompanyId },
        }),
        api.get("/warehouses", {
          params: { companyId: currentCompanyId },
        }),
        api.get("/accounts", {
          params: { companyId: currentCompanyId },
        }),
        api.get("/warehouseStocks", {
          params: { companyId: currentCompanyId },
        }),
        api.get("/purchases", {
          params: { companyId: currentCompanyId },
        }),
      ]);

      const company = companiesRes.data.find(
        (item: AnyRecord) => normalize(item.id) === currentCompanyId,
      );

      setCompanyName(company?.name || company?.companyName || user.name || "");

      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data);
      setWarehouses(warehousesRes.data);
      setAccounts(accountsRes.data);
      setWarehouseStocks(stocksRes.data);

      const nextNumber = `PUR-${String(purchasesRes.data.length + 1).padStart(
        4,
        "0",
      )}`;

      setInvoiceNumber(nextNumber);

      if (warehousesRes.data.length === 1) {
        setWarehouseId(normalize(warehousesRes.data[0].id));
      }

      const cashAccount = accountsRes.data.find(
        (account: AnyRecord) =>
          normalize(account.code) === "1101" && account.isGroup !== true,
      );

      if (cashAccount) {
        setPaymentAccountId(normalize(cashAccount.id));
      }
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل بيانات فاتورة الشراء");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =========================================
  // الأصناف
  // =========================================

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: createId(),
        productId: "",
        productName: "",
        productCode: "",
        warehouseId,
        warehouseName:
          warehouses.find((item) => normalize(item.id) === warehouseId)?.name ||
          "",
        quantity: 1,
        price: 0,
        discount: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) {
      toast.error("يجب أن تحتوي الفاتورة على صنف واحد على الأقل");
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof PurchaseItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === "productId") {
          const product = products.find(
            (p) => normalize(p.id) === normalize(value),
          );

          updated.productName = product?.name || "";
          updated.productCode = product?.code || product?.sku || "";
          updated.price = Number(
            product?.purchasePrice || product?.costPrice || 0,
          );
        }

        if (field === "warehouseId") {
          const warehouse = warehouses.find(
            (w) => normalize(w.id) === normalize(value),
          );

          updated.warehouseName = warehouse?.name || "";
        }

        updated.total = Math.max(
          0,
          Number(updated.quantity || 0) * Number(updated.price || 0) -
            Number(updated.discount || 0),
        );

        return updated;
      }),
    );
  };

  // =========================================
  // التحقق من الفاتورة
  // =========================================

  const validateInvoice = () => {
    if (!companyId) {
      toast.error("تعذر تحديد الشركة");
      return false;
    }

    if (!currentUser) {
      toast.error("تعذر تحديد المستخدم الحالي");
      return false;
    }

    if (!invoiceNumber.trim()) {
      toast.error("رقم الفاتورة مطلوب");
      return false;
    }

    if (!date) {
      toast.error("تاريخ الفاتورة مطلوب");
      return false;
    }

    if (!selectedSupplier) {
      toast.error("يرجى اختيار المورد");
      return false;
    }

    if (!warehouseId) {
      toast.error("يرجى اختيار المستودع");
      return false;
    }

    if (!inventoryAccount) {
      toast.error("حساب المخزون 1104 غير موجود أو غير قابل للترحيل");
      return false;
    }

    if (
      items.some(
        (item) =>
          !item.productId ||
          !item.quantity ||
          Number(item.quantity) <= 0 ||
          Number(item.price) < 0 ||
          Number(item.discount) < 0,
      )
    ) {
      toast.error("يرجى إدخال الأصناف والكميات والأسعار بشكل صحيح");
      return false;
    }

    if (Number(invoiceDiscount) < 0 || Number(taxRate) < 0) {
      toast.error("الخصم والضريبة لا يمكن أن يكونا بقيمة سالبة");
      return false;
    }

    if (Number(invoiceDiscount) > subtotal) {
      toast.error("خصم الفاتورة لا يمكن أن يتجاوز إجمالي الأصناف");
      return false;
    }

    if (paymentMethod !== "credit" && !selectedPaymentAccount) {
      toast.error("يرجى اختيار حساب الدفع");
      return false;
    }

    if (paymentMethod === "credit" && !selectedSupplier.accountId) {
      toast.error("المورد غير مرتبط بحساب محاسبي");
      return false;
    }

    if (total <= 0) {
      toast.error("إجمالي الفاتورة يجب أن يكون أكبر من صفر");
      return false;
    }

    return true;
  };

  // =========================================
  // إنشاء القيد المحاسبي
  // =========================================

  const buildJournal = (purchase: AnyRecord, journalNumber: string) => {
    const lines: AnyRecord[] = [];

    const now = new Date().toISOString();

    // مدين المخزون
    lines.push({
      id: createId(),
      companyId,
      accountId: inventoryAccount.id,
      accountCode: inventoryAccount.code,
      accountName: inventoryAccount.name,
      debit: purchase.subtotal - purchase.discount,
      credit: 0,
      description: `إضافة مخزون من فاتورة ${purchase.invoiceNumber}`,
      supplierId: selectedSupplier.id,
    });

    // ضريبة المدخلات
    if (purchase.tax > 0) {
      const taxAccount = accounts.find(
        (account) =>
          normalize(account.code) === "1105" && account.isGroup !== true,
      );

      if (!taxAccount) {
        throw new Error(
          "توجد ضريبة في الفاتورة ولكن حساب ضريبة المدخلات 1105 غير موجود",
        );
      }

      lines.push({
        id: createId(),
        companyId,
        accountId: taxAccount.id,
        accountCode: taxAccount.code,
        accountName: taxAccount.name,
        debit: purchase.tax,
        credit: 0,
        description: "ضريبة مدخلات المشتريات",
        supplierId: selectedSupplier.id,
      });
    }

    // دائن المورد أو حساب الدفع
    if (paymentMethod === "credit") {
      lines.push({
        id: createId(),
        companyId,
        accountId: selectedSupplier.accountId,
        accountCode: selectedSupplier.accountCode,
        accountName: selectedSupplier.accountName || selectedSupplier.name,
        debit: 0,
        credit: purchase.total,
        description: `شراء آجل من ${selectedSupplier.name}`,
        supplierId: selectedSupplier.id,
      });
    } else {
      lines.push({
        id: createId(),
        companyId,
        accountId: selectedPaymentAccount.id,
        accountCode: selectedPaymentAccount.code,
        accountName: selectedPaymentAccount.name,
        debit: 0,
        credit: purchase.total,
        description: `دفع فاتورة شراء ${purchase.invoiceNumber}`,
      });
    }

    const debit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);

    const credit = lines.reduce(
      (sum, line) => sum + Number(line.credit || 0),
      0,
    );

    if (Math.abs(debit - credit) > 0.01) {
      throw new Error(`القيد غير متوازن. المدين ${debit} والدائن ${credit}`);
    }

    const journalId = createId();

    const journal = {
      id: journalId,
      companyId,

      // رقم القيد
      journalNumber,
      entryNumber: journalNumber,

      date,
      description: `فاتورة شراء ${purchase.invoiceNumber}`,

      referenceType: "purchase",
      referenceId: purchase.id,
      referenceNumber: purchase.invoiceNumber,

      status: "posted",

      // الإجماليات
      totalDebit: debit,
      totalCredit: credit,
      debitTotal: debit,
      creditTotal: credit,

      // منشئ القيد
      ...actorData,

      createdAt: now,

      // مرحّل القيد
      postedBy: actorName,
      postedById: normalize(currentUser?.id),
      postedByName: actorName,
      postedByUsername: normalize(currentUser?.username),
      postedAt: now,

      updatedBy: actorName,
      updatedById: normalize(currentUser?.id),
      updatedByName: actorName,
      updatedAt: now,
    };

    const journalLines = lines.map((line) => ({
      ...line,

      journalId,
      journalNumber,
      entryNumber: journalNumber,

      date,

      referenceType: "purchase",
      referenceId: purchase.id,

      status: "posted",

      // المستخدم الذي أنشأ تفاصيل القيد
      ...actorData,
      createdAt: now,
    }));

    return {
      journal,
      lines: journalLines,
    };
  };

  // =========================================
  // تحديث المخزون
  // =========================================

  const updateInventory = async (purchase: AnyRecord) => {
    const now = new Date().toISOString();

    for (const item of purchase.items) {
      const existing = warehouseStocks.find(
        (stock) =>
          normalize(stock.companyId) === companyId &&
          normalize(stock.productId) === item.productId &&
          normalize(stock.warehouseId) === item.warehouseId,
      );

      const oldQuantity = Number(existing?.quantity || 0);

      const oldCost = Number(
        existing?.averageCost ||
          existing?.unitCost ||
          existing?.costPrice ||
          item.price,
      );

      const newQuantity = Number(item.quantity);
      const newCost = Number(item.price);

      const newTotalQuantity = oldQuantity + newQuantity;

      const averageCost =
        newTotalQuantity > 0
          ? (oldQuantity * oldCost + newQuantity * newCost) / newTotalQuantity
          : newCost;

      const stockPayload = {
        companyId,

        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,

        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,

        quantity: newTotalQuantity,

        averageCost,
        unitCost: averageCost,
        inventoryValue: newTotalQuantity * averageCost,

        // بيانات آخر تعديل
        updatedBy: actorName,
        updatedById: normalize(currentUser?.id),
        updatedByUsername: normalize(currentUser?.username),
        updatedAt: now,
      };

      if (existing) {
        await api.patch(`/warehouseStocks/${existing.id}`, stockPayload);
      } else {
        await api.post("/warehouseStocks", {
          id: createId(),
          ...stockPayload,

          // بيانات الإنشاء
          ...actorData,
          createdAt: now,
        });
      }

      // تسجيل حركة المخزون
      await api.post("/inventoryMovements", {
        id: createId(),

        companyId,

        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,

        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,

        type: "purchase_in",

        quantity: newQuantity,
        unitCost: newCost,
        totalCost: newQuantity * newCost,

        referenceType: "purchase",
        referenceId: purchase.id,
        referenceNumber: purchase.invoiceNumber,

        date,

        // المستخدم الذي نفذ الحركة
        ...actorData,
        createdAt: now,
      });
    }
  };

  // =========================================
  // حفظ الفاتورة
  // =========================================

  const handleSave = async () => {
    if (saving) return;

    if (!validateInvoice()) return;

    try {
      setSaving(true);

      const now = new Date().toISOString();

      const purchaseId = createId();

      // تجهيز الأصناف
      const normalizedItems = items.map((item) => {
        const selectedProduct = products.find(
          (product) => normalize(product.id) === item.productId,
        );

        const warehouse = warehouses.find(
          (w) => normalize(w.id) === warehouseId,
        );

        const quantity = Number(item.quantity);
        const price = Number(item.price);
        const discount = Number(item.discount || 0);

        return {
          id: item.id,

          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          name: item.productName,

          quantity,
          price,
          discount,

          total: Math.max(0, quantity * price - discount),

          warehouseId,
          warehouseName: warehouse?.name || "",

          unit: selectedProduct?.unit || "",
        };
      });

      const purchaseSubtotal = normalizedItems.reduce(
        (sum, item) => sum + item.total,
        0,
      );

      const purchaseTotal = Math.max(
        0,
        purchaseSubtotal - Number(invoiceDiscount || 0) + taxAmount,
      );

      // تجهيز فاتورة الشراء مع بيانات المستخدم
      const purchase = {
        id: purchaseId,

        companyId,

        invoiceNumber,
        date,

        supplier: selectedSupplier.name,
        supplierId: selectedSupplier.id,

        accountCode: selectedSupplier.accountCode || "",
        accountName: selectedSupplier.accountName || "",

        itemCount: normalizedItems.length,
        totalQuantity,

        items: normalizedItems,

        subtotal: purchaseSubtotal,
        discount: Number(invoiceDiscount || 0),

        tax: taxAmount,
        taxRate: Number(taxRate || 0),

        total: purchaseTotal,

        paymentMethod,

        paymentMethodName:
          paymentMethod === "cash"
            ? "نقدي"
            : paymentMethod === "bank"
              ? "تحويل بنكي"
              : "آجل",

        paymentAccountId:
          paymentMethod === "credit" ? "" : selectedPaymentAccount.id,

        status: paymentMethod === "credit" ? "pending" : "paid",

        notes,

        // المستخدم الذي أنشأ فاتورة الشراء
        ...actorData,
        createdAt: now,

        // آخر تعديل
        updatedBy: actorName,
        updatedById: normalize(currentUser?.id),
        updatedAt: now,
      };

      // =====================================
      // التحقق من عدم تكرار رقم الفاتورة
      // =====================================

      const existingPurchases = await api.get("/purchases", {
        params: { companyId },
      });

      const duplicate = existingPurchases.data.some(
        (item: AnyRecord) =>
          normalize(item.invoiceNumber) === invoiceNumber.trim(),
      );

      if (duplicate) {
        toast.error("رقم الفاتورة مستخدم مسبقاً");
        return;
      }

      // =====================================
      // توليد رقم القيد
      // =====================================

      const journalsResponse = await api.get("/journals", {
        params: { companyId },
      });

      const journalNumber = `JRN-${String(
        journalsResponse.data.length + 1,
      ).padStart(5, "0")}`;

      const { journal, lines } = buildJournal(purchase, journalNumber);

      // =====================================
      // حفظ فاتورة الشراء
      // =====================================

      await api.post("/purchases", purchase);

      // =====================================
      // تحديث المخزون
      // =====================================

      await updateInventory(purchase);

      // =====================================
      // حفظ رأس القيد المحاسبي
      // =====================================

      await api.post("/journals", journal);

      // =====================================
      // حفظ تفاصيل القيد
      // =====================================

      for (const line of lines) {
        await api.post("/journalLines", line);
      }

      // =====================================
      // تحديث رصيد المورد
      // =====================================

      if (paymentMethod === "credit") {
        const currentBalance = Number(selectedSupplier.balance || 0);

        await api.patch(`/suppliers/${selectedSupplier.id}`, {
          balance: currentBalance + purchaseTotal,

          // المستخدم الذي حدّث رصيد المورد
          updatedBy: actorName,
          updatedById: normalize(currentUser?.id),
          updatedByUsername: normalize(currentUser?.username),

          updatedAt: now,
        });
      }

      toast.success(
        `تم حفظ فاتورة الشراء وترحيل القيد بنجاح بواسطة ${actorName}`,
      );

      router.push("/erp/purchases");
    } catch (error: any) {
      console.error("Purchase save error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "حدث خطأ أثناء حفظ الفاتورة",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // واجهة التحميل
  // =========================================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[60vh] items-center justify-center">
        <FiRefreshCw className="animate-spin text-2xl text-[#0E1F33]" />
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 p-3 text-xs text-gray-800 sm:p-5"
    >
      {/* الرأس */}

      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/erp/purchases")}
              className="rounded-md border border-gray-200 bg-white p-2 hover:bg-gray-100"
            >
              <FiArrowRight size={16} />
            </button>

            <h1 className="text-lg font-bold text-gray-900">
              إضافة فاتورة شراء
            </h1>
          </div>

          <p className="mt-2 text-[10px] text-gray-500">
            {companyName} — تسجيل المشتريات وتحديث المخزون والحسابات
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
          <p className="text-[10px] text-gray-500">رقم الفاتورة</p>
          <p className="font-bold text-[#0E1F33]">{invoiceNumber}</p>
        </div>
      </div>

      {/* بيانات الفاتورة */}

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
          <FiFileText />
          بيانات الفاتورة
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-gray-600">رقم الفاتورة</label>

            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-[#0E1F33]"
            />
          </div>

          <div>
            <label className="mb-1 block text-gray-600">تاريخ الفاتورة</label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-[#0E1F33]"
            />
          </div>

          <div>
            <label className="mb-1 block text-gray-600">المورد</label>

            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-[#0E1F33]"
            >
              <option value="">اختر المورد</option>

              {suppliers
                .filter(
                  (supplier) =>
                    supplier.isActive !== false &&
                    supplier.status !== "inactive",
                )
                .map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-gray-600">المستودع</label>

            <select
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);

                const warehouse = warehouses.find(
                  (item) => normalize(item.id) === e.target.value,
                );

                setItems((prev) =>
                  prev.map((item) => ({
                    ...item,
                    warehouseId: e.target.value,
                    warehouseName: warehouse?.name || "",
                  })),
                );
              }}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-[#0E1F33]"
            >
              <option value="">اختر المستودع</option>

              {warehouses
                .filter(
                  (warehouse) =>
                    warehouse.isActive !== false &&
                    warehouse.status !== "inactive",
                )
                .map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-gray-600">طريقة الدفع</label>

            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-[#0E1F33]"
            >
              <option value="cash">نقدي</option>
              <option value="bank">تحويل بنكي</option>
              <option value="credit">آجل</option>
            </select>
          </div>

          {paymentMethod !== "credit" && (
            <div>
              <label className="mb-1 block text-gray-600">حساب الدفع</label>

              <select
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-[#0E1F33]"
              >
                <option value="">اختر حساب الدفع</option>

                {paymentAccounts
                  .filter((account) => {
                    if (paymentMethod === "cash") {
                      return normalize(account.code) === "1101";
                    }

                    return normalize(account.code).startsWith("1102");
                  })
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* الأصناف */}

      <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="flex items-center gap-2 font-bold text-gray-900">
            <FiPackage />
            أصناف الفاتورة
          </h2>

          <button
            type="button"
            onClick={addItem}
            className="flex h-8 items-center gap-1 rounded-md bg-[#0E1F33] px-3 text-white hover:bg-[#162d49]"
          >
            <FiPlus />
            إضافة صنف
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3 text-right">الصنف</th>
                <th className="p-3 text-right">الكمية</th>
                <th className="p-3 text-right">سعر الشراء</th>
                <th className="p-3 text-right">الخصم</th>
                <th className="p-3 text-right">الإجمالي</th>
                <th className="p-3 text-center">حذف</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="p-2">
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(item.id, "productId", e.target.value)
                      }
                      className="h-9 w-full rounded-md border border-gray-200 bg-white px-2"
                    >
                      <option value="">اختر الصنف</option>

                      {products
                        .filter(
                          (product) =>
                            product.isActive !== false &&
                            product.status !== "inactive",
                        )
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                            {product.code ? ` (${product.code})` : ""}
                          </option>
                        ))}
                    </select>
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", Number(e.target.value))
                      }
                      className="h-9 w-24 rounded-md border border-gray-200 px-2"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(item.id, "price", Number(e.target.value))
                      }
                      className="h-9 w-28 rounded-md border border-gray-200 px-2"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.discount}
                      onChange={(e) =>
                        updateItem(item.id, "discount", Number(e.target.value))
                      }
                      className="h-9 w-24 rounded-md border border-gray-200 px-2"
                    />
                  </td>

                  <td className="p-2 font-bold text-gray-900">
                    {money(
                      Math.max(0, item.quantity * item.price - item.discount),
                    )}
                  </td>

                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-md p-2 text-red-500 hover:bg-red-50"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="border-t border-gray-100 p-4 text-center text-amber-700">
            <FiAlertCircle className="mx-auto mb-2" size={20} />
            لا توجد أصناف مسجلة لهذه الشركة.
          </div>
        )}
      </div>

      {/* الإجماليات */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-bold text-gray-900">ملاحظات الفاتورة</h2>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="أدخل أي ملاحظات..."
            className="w-full resize-none rounded-md border border-gray-200 p-3 outline-none focus:border-[#0E1F33]"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-900">ملخص الفاتورة</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">إجمالي الكميات</span>
              <strong>{money(totalQuantity)}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">الإجمالي قبل الخصم</span>
              <strong>{money(subtotal)}</strong>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500">خصم الفاتورة</span>

              <input
                type="number"
                min="0"
                value={invoiceDiscount}
                onChange={(e) => setInvoiceDiscount(Number(e.target.value))}
                className="h-8 w-28 rounded-md border border-gray-200 px-2 text-left"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500">نسبة الضريبة %</span>

              <input
                type="number"
                min="0"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="h-8 w-28 rounded-md border border-gray-200 px-2 text-left"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">قيمة الضريبة</span>
              <strong>{money(taxAmount)}</strong>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between text-base">
                <span className="font-bold text-gray-900">إجمالي الفاتورة</span>

                <strong className="text-xl text-emerald-700">
                  {money(total)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* بيانات المستخدم */}

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 text-[11px] text-gray-600">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span>
            منشئ الفاتورة:
            <strong className="mr-1 text-[#0E1F33]">{actorName}</strong>
          </span>

          <span>
            اسم المستخدم:
            <strong className="mr-1 text-[#0E1F33]">
              {currentUser?.username || "—"}
            </strong>
          </span>

          <span>
            الدور:
            <strong className="mr-1 text-[#0E1F33]">
              {currentUser?.role || "—"}
            </strong>
          </span>
        </div>
      </div>

      {/* تنبيه محاسبي */}

      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-[11px] leading-6 text-blue-900">
        <strong>التأثير المحاسبي:</strong>
        <br />
        مدين المخزون 1104، ودائن الصندوق أو البنك أو حساب المورد حسب طريقة
        الدفع. وعند وجود ضريبة، تُسجل في حساب ضريبة المدخلات 1105. الفاتورة
        الآجلة تزيد رصيد المورد.
      </div>

      {/* الأزرار */}

      <div className="mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push("/erp/purchases")}
          className="h-10 rounded-md border border-gray-200 bg-white px-5 font-semibold hover:bg-gray-50"
        >
          إلغاء
        </button>

        <button
          type="button"
          disabled={saving || !currentUser}
          onClick={handleSave}
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#0E1F33] px-6 font-semibold text-white hover:bg-[#162d49] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}

          {saving ? "جارٍ الحفظ..." : "حفظ وترحيل الفاتورة"}
        </button>
      </div>
    </div>
  );
}
