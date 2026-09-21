"use client";

import icon from "@/public/navicon2.png";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { FiTrash2, FiBell } from "react-icons/fi";
import { toast } from "sonner";

export default function SideNave() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { name: "الرئيسية", path: "/" },
    { name: "لوحة التحكم", path: "/dashboard" },
    { name: "المبيعات", path: "/sales" },
    { name: "المشتريات", path: "/purchases" },
    { name: "المخزون", path: "/inventory" },
    { name: "العملاء", path: "/customers" },
    { name: "الموردين", path: "/suppliers" },
    { name: "المحاسبة", path: "/accounting" },
    { name: "الحسابات", path: "/accounting/accounts" },
  ];

  // =========================================================
  // ACTIVE LINK
  // =========================================================

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }

    // صفحة الحسابات مستقلة عن صفحة المحاسبة
    if (path === "/accounting/accounts") {
      return pathname === "/accounting/accounts";
    }

    // إذا كان المستخدم داخل إحدى الصفحات الفرعية للمحاسبة
    // لا نجعل رابط المحاسبة فعالاً في صفحة الحسابات
    if (path === "/accounting") {
      return (
        pathname === "/accounting" ||
        (pathname.startsWith("/accounting/") &&
          pathname !== "/accounting/accounts")
      );
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // =========================================================
  // مسح جميع بيانات LocalStorage
  // =========================================================

  const handleClearStorage = () => {
    const confirmed = window.confirm(
      "هل أنت متأكد من مسح جميع بيانات النظام؟\n\n" +
        "سيتم حذف جميع البيانات المحفوظة في LocalStorage، " +
        "بما في ذلك العملاء والموردين والمنتجات والمبيعات والمشتريات والحسابات البنكية وغيرها.\n\n" +
        "⚠️ هذا الإجراء نهائي ولا يمكن التراجع عنه.",
    );

    if (!confirmed) {
      return;
    }

    try {
      // =====================================================
      // مسح جميع بيانات LocalStorage
      // =====================================================

      localStorage.clear();

      // إغلاق القائمة في الجوال
      setMenuOpen(false);

      // رسالة نجاح
      toast.success("تم مسح جميع بيانات النظام", {
        description: "تم حذف جميع البيانات المحفوظة في LocalStorage.",
      });

      // =====================================================
      // إعادة تحميل التطبيق
      // =====================================================

      setTimeout(() => {
        window.location.href = "/";
      }, 700);
    } catch (error) {
      console.error("حدث خطأ أثناء مسح LocalStorage:", error);

      toast.error("تعذر مسح البيانات", {
        description: "حدث خطأ أثناء محاولة مسح البيانات المحفوظة.",
      });
    }
  };

  return (
    <>
      {/* =====================================================
          MOBILE TOP BAR
      ===================================================== */}

      <div className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-gray-700 bg-[#0E1F33] shadow-md lg:hidden">
        <div className="flex h-full items-center justify-between px-3">
          <Link href="/" onClick={() => setMenuOpen(false)}>
            <Image
              src={icon}
              alt="Logo"
              width={48}
              height={48}
              priority
              className="rounded-lg object-contain"
            />
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-700 text-white transition hover:bg-gray-600"
            aria-label="فتح القائمة"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        dir="rtl"
        className={`
          fixed right-0 top-0 z-50
          flex h-screen w-64 flex-col
          border-l border-gray-700
          bg-[#0E1F33]
          shadow-xl
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${menuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* =================================================
            LOGO
        ================================================= */}

        <div className="flex h-16 shrink-0 items-center justify-center border-b border-gray-700 px-4">
          <Link href="/" onClick={() => setMenuOpen(false)}>
            <Image
              src={icon}
              alt="Logo"
              width={58}
              height={58}
              priority
              className="rounded-lg object-contain"
            />
          </Link>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="sidebar-scroll flex-1 overflow-y-auto px-2.5 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold text-gray-500">
            القائمة الرئيسية
          </p>

          <div className="space-y-0.5">
            {links.map((link) => {
              const active = isActive(link.path);

              return (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`
                    group relative
                    flex items-center
                    gap-2.5
                    rounded-lg
                    px-3 py-2
                    text-[12px]
                    font-medium
                    transition-all
                    duration-200
                    ${
                      active
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-300 hover:bg-blue-950 hover:text-white"
                    }
                  `}
                >
                  {/* Active Indicator */}

                  {active && (
                    <span
                      className="
                        absolute right-0 top-1/2
                        h-7 w-1
                        -translate-y-1/2
                        rounded-l-full
                        bg-white
                      "
                    />
                  )}

                  {/* Icon */}

                  <span
                    className={`
                      flex h-8 w-8 shrink-0
                      items-center justify-center
                      rounded-lg
                      transition
                      ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-gray-700/50 group-hover:bg-white/20"
                      }
                    `}
                  >
                    {getIcon(link.path)}
                  </span>

                  {/* Name */}

                  <span className="truncate">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* =================================================
            BOTTOM SECTION
        ================================================= */}

        <div className="shrink-0 border-t border-gray-700 p-3">
          {/* Notifications */}

          <button
            type="button"
            className="
              mb-1.5 flex w-full
              items-center gap-2.5
              rounded-lg
              px-2.5 py-2
              text-gray-300
              transition
              hover:bg-gray-700
            "
          >
            <div
              className="
                relative flex h-8 w-8
                shrink-0 items-center
                justify-center
                rounded-lg
                bg-gray-700
              "
            >
              <FiBell className="h-4 w-4" />

              <span
                className="
                  absolute -right-1 -top-1
                  h-2.5 w-2.5
                  rounded-full
                  border-2
                  border-[#0E1F33]
                  bg-red-500
                "
              />
            </div>

            <span className="text-[12px]">الإشعارات</span>
          </button>

          {/* =================================================
              CLEAR ALL LOCAL STORAGE
          ================================================= */}

          <button
            type="button"
            onClick={handleClearStorage}
            className="
              mb-2 flex w-full
              items-center gap-2.5
              rounded-lg
              px-2.5 py-2
              text-red-400
              transition
              hover:bg-red-500/10
              hover:text-red-300
            "
          >
            <div
              className="
                flex h-8 w-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-red-500/10
              "
            >
              <FiTrash2 className="h-4 w-4" />
            </div>

            <span className="text-[12px]">مسح جميع البيانات</span>
          </button>

          {/* =================================================
              USER
          ================================================= */}

          <div
            className="
              flex items-center
              gap-2.5
              rounded-lg
              bg-gray-700/50
              p-2.5
            "
          >
            <div
              className="
                flex h-9 w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-gray-200
                text-sm
              "
            >
              👤
            </div>

            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-white">
                عبدالله
              </p>

              <p className="text-[10px] text-gray-400">المدير</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   SIDEBAR ICONS
========================================================= */

function getIcon(path: string) {
  const iconClass = "w-4 h-4";

  switch (path) {
    /* =====================================================
       الرئيسية
    ===================================================== */

    case "/":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10.5L12 3l9 7.5M5 9v11h14V9"
          />
        </svg>
      );

    /* =====================================================
       لوحة التحكم
    ===================================================== */

    case "/dashboard":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 13h6V4H4v9zm10 7h6V4h-6v16zM4 20h6v-3H4v3z"
          />
        </svg>
      );

    /* =====================================================
       المبيعات
    ===================================================== */

    case "/sales":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h18l-2 13H5L3 3zm2 13v3h14v-3M9 21h6"
          />
        </svg>
      );

    /* =====================================================
       المشتريات
    ===================================================== */

    case "/purchases":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 4h2l2 12h11l3-9H6M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
          />
        </svg>
      );

    /* =====================================================
       المخزون
    ===================================================== */

    case "/inventory":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 7l8-4 8 4-8 4-8-4zm0 0v10l8 4 8-4V7M12 11v10"
          />
        </svg>
      );

    /* =====================================================
       العملاء
    ===================================================== */

    case "/customers":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
          />
        </svg>
      );

    /* =====================================================
       الموردين
    ===================================================== */

    case "/suppliers":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7h11v10H3V7zm11 3h4l3 3v4h-7v-7zM7 20a2 2 0 100-4 2 2 0 000 4zm11 0a2 2 0 100-4 2 2 0 000 4z"
          />
        </svg>
      );

    /* =====================================================
       المحاسبة
    ===================================================== */

    case "/accounting":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 19h16M6 17V9m4 8V5m4 12v-6m4 6V3"
          />
        </svg>
      );

    /* =====================================================
       الحسابات
    ===================================================== */

    case "/accounting/accounts":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 5h16M4 12h16M4 19h16"
          />

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 5v14M16 5v14"
          />
        </svg>
      );

    /* =====================================================
       التقارير
    ===================================================== */

    case "/reports":
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 2h9l5 5v15H6V2zm9 0v6h6M9 13h6m-6 4h6"
          />
        </svg>
      );

    default:
      return null;
  }
}
