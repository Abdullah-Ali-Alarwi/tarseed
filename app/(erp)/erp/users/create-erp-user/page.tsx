"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const API = "http://localhost:3001/users";

export default function CreateEmployee() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "accountant",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const createEmployee = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // قراءة بيانات المالك من الكوكيز
      const getCookie = (name) => {
        const value = document.cookie
          .split("; ")
          .find((row) => row.startsWith(name + "="));

        return value ? decodeURIComponent(value.split("=")[1]) : null;
      };

      const type = getCookie("type");
      const ownerId = getCookie("userId");
      const companyId = getCookie("companyId");
      const companyname = getCookie("companyname");

      // التأكد أن المستخدم مالك شركة
      if (type !== "owner" || !ownerId || !companyId) {
        toast.error("غير مصرح لك بإضافة الموظفين");
        return;
      }

      if (!form.name || !form.username || !form.password) {
        toast.error("يرجى تعبئة جميع الحقول");
        return;
      }

      // التأكد من عدم تكرار اسم المستخدم
      const check = await axios.get(API, {
        params: {
          username: form.username,
        },
      });

      if (check.data.length > 0) {
        toast.error("اسم المستخدم مستخدم بالفعل");
        return;
      }

      // إنشاء الموظف وربطه بالشركة والمالك
      await axios.post(API, {
        name: form.name,
        username: form.username,
        password: form.password,

        type: "employee",
        role: form.role,

        companyname,
        companyId,
        ownerId,
      });

      toast.success("تم إضافة الموظف بنجاح");

      router.push("/erp/users");
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة الموظف");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold text-[#0E1F33]">
          إضافة موظف جديد
        </h1>

        <p className="mb-7 text-sm text-gray-500">
          أضف موظفاً إلى شركتك وحدد صلاحياته
        </p>

        <form onSubmit={createEmployee} className="space-y-5">
          <div>
            <label className="mb-2 block font-medium">اسم الموظف</label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="أحمد محمد"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">اسم المستخدم</label>

            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="ahmed"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">كلمة المرور</label>

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="كلمة المرور"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">وظيفة الموظف</label>

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-lg border bg-white p-3 outline-none focus:border-blue-600"
            >
              <option value="accountant">محاسب</option>
              <option value="cashier">كاشير</option>
              <option value="manager">مدير</option>
              <option value="inventory">مسؤول مخزون</option>
              <option value="employee">موظف</option>
            </select>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-lg bg-[#0E1F33] p-3 font-bold text-white hover:bg-blue-900 disabled:opacity-50"
          >
            {loading ? "جاري الإضافة..." : "إضافة الموظف"}
          </button>
        </form>
      </div>
    </main>
  );
}
