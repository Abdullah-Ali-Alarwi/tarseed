import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNave";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ترصيد المسحابي",
  description:
    " تطيبق ويب يقوم بجميع العمليات البيع والشراء وادارة المخزون والمبيعات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="ltr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className=" w-full ">
        {/* ================= SIDEBAR ================= */}
        <TopNav />

        {/* ================= MAIN CONTENT ================= */}
        <main>
          <div className=" lg:w-[75%] mt-20 lg:mt-10   w-full">{children}</div>
        </main>
      </body>
    </html>
  );
}
