"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiBriefcase,
  FiUsers,
  FiDollarSign,
  FiFileText,
  FiTruck,
  FiSettings,
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiUser,
  FiMapPin,
  FiActivity,
  FiPackage,
} from "react-icons/fi";

type Company = {
  id?: string;
  name?: string;
  companyName?: string;
  commercialName?: string;
  logo?: string;
  country?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
};

type AuthUser = {
  id?: string;
  name?: string;
  fullName?: string;
  username?: string;
  role?: string;
  jobTitle?: string;
  companyId?: string;
  companyName?: string;
};

const API_URL = "http://localhost:3001";

const shortcuts = [
  {
    title: "المشتريات",
    description: "إدارة فواتير وعمليات الشراء.",
    href: "/erp/purchases",
    icon: FiShoppingBag,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "المبيعات",
    description: "متابعة فواتير وعمليات البيع.",
    href: "/erp/sales",
    icon: FiShoppingCart,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "المخزون",
    description: "إدارة الأصناف والمستودعات والحركات.",
    href: "/erp/inventory",
    icon: FiBriefcase,
    color: "bg-violet-50 text-violet-600",
  },
  {
    title: "المستخدمون",
    description: "إدارة المستخدمين والصلاحيات.",
    href: "/erp/users",
    icon: FiUsers,
    color: "bg-orange-50 text-orange-600",
  },
  {
    title: "المحاسبة",
    description: "الحسابات والقيود والعمليات المالية.",
    href: "/erp/accounting",
    icon: FiDollarSign,
    color: "bg-teal-50 text-teal-600",
  },
  {
    title: "التقارير",
    description: "عرض التقارير المالية والتشغيلية.",
    href: "/erp/reports",
    icon: FiFileText,
    color: "bg-rose-50 text-rose-600",
  },
  {
    title: "النقل والشحن",
    description: "إدارة عمليات النقل والشحن.",
    href: "/erp/transport",
    icon: FiTruck,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    title: "الإعدادات",
    description: "إدارة إعدادات الشركة والنظام.",
    href: "/erp/tools",
    icon: FiSettings,
    color: "bg-slate-100 text-slate-700",
  },
];

export default function ERPHomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedUser = localStorage.getItem("authUser");

        if (!storedUser) {
          setLoading(false);
          return;
        }

        const parsedUser: AuthUser = JSON.parse(storedUser);
        setUser(parsedUser);

        if (parsedUser.companyId) {
          try {
            const response = await fetch(
              `${API_URL}/companies/${parsedUser.companyId}`,
            );

            if (response.ok) {
              const companyData = await response.json();
              setCompany(companyData);
            }
          } catch (error) {
            console.error("Company loading error:", error);
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      setCurrentDate(
        now.toLocaleDateString("ar-YE", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );

      setCurrentTime(
        now.toLocaleTimeString("ar-YE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };

    updateDateTime();

    const timer = setInterval(updateDateTime, 60000);

    return () => clearInterval(timer);
  }, []);

  const companyName =
    company?.companyName ||
    company?.name ||
    company?.commercialName ||
    user?.companyName ||
    "شركتي";

  const userName = user?.fullName || user?.name || user?.username || "المستخدم";

  const roleName = user?.jobTitle || user?.role || "مستخدم النظام";

  return (
    <div dir="rtl" className="space-y-6 pb-8 m-5">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#0E1F33] to-[#193B5C] p-6 text-white shadow-sm">
        <div className="relative z-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-slate-200">
                <FiHome size={14} />
                <span>نظام إدارة موارد المؤسسة ERP</span>
              </div>

              <h1 className="text-2xl font-bold md:text-3xl">
                أهلاً وسهلاً، {userName}
              </h1>

              <p className="mt-2 text-sm leading-7 text-slate-300">
                {loading
                  ? "جاري تحميل بيانات الشركة..."
                  : `مرحباً بك في نظام إدارة ${companyName}. نتمنى لك تجربة عمل مميزة ومنظمة.`}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs text-slate-200">
                  <FiCalendar size={15} />
                  <span>{currentDate || "..."}</span>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs text-slate-200">
                  <FiClock size={15} />
                  <span>{currentTime || "..."}</span>
                </div>
              </div>
            </div>

            <div className="flex h-24 w-24 shrink-0 items-center justify-center self-center rounded-2xl border border-white/10 bg-white/10 md:h-28 md:w-28">
              {company?.logo ? (
                <img
                  src={company.logo}
                  alt="شعار الشركة"
                  className="h-20 w-20 rounded-xl object-contain"
                />
              ) : (
                <FiBriefcase size={48} className="text-white/80" />
              )}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -left-8 -top-12 h-56 w-56 rounded-full border-[30px] border-white/5" />
        <div className="pointer-events-none absolute -left-20 -bottom-32 h-64 w-64 rounded-full border-[30px] border-white/5" />
      </div>

      {/* Company and User Information */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Company Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiBriefcase size={20} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  بيانات الشركة
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  معلومات المنشأة الحالية
                </p>
              </div>
            </div>

            <Link
              href="/erp/tools/company"
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              تعديل البيانات
            </Link>
          </div>

          <div className="space-y-4">
            <InfoRow
              icon={<FiBriefcase />}
              label="اسم الشركة"
              value={companyName}
            />

            <InfoRow
              icon={<FiMapPin />}
              label="الموقع"
              value={
                [company?.city, company?.address].filter(Boolean).join(" - ") ||
                "غير محدد"
              }
            />

            <InfoRow
              icon={<FiUser />}
              label="رقم الشركة"
              value={company?.id || user?.companyId || "غير محدد"}
            />

            <InfoRow
              icon={<FiActivity />}
              label="العملة"
              value={company?.currency || "غير محددة"}
            />
          </div>
        </div>

        {/* User Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <FiUser size={20} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-800">
                بيانات المستخدم
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                معلومات الحساب الحالي
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <InfoRow icon={<FiUser />} label="اسم المستخدم" value={userName} />

            <InfoRow
              icon={<FiActivity />}
              label="اسم الدخول"
              value={user?.username || "غير محدد"}
            />

            <InfoRow
              icon={<FiBriefcase />}
              label="المسمى الوظيفي"
              value={roleName}
            />

            <InfoRow
              icon={<FiShieldIcon />}
              label="نوع الحساب"
              value={user?.role || "غير محدد"}
            />
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              اختصارات النظام
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              الوصول السريع إلى الأقسام الرئيسية.
            </p>
          </div>

          <FiPackage size={21} className="text-slate-400" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <Icon size={21} />
                  </div>

                  <FiArrowLeft
                    size={18}
                    className="mt-1 text-slate-300 transition group-hover:-translate-x-1 group-hover:text-slate-700"
                  />
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-800 group-hover:text-blue-700">
                  {item.title}
                </h3>

                <p className="mt-2 min-h-[36px] text-xs leading-6 text-slate-500">
                  {item.description}
                </p>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <span className="text-xs font-medium text-slate-500 group-hover:text-blue-600">
                    فتح القسم
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <FiSettings size={15} />
          <span>نظام إدارة موارد المؤسسة</span>
        </div>

        <span>Powered by Wezzan</span>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="text-slate-400">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>

      <span className="max-w-[60%] truncate text-left text-xs font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function FiShieldIcon() {
  return <FiActivity />;
}
