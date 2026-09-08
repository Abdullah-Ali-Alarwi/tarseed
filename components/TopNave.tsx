"use client";

import icon from "@/public/navicon2.png";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FiTrash2, FiBell } from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

export default function TopNave() {
  const [menuOpen, setMenuOpen] = useState(false);

  const clearStore = useERPStore((state) => state.clearStore);

  const links = [
    { name: "الرئيسية", path: "/" },
    { name: "لوحة التحكم", path: "/dashboard" },
    { name: "المبيعات", path: "/sales" },
    { name: "المشتريات", path: "/purchases" },
    { name: "المخزون", path: "/inventory" },
    { name: "العملاء", path: "/customers" },
    { name: "الموردين", path: "/suppliers" },
    { name: "القيود", path: "/accounting" },
    { name: "التقارير", path: "/reports" },
  ];

  const handleClearStorage = () => {
    const confirmed = window.confirm(
      "هل أنت متأكد من مسح جميع بيانات النظام؟\n\nسيتم حذف جميع المنتجات والعملاء والموردين والمبيعات والمشتريات والقيود اليومية.",
    );

    if (!confirmed) return;

    clearStore();

    setMenuOpen(false);

    alert("تم مسح جميع بيانات النظام بنجاح");
  };

  return (
    <>
      {/* =====================================================
          MOBILE TOP BAR
      ===================================================== */}
      <div className="lg:hidden fixed top-0 right-0 left-0 z-50 h-14 bg-[#0E1F33] border-b border-gray-700 shadow-md">
        <div className="h-full px-3 flex items-center justify-between">
          {/* Logo */}
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

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition"
            aria-label="فتح القائمة"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
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
                className="w-5 h-5"
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
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside
        dir="rtl"
        className={`
          fixed top-0 right-0 z-50
          h-screen w-64
          bg-[#0E1F33]
          border-l border-gray-700
          shadow-xl
          flex flex-col
          transition-transform duration-300 ease-in-out

          lg:translate-x-0

          ${menuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* =================================================
            LOGO
        ================================================= */}
        <div className="h-16 shrink-0 px-4 border-b border-gray-700 flex items-center justify-center">
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
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500">
            القائمة الرئيسية
          </p>

          <div className="space-y-0.5">
            {links.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setMenuOpen(false)}
                className="
                  flex items-center
                  gap-2.5
                  px-3 py-2
                  rounded-lg
                  text-[12px]
                  font-medium
                  text-gray-300
                  hover:bg-blue-950
                  hover:text-white
                  transition-all
                  duration-200
                  group
                "
              >
                {/* Icon */}
                <span
                  className="
                    w-8 h-8
                    shrink-0
                    rounded-lg
                    bg-gray-700/50
                    group-hover:bg-white/20
                    flex items-center
                    justify-center
                    transition
                  "
                >
                  {getIcon(link.path)}
                </span>

                {/* Link Name */}
                <span className="truncate">{link.name}</span>
              </Link>
            ))}
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
              w-full
              flex items-center
              gap-2.5
              px-2.5 py-2
              rounded-lg
              text-gray-300
              hover:bg-gray-700
              transition
              mb-1.5
            "
          >
            <div
              className="
                relative
                w-8 h-8
                shrink-0
                rounded-lg
                bg-gray-700
                flex items-center
                justify-center
              "
            >
              <FiBell className="w-4 h-4" />

              <span
                className="
                  absolute
                  -top-1
                  -right-1
                  w-2.5
                  h-2.5
                  bg-red-500
                  border-2
                  border-[#0E1F33]
                  rounded-full
                "
              />
            </div>

            <span className="text-[12px]">الإشعارات</span>
          </button>

          {/* Clear LocalStorage */}
          <button
            type="button"
            onClick={handleClearStorage}
            className="
              w-full
              flex items-center
              gap-2.5
              px-2.5 py-2
              rounded-lg
              text-red-400
              hover:bg-red-500/10
              hover:text-red-300
              transition
              mb-2
            "
          >
            <div
              className="
                w-8 h-8
                shrink-0
                rounded-lg
                bg-red-500/10
                flex items-center
                justify-center
              "
            >
              <FiTrash2 className="w-4 h-4" />
            </div>

            <span className="text-[12px]">مسح جميع البيانات</span>
          </button>

          {/* User */}
          <div
            className="
              flex items-center
              gap-2.5
              p-2.5
              rounded-lg
              bg-gray-700/50
            "
          >
            <div
              className="
                w-9 h-9
                shrink-0
                rounded-full
                bg-gray-200
                flex items-center
                justify-center
                text-sm
              "
            >
              👤
            </div>

            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">
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
    /* ================= HOME ================= */
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

    /* ================= DASHBOARD ================= */
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

    /* ================= SALES ================= */
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

    /* ================= PURCHASES ================= */
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

    /* ================= INVENTORY ================= */
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

    /* ================= CUSTOMERS ================= */
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

    /* ================= SUPPLIERS ================= */
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

    /* ================= ACCOUNTING ================= */
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

    /* ================= REPORTS ================= */
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
