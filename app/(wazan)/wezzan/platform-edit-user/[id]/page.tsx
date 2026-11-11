"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { FiUser, FiLock, FiSave, FiArrowRight, FiLoader } from "react-icons/fi";

export default function EditUser() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    type: "platform",
  });

  // جلب بيانات المستخدم
  const getUser = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/users/${id}`);

      setForm({
        name: res.data.name || "",
        username: res.data.username || "",
        password: res.data.password || "",
        type: res.data.type || "platform",
      });
    } catch (error) {
      toast.error("تعذر جلب بيانات المستخدم");
      router.push("/wezzan/platform-users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) getUser();
  }, [id]);

  // تحديث الحقول
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // حفظ التعديلات
  const updateUser = async (e) => {
    e.preventDefault();

    if (!form.name || !form.username || !form.password) {
      toast.error("يرجى تعبئة جميع الحقول");
      return;
    }

    try {
      setSaving(true);

      // التأكد من عدم تكرار اسم المستخدم
      const res = await axios.get("http://localhost:3001/users", {
        params: {
          username: form.username,
        },
      });

      const duplicate = res.data.find((user) => String(user.id) !== String(id));

      if (duplicate) {
        toast.error("اسم المستخدم مستخدم بالفعل");
        return;
      }

      // تحديث بيانات المستخدم
      await axios.patch(`http://localhost:3001/users/${id}`, form);

      toast.success("تم تحديث بيانات المستخدم بنجاح");

      router.push("/wezzan/platform-users");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث البيانات");
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-100"
        dir="rtl"
      >
        <FiLoader className="animate-spin text-blue-600 text-3xl" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* العنوان */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/wezzan/platform-users")}
            className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <FiArrowRight size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              تعديل المستخدم
            </h1>

            <p className="text-slate-500 mt-1">
              تعديل بيانات المستخدم ونوع الحساب.
            </p>
          </div>
        </div>

        {/* النموذج */}
        <form
          onSubmit={updateUser}
          className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8"
        >
          <div className="space-y-6">
            {/* الاسم */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الاسم الكامل
              </label>

              <div className="relative">
                <FiUser className="absolute right-3 top-3.5 text-slate-400" />

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="أدخل الاسم الكامل"
                  className="w-full border border-slate-200 rounded-lg py-3 pr-10 pl-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* اسم المستخدم */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                اسم المستخدم
              </label>

              <div className="relative">
                <FiUser className="absolute right-3 top-3.5 text-slate-400" />

                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="أدخل اسم المستخدم"
                  className="w-full border border-slate-200 rounded-lg py-3 pr-10 pl-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                كلمة المرور
              </label>

              <div className="relative">
                <FiLock className="absolute right-3 top-3.5 text-slate-400" />

                <input
                  type="text"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="أدخل كلمة المرور"
                  className="w-full border border-slate-200 rounded-lg py-3 pr-10 pl-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* نوع الحساب */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                نوع الحساب
              </label>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg py-3 px-4 outline-none focus:border-blue-500 bg-white"
              >
                <option value="platform">مدير المنصة</option>

                <option value="erp">صاحب نظام ERP</option>
              </select>
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition"
            >
              {saving ? <FiLoader className="animate-spin" /> : <FiSave />}

              {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/wezzan/platform-users")}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-lg transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
