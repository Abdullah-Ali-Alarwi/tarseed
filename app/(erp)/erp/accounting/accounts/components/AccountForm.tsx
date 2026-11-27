"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import type {
  Account,
  AccountFormData,
  AccountId,
  AccountType,
} from "../types";

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
  type: "asset",
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

const sameId = (
  a: AccountId | null | undefined,
  b: AccountId | null | undefined,
) => String(a ?? "") === String(b ?? "");

function isDescendant(
  accounts: Account[],
  accountId: AccountId,
  parentId: AccountId,
  visited = new Set<AccountId>(),
): boolean {
  if (visited.has(accountId)) return false;

  visited.add(accountId);

  const account = accounts.find((item) => sameId(item.id, accountId));

  if (!account || !account.parentId) return false;

  if (sameId(account.parentId, parentId)) return true;

  return isDescendant(accounts, account.parentId, parentId, visited);
}

function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((a, b) =>
    a.code.localeCompare(b.code, "en", { numeric: true }),
  );
}

function generateAccountCode(
  accounts: Account[],
  parentId: AccountId,
  currentId?: AccountId,
): string {
  const parent = accounts.find((account) => sameId(account.id, parentId));

  if (!parent) return "";

  const parentCode = String(parent.code);

  if (parentCode.length >= 5) return "";

  const children = accounts.filter(
    (account) =>
      sameId(account.parentId, parentId) && !sameId(account.id, currentId),
  );

  if (children.length >= 9) return "";

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

      return /^[1-9]$/.test(suffix) ? Number(suffix) : null;
    })
    .filter((number): number is number => number !== null);

  for (let number = 1; number <= 9; number++) {
    if (!usedNumbers.includes(number)) {
      return parentCode + number;
    }
  }

  return "";
}

function getAvailableParents(
  accounts: Account[],
  type: AccountType,
  currentId?: AccountId,
): Account[] {
  return sortAccounts(
    accounts.filter((account) => {
      if (
        account.isActive === false ||
        !account.isGroup ||
        account.allowPosting
      ) {
        return false;
      }

      if (account.type !== type) return false;

      if (sameId(account.id, currentId)) return false;

      if (currentId && isDescendant(accounts, account.id, currentId)) {
        return false;
      }

      if (String(account.code).length >= 5) return false;

      const childrenCount = accounts.filter((child) =>
        sameId(child.parentId, account.id),
      ).length;

      return childrenCount < 9;
    }),
  );
}

export default function AccountForm({
  accounts,
  initialData,
  onSubmit,
  onCancel,
}: Props) {
  // تحميل بيانات الحساب عند التعديل دون استخدام useEffect
  const [formData, setFormData] = useState<AccountFormData>(() => {
    if (!initialData) {
      return { ...emptyForm };
    }

    return {
      code: initialData.code,
      name: initialData.name,
      nameEn: initialData.nameEn ?? "",
      type: initialData.type,
      parentId: initialData.parentId ?? null,
      nature: initialData.nature,
      isGroup: initialData.isGroup,
      allowPosting: initialData.allowPosting,
      description: initialData.description ?? "",
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(initialData);

  const hasChildren = useMemo(() => {
    if (!initialData) return false;

    return accounts.some((account) => sameId(account.parentId, initialData.id));
  }, [accounts, initialData]);

  const availableParents = useMemo(
    () => getAvailableParents(accounts, formData.type, initialData?.id),
    [accounts, formData.type, initialData?.id],
  );

  const selectedParent = useMemo(
    () => accounts.find((account) => sameId(account.id, formData.parentId)),
    [accounts, formData.parentId],
  );

  const selectedParentChildrenCount = useMemo(() => {
    if (!formData.parentId) return 0;

    return accounts.filter((account) =>
      sameId(account.parentId, formData.parentId),
    ).length;
  }, [accounts, formData.parentId]);

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

  const handleParentChange = (value: string) => {
    const parentId: AccountId | null = value || null;

    if (!parentId) {
      setFormData((prev) => ({
        ...prev,
        parentId: null,
        code: "",
      }));

      setError("");
      return;
    }

    const parent = accounts.find((account) => sameId(account.id, parentId));

    if (!parent) {
      setError("الحساب الأب غير موجود.");
      return;
    }

    if (!parent.isGroup || parent.allowPosting) {
      setError("لا يمكن اختيار حساب نهائي كحساب أب.");
      return;
    }

    if (parent.isActive === false) {
      setError("لا يمكن اختيار حساب أب غير فعال.");
      return;
    }

    if (parent.type !== formData.type) {
      setError("يجب أن يكون نوع الحساب مطابقاً لنوع الحساب الأب.");
      return;
    }

    const newCode = generateAccountCode(accounts, parentId);

    if (!newCode) {
      setError("لا يمكن إضافة حساب جديد تحت هذا الحساب.");
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

    const parent = accounts.find((account) =>
      sameId(account.id, formData.parentId),
    );

    if (!parent) {
      setError("الحساب الأب غير موجود.");
      return false;
    }

    if (parent.isActive === false || !parent.isGroup || parent.allowPosting) {
      setError("الحساب الأب لا يسمح بإضافة حسابات تحته.");
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
        sameId(account.parentId, formData.parentId) &&
        !sameId(account.id, initialData?.id),
    );

    if (siblings.length >= 9) {
      setError("لا يمكن إضافة أكثر من 9 حسابات تحت الحساب الأب.");
      return false;
    }

    if (!formData.code) {
      setError("تعذر توليد رقم الحساب.");
      return false;
    }

    const duplicateCode = accounts.some(
      (account) =>
        account.code === formData.code && !sameId(account.id, initialData?.id),
    );

    if (duplicateCode) {
      setError("رقم الحساب موجود مسبقاً.");
      return false;
    }

    const duplicateName = accounts.some(
      (account) =>
        sameId(account.parentId, formData.parentId) &&
        account.name.trim() === formData.name.trim() &&
        !sameId(account.id, initialData?.id),
    );

    if (duplicateName) {
      setError("يوجد حساب بنفس الاسم تحت الحساب الأب المختار.");
      return false;
    }

    if (hasChildren && !formData.isGroup) {
      setError("الحساب الذي يحتوي على أبناء يجب أن يكون تجميعياً.");
      return false;
    }

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
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
      </div>

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
          اختر الحساب التجميعي الذي تريد إضافة الحساب تحته.
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

      <div>
        <label className={labelClass}>رقم الحساب</label>

        <input
          type="text"
          value={formData.code}
          readOnly
          placeholder="يتم توليد رقم الحساب تلقائياً"
          className={`${inputClass} cursor-not-allowed bg-slate-100 font-semibold`}
        />
      </div>

      <div>
        <label className={labelClass}>
          اسم الحساب بالعربية <span className="text-red-500">*</span>
        </label>

        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="مثال: السيارات"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>اسم الحساب بالإنجليزية</label>

        <input
          type="text"
          value={formData.nameEn}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, nameEn: e.target.value }))
          }
          placeholder="Account name in English"
          dir="ltr"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>طبيعة الحساب</label>

        <input
          type="text"
          value={formData.nature === "debit" ? "مدين" : "دائن"}
          readOnly
          className={`${inputClass} cursor-not-allowed bg-slate-100`}
        />
      </div>

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
      </div>

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
