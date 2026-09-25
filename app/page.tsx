import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft, FiDroplet, FiMapPin, FiTruck } from "react-icons/fi";

import honeyBackground from "@/public/HoenyBackground.png";
import carsBackground from "@/public/CarsBackgroud.png";
import omrahBackground from "@/public/OmrahBackground.png";

const modules = [
  {
    title: "العسل والزيوت الطبيعية",
    description:
      "إدارة منتجات العسل والزيوت والمخزون والمبيعات والمشتريات والعملاء.",
    href: "/dashboard",
    icon: FiDroplet,
    background: honeyBackground,
  },
  {
    title: "بيع وشراء السيارات",
    description:
      "مساحة مخصصة لإدارة عمليات بيع وشراء السيارات. سيتم إعداد هذا الموديل لاحقًا.",
    href: "/cars",
    icon: FiTruck,
    background: carsBackground,
  },
  {
    title: "خدمات الحج والعمرة",
    description:
      "مساحة مخصصة لإدارة خدمات الحج والعمرة. سيتم إعداد هذا الموديل لاحقًا.",
    href: "/hajj-umrah",
    icon: FiMapPin,
    background: omrahBackground,
  },
];

export default function Home() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-5 py-12 md:px-10 md:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <p className="mb-3 text-sm font-bold text-blue-600">
            نظام إدارة الأعمال
          </p>

          <h1 className="text-3xl font-extrabold text-slate-900 md:text-5xl">
            اختر الموديل الذي تريد العمل عليه
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-600">
            ثلاثة أنشطة مختلفة، لكل منها مساحة مخصصة لإدارة عملياته.
          </p>
        </header>

        <section
          aria-label="موديلات النظام"
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                key={module.href}
                href={module.href}
                className="group relative flex min-h-80 flex-col justify-end overflow-hidden rounded-2xl shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Image
                  src={module.background}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />

                {/* طبقة التظليل فوق الصورة */}
                <div className="absolute inset-0 bg-black/40 transition group-hover:bg-black/50" />

                <div className="relative z-10 p-7 text-white">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
                    <Icon size={28} />
                  </div>

                  <h2 className="text-xl font-bold">{module.title}</h2>

                  <p className="mt-3 leading-7 text-white/90">
                    {module.description}
                  </p>

                  <span className="mt-6 inline-flex items-center gap-2 font-semibold">
                    فتح الموديل
                    <FiArrowLeft aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
