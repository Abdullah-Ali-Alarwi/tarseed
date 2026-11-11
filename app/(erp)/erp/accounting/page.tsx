import Link from "next/link";
import {
  FiBookOpen,
  FiFileText,
  FiLayers,
  FiList,
  FiArrowLeft,
  FiPlusCircle,
  FiGitBranch,
  FiClipboard,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
} from "react-icons/fi";

const accountingModules = [
  {
    title: "دليل الحسابات",
    description: "إدارة الحسابات المالية وتصنيفها وتنظيمها ضمن شجرة الحسابات.",
    href: "/erp/accounting/accounts",
    icon: FiBookOpen,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "إضافة حساب",
    description: "إنشاء حساب مالي جديد وتحديد نوعه ورقمه والحساب الأب.",
    href: "/erp/accounting/accounts/create",
    icon: FiPlusCircle,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "شجرة الحسابات",
    description: "عرض الهيكل الهرمي للحسابات الرئيسية والفرعية.",
    href: "/erp/accounting/accounts/tree",
    icon: FiGitBranch,
    color: "bg-violet-50 text-violet-600",
  },
  {
    title: "القيود اليومية",
    description: "إدارة القيود المحاسبية ومراجعة العمليات المدينة والدائنة.",
    href: "/erp/accounting/journals",
    icon: FiFileText,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "الأرصدة الافتتاحية",
    description: "إدخال الأرصدة الافتتاحية للحسابات عند بدء استخدام النظام.",
    href: "/erp/accounting/opening-entries",
    icon: FiLayers,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    title: "إضافة أرصدة افتتاحية",
    description: "إدخال أرصدة الحسابات المدينة والدائنة.",
    href: "/erp/accounting/opening-entries/create",
    icon: FiPlusCircle,
    color: "bg-teal-50 text-teal-600",
  },
  {
    title: "دفتر الأستاذ العام",
    description: "متابعة حركة كل حساب ومعرفة الرصيد والحركات المالية.",
    href: "/erp/accounting/ledger",
    icon: FiList,
    color: "bg-rose-50 text-rose-600",
  },
];

const quickActions = [
  {
    title: "قيد يومية جديد",
    description: "تسجيل عملية محاسبية جديدة.",
    href: "/erp/accounting/journals",
    icon: FiFileText,
  },
  {
    title: "إضافة حساب",
    description: "إضافة حساب إلى دليل الحسابات.",
    href: "/erp/accounting/accounts/create",
    icon: FiPlusCircle,
  },
  {
    title: "الأرصدة الافتتاحية",
    description: "إعداد أرصدة بداية الفترة.",
    href: "/erp/accounting/opening-entries",
    icon: FiClipboard,
  },
];

export default function AccountingPage() {
  return (
    <div dir="rtl" className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <FiDollarSign size={16} />
            <span>النظام المالي</span>
            <span>/</span>
            <span className="text-slate-700">المحاسبة</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            الإدارة المحاسبية
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            إدارة الحسابات والقيود اليومية والحركات المالية للمنشأة.
          </p>
        </div>

        <Link
          href="/erp/accounting/journals"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          <FiPlusCircle size={17} />
          قيد يومية جديد
        </Link>
      </div>

      {/* Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#0E1F33] to-[#193B5C] p-6 text-white shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <FiTrendingUp size={23} />
          </div>

          <h2 className="text-xl font-bold">مرحباً بك في الإدارة المحاسبية</h2>

          <p className="mt-2 text-sm leading-7 text-slate-200">
            من هنا يمكنك إدارة الحسابات المالية، وتسجيل القيود اليومية، ومتابعة
            أرصدة الحسابات والحركات المحاسبية، بالإضافة إلى إعداد الأرصدة
            الافتتاحية.
          </p>
        </div>

        <div className="pointer-events-none absolute -left-8 -top-12 h-56 w-56 rounded-full border-[30px] border-white/5" />
        <div className="pointer-events-none absolute -left-20 -bottom-32 h-64 w-64 rounded-full border-[30px] border-white/5" />
      </div>

      {/* Modules */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              الوحدات المحاسبية
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              اختر القسم الذي تريد العمل عليه.
            </p>
          </div>

          <FiActivity className="text-slate-400" size={20} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accountingModules.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <Icon size={21} />
                  </div>

                  <FiArrowLeft
                    size={18}
                    className="text-slate-300 transition group-hover:-translate-x-1 group-hover:text-slate-700"
                  />
                </div>

                <h3 className="mt-4 font-bold text-slate-800 transition group-hover:text-blue-700">
                  {item.title}
                </h3>

                <p className="mt-2 min-h-[42px] text-xs leading-6 text-slate-500">
                  {item.description}
                </p>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <span className="text-xs font-medium text-slate-500 group-hover:text-blue-600">
                    الانتقال إلى القسم
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-800">الوصول السريع</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Icon size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {action.description}
                  </p>
                </div>

                <FiArrowLeft className="shrink-0 text-slate-400" size={17} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Information */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-blue-600">
            <FiActivity size={19} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800">ملاحظة محاسبية</h3>

            <p className="mt-1 text-xs leading-6 text-slate-600">
              تأكد من إعداد دليل الحسابات والأرصدة الافتتاحية قبل البدء في تسجيل
              العمليات المحاسبية اليومية، حتى تكون التقارير المالية والأرصدة
              الناتجة دقيقة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
