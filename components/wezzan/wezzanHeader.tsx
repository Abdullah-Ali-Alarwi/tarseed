"use client";

import { FiBell, FiUser, FiLogOut } from "react-icons/fi";

export default function WazanHeader() {
  return (
    <header className="fixed top-0 left-0 z-40 h-16 w-full lg:w-[85%] bg-slate-900 text-white border-b flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold "> </h2>
      <div className="flex items-center gap-5">
        <button>
          <FiBell size={20} />
        </button>

        <div className="flex items-center gap-2">
          <FiUser size={20} />
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
}
