"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { Account, AccountFormData, AccountType } from "../types";

import { getAccountNature } from "../utils";

interface Props {
  accounts: Account[];
  initialData?: Account | null;
  onSubmit: (data: AccountFormData) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: AccountFormData = {
  code: "",
  name: "",
  nameEn: "",
  type: "asset" as AccountType,
  parentId: null,
  nature: "debit",
  isGroup: false,
  allowPosting: true,
  description: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-medium text-slate-700";

const accountTypeNames: Record<AccountType, string> = {
  asset: "الأصول",
  liability: "الالتزامات",
  equity: "حقوق الملكية",
  revenue: "الإيرادات",
  expense: "المصروفات",
};

// التحقق من أن الحساب من نسل حساب معين
function isDescendant(
  accounts: Account[],
  accountId: number,
  parentId: number,
  visited = new Set<number>(),
): boolean {
  if (visited.has(accountId)) {
    return false;
  }

  visited.add(accountId);

  const account = accounts.find((item) => item.id === accountId);

  if (!account || account.parentId === null) {
    return false;
  }

  if (account.parentId === parentId) {
    return true;
  }

  return isDescendant(accounts, account.parentId, parentId, visited);
}

// ترتيب الحسابات حسب الشجرة الهرمية
function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((a, b) =>
    String(a.code).localeCompare(String(b.code), "en", {
      numeric: true,
    }),
  );
}

// توليد رقم الحساب التالي
function generateAccountCode(
  accounts: Account[],
  parentId: number,
  currentId?: number,
): string {
  const parent = accounts.find((account) => account.id === parentId);

  if (!parent) return "";

  const parentCode = String(parent.code);

  // الحد الأقصى 5 خانات
  if (parentCode.length >= 5) {
    return "";
  }

  // الأبناء المباشرون فقط
  const children = accounts.filter(
    (account) => account.parentId === parentId && account.id !== currentId,
  );

  // لا يسمح بأكثر من 9 أبناء مباشرين
  if (children.length >= 9) {
    return "";
  }

  const usedNumbers = children
    .map((child) => {
      const childCode = String(child.code);

      if (
        !childCode.startsWith(parentCode) ||
        childCode.length !== parentCode.length + 1
      ) {
        return null;
      }

      const suffix = childCode.slice(parentCode.length);

      if (!/^[1-9]$/.test(suffix)) {
        return null;
      }

      return Number(suffix);
    })
    .filter((number): number is number => number !== null);

  // البحث عن أول رقم متاح من 1 إلى 9
  for (let number = 1; number <= 9; number++) {
    if (!usedNumbers.includes(number)) {
      return parentCode + number;
    }
  }

  return "";
}

// إنشاء قائمة الحسابات التجميعية المتاحة كأبناء
function getAvailableParents(
  accounts: Account[],
  type: AccountType,
  currentId?: number,
): Account[] {
  return sortAccounts(
    accounts.filter((account) => {
      // يجب أن يكون الحساب فعالاً وتجميعياً
      if (!account.isActive || !account.isGroup || account.allowPosting) {
        return false;
      }

      // يجب أن يكون من نفس نوع الحساب
      if (account.type !== type) {
        return false;
      }

      // منع اختيار الحساب نفسه
      if (account.id === currentId) {
        return false;
      }

      // منع اختيار أحد الحسابات التابعة للحساب الحالي
      if (
        currentId !== undefined &&
        isDescendant(accounts, account.id, currentId)
      ) {
        return false;
      }

      // منع إضافة حساب تحت مستوى يتجاوز 5 خانات
      if (String(account.code).length >= 5) {
        return false;
      }

      // منع إضافة أكثر من 9 أبناء مباشرين
      const childrenCount = accounts.filter(
        (child) => child.parentId === account.id,
      ).length;

      if (childrenCount >= 9) {
        return false;
      }

      return true;
    }),
  );
}

export default function AccountForm({
  accounts,
  initialData,
  onSubmit,
  onCancel,
}: Props) {
  const [formData, setFormData] = useState<AccountFormData>(emptyForm);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(initialData);

  // هل الحساب الحالي لديه أبناء؟
  const hasChildren = useMemo(() => {
    if (!initialData) return false;

    return accounts.some((account) => account.parentId === initialData.id);
  }, [accounts, initialData?.id]);

  // تعبئة النموذج عند الإضافة أو التعديل
  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code,
        name: initialData.name,
        nameEn: initialData.nameEn || "",
        type: initialData.type,
        parentId: initialData.parentId,
        nature: initialData.nature,
        isGroup: initialData.isGroup,
        allowPosting: initialData.allowPosting,
        description: initialData.description || "",
      });
    } else {
      setFormData({ ...emptyForm });
    }

    setError("");
  }, [initialData]);

  // الحسابات المتاحة لاختيار الأب
  const availableParents = useMemo(() => {
    return getAvailableParents(accounts, formData.type, initialData?.id);
  }, [accounts, formData.type, initialData?.id]);

  // الأب المختار
  const selectedParent = useMemo(() => {
    return accounts.find((account) => account.id === formData.parentId);
  }, [accounts, formData.parentId]);

  // عدد أبناء الأب المختار
  const selectedParentChildrenCount = useMemo(() => {
    if (!formData.parentId) return 0;

    return accounts.filter((account) => account.parentId === formData.parentId)
      .length;
  }, [accounts, formData.parentId]);

  // توليد رقم الحساب تلقائياً عند اختيار الأب
  useEffect(() => {
    // في وضع التعديل نحافظ على رقم الحساب الأصلي
    if (isEditing) {
      return;
    }

    if (!formData.parentId) {
      setFormData((prev) => ({
        ...prev,
        code: "",
      }));

      return;
    }

    const newCode = generateAccountCode(accounts, formData.parentId);

    setFormData((prev) => ({
      ...prev,
      code: newCode,
    }));
  }, [accounts, formData.parentId, isEditing]);

  // تغيير نوع الحساب
  const handleTypeChange = (type: AccountType) => {
    if (isEditing && hasChildren && type !== initialData?.type) {
      setError("لا يمكن تغيير نوع حساب لديه حسابات فرعية.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      type,
      parentId: null,
      code: "",
      nature: getAccountNature(type),
    }));

    setError("");
  };

  // تغيير الحساب الأب
  const handleParentChange = (value: string) => {
    const parentId = value ? Number(value) : null;

    if (!parentId) {
      setFormData((prev) => ({
        ...prev,
        parentId: null,
        code: "",
      }));

      setError("");
      return;
    }

    const parent = accounts.find((account) => account.id === parentId);

    if (!parent) {
      setError("الحساب الأب غير موجود.");
      return;
    }

    if (!parent.isGroup || parent.allowPosting) {
      setError("لا يمكن اختيار حساب نهائي كحساب أب.");
      return;
    }

    if (!parent.isActive) {
      setError("لا يمكن اختيار حساب أب غير فعال.");
      return;
    }

    if (parent.type !== formData.type) {
      setError("يجب أن يكون نوع الحساب مطابقاً لنوع الحساب الأب.");
      return;
    }

    const newCode = generateAccountCode(accounts, parentId);

    if (!newCode) {
      setError(
        "لا يمكن إضافة حساب جديد تحت هذا الحساب. تحقق من عدد الأبناء ومستوى الحساب.",
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      parentId,
      code: newCode,
      nature: parent.nature,
    }));

    setError("");
  };

  // تغيير نوع الحساب: تجميعي أو نهائي
  const handleGroupChange = (isGroup: boolean) => {
    if (!isGroup && hasChildren) {
      setError(
        "لا يمكن تحويل الحساب إلى حساب نهائي لأنه يحتوي على حسابات فرعية.",
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      isGroup,
      allowPosting: !isGroup,
    }));

    setError("");
  };

  // التحقق من صحة البيانات قبل الحفظ
  const validateForm = (): boolean => {
    setError("");

    if (!formData.name.trim()) {
      setError("يرجى إدخال اسم الحساب.");
      return false;
    }

    if (!formData.parentId) {
      setError("يرجى اختيار الحساب الأب.");
      return false;
    }

    const parent = accounts.find((account) => account.id === formData.parentId);

    if (!parent) {
      setError("الحساب الأب غير موجود.");
      return false;
    }

    if (!parent.isActive) {
      setError("الحساب الأب غير فعال.");
      return false;
    }

    if (!parent.isGroup || parent.allowPosting) {
      setError("الحساب المختار لا يسمح بإضافة حسابات تحته.");
      return false;
    }

    if (parent.type !== formData.type) {
      setError("نوع الحساب لا يتطابق مع نوع الحساب الأب.");
      return false;
    }

    if (String(parent.code).length >= 5) {
      setError("وصل الحساب الأب إلى الحد الأقصى للمستويات.");
      return false;
    }

    const siblings = accounts.filter(
      (account) =>
        account.parentId === formData.parentId &&
        account.id !== initialData?.id,
    );

    if (siblings.length >= 9) {
      setError("لا يمكن إضافة أكثر من 9 حسابات تحت الحساب الأب.");
      return false;
    }

    if (!formData.code) {
      setError("تعذر توليد رقم الحساب. اختر حساباً أباً صالحاً.");
      return false;
    }

    // منع تكرار رقم الحساب
    const duplicateCode = accounts.some(
      (account) =>
        account.code === formData.code && account.id !== initialData?.id,
    );

    if (duplicateCode) {
      setError("رقم الحساب موجود مسبقاً.");
      return false;
    }

    // منع تكرار اسم الحساب تحت الأب نفسه
    const duplicateName = accounts.some(
      (account) =>
        account.parentId === formData.parentId &&
        account.name.trim() === formData.name.trim() &&
        account.id !== initialData?.id,
    );

    if (duplicateName) {
      setError("يوجد حساب بنفس الاسم تحت الحساب الأب المختار.");
      return false;
    }

    // الحساب الذي لديه أبناء يجب أن يكون تجميعياً
    if (hasChildren && !formData.isGroup) {
      setError("الحساب الذي يحتوي على أبناء يجب أن يكون حساباً تجميعياً.");
      return false;
    }

    // ضبط قبول القيود
    if (formData.isGroup && formData.allowPosting) {
      setError("الحساب التجميعي لا يمكن أن يقبل القيود.");
      return false;
    }

    if (!formData.isGroup && !formData.allowPosting) {
      setError("الحساب النهائي يجب أن يقبل القيود.");
      return false;
    }

    return true;
  };

  // حفظ الحساب
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim(),
        description: formData.description.trim(),
        allowPosting: !formData.isGroup,
      });
    } catch (err) {
      console.error("Account save error:", err);
      setError("حدث خطأ أثناء حفظ الحساب. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* رسالة الخطأ */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* نوع الحساب */}
      <div>
        <label className={labelClass}>
          نوع الحساب <span className="text-red-500">*</span>
        </label>

        <select
          value={formData.type}
          onChange={(e) => handleTypeChange(e.target.value as AccountType)}
          disabled={isEditing && hasChildren}
          className={inputClass}
        >
          {Object.entries(accountTypeNames).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {isEditing && hasChildren && (
          <p className="mt-1 text-xs text-amber-600">
            لا يمكن تغيير نوع حساب يحتوي على حسابات فرعية.
          </p>
        )}
      </div>

      {/* الحساب الأب */}
      <div>
        <label className={labelClass}>
          الحساب الأب <span className="text-red-500">*</span>
        </label>

        <select
          value={formData.parentId ?? ""}
          onChange={(e) => handleParentChange(e.target.value)}
          disabled={isEditing}
          className={inputClass}
        >
          <option value="">اختر الحساب الأب</option>

          {availableParents.map((account) => {
            const level = String(account.code).length - 1;

            return (
              <option key={account.id} value={account.id}>
                {"　".repeat(Math.max(0, level))}
                {account.code} - {account.name}
              </option>
            );
          })}
        </select>

        <p className="mt-2 text-xs text-slate-500">
          تظهر هنا الحسابات التجميعية التي تسمح بإضافة حسابات تحتها. اختر
          المستوى المناسب من شجرة الحسابات.
        </p>

        {selectedParent && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
            <p className="font-medium text-blue-800">الحساب الأب المختار:</p>

            <p className="mt-1 text-blue-700">
              {selectedParent.code} - {selectedParent.name}
            </p>

            <p className="mt-1 text-xs text-blue-600">
              عدد الحسابات التابعة مباشرة: {selectedParentChildrenCount} من 9
            </p>
          </div>
        )}
      </div>

      {/* رقم الحساب */}
      <div>
        <label className={labelClass}>رقم الحساب</label>

        <input
          type="text"
          value={formData.code}
          readOnly
          placeholder="يتم توليد رقم الحساب تلقائياً"
          className={`${inputClass} cursor-not-allowed bg-slate-100 font-semibold`}
        />

        <p className="mt-1 text-xs text-slate-500">
          يتم إنشاء رقم الحساب تلقائياً بناءً على الحساب الأب المختار.
        </p>
      </div>

      {/* اسم الحساب */}
      <div>
        <label className={labelClass}>
          اسم الحساب بالعربية <span className="text-red-500">*</span>
        </label>

        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          placeholder="مثال: السيارات"
          className={inputClass}
        />
      </div>

      {/* الاسم الإنجليزي */}
      <div>
        <label className={labelClass}>اسم الحساب بالإنجليزية</label>

        <input
          type="text"
          value={formData.nameEn}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              nameEn: e.target.value,
            }))
          }
          placeholder="Account name in English"
          dir="ltr"
          className={inputClass}
        />
      </div>

      {/* طبيعة الحساب */}
      <div>
        <label className={labelClass}>طبيعة الحساب</label>

        <input
          type="text"
          value={formData.nature === "debit" ? "مدين" : "دائن"}
          readOnly
          className={`${inputClass} cursor-not-allowed bg-slate-100`}
        />

        <p className="mt-1 text-xs text-slate-500">
          يتم تحديد طبيعة الحساب تلقائياً حسب نوع الحساب.
        </p>
      </div>

      {/* تصنيف الحساب */}
      <div>
        <label className={labelClass}>تصنيف الحساب</label>

        <select
          value={formData.isGroup ? "group" : "posting"}
          onChange={(e) => handleGroupChange(e.target.value === "group")}
          className={inputClass}
        >
          <option value="group">حساب تجميعي - لا يقبل القيود</option>

          <option value="posting">حساب نهائي - يقبل القيود</option>
        </select>

        {hasChildren && (
          <p className="mt-1 text-xs text-amber-600">
            هذا الحساب يحتوي على حسابات فرعية، لذلك يجب أن يبقى تجميعياً.
          </p>
        )}
      </div>

      {/* حالة قبول القيود */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">إعدادات الترحيل</p>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-slate-600">قبول القيود المحاسبية</span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              formData.allowPosting
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {formData.allowPosting ? "يقبل القيود" : "لا يقبل القيود"}
          </span>
        </div>
      </div>

      {/* الوصف */}
      <div>
        <label className={labelClass}>وصف الحساب</label>

        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          rows={3}
          placeholder="أدخل وصفاً مختصراً للحساب..."
          className={inputClass}
        />
      </div>

      {/* الأزرار */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
        >
          إلغاء
        </button>

        <button
          type="submit"
          disabled={loading || !formData.code}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "جارٍ الحفظ..."
            : isEditing
              ? "حفظ التعديلات"
              : "إضافة الحساب"}
        </button>
      </div>
    </form>
  );
}
