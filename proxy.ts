import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const type = request.cookies.get("type")?.value;
  const role = request.cookies.get("role")?.value;

  const path = request.nextUrl.pathname;

  // إعداد منع التخزين المؤقت
  const noCache = (response: NextResponse) => {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );

    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  };

  // 1. التحقق من تسجيل الدخول
  if (!token || !type) {
    return noCache(
      NextResponse.redirect(new URL("/login", request.url))
    );
  }

  // 2. تحديد الصلاحيات
  let allowedPages: string[] = [];

  if (type === "platform") {
    allowedPages = [
      "/wezzan",
    ];
  }

 else if (type === "erp" || type === "owner") {
  allowedPages = [
    "/erp",
  ];
}

  // 3. منع الحسابات غير المعروفة
  if (allowedPages.length === 0) {
    return noCache(
      NextResponse.redirect(new URL("/login", request.url))
    );
  }

  // 4. التحقق من صلاحية الصفحة
  const isAllowed = allowedPages.some((page) => {
    return (
      path === page ||
      path.startsWith(page + "/")
    );
  });

  // 5. إعادة توجيه المستخدم عند عدم امتلاكه الصلاحية
  if (!isAllowed) {
    const redirectPath =
      type === "platform"
        ? "/wezzan/dashboard"
        : "/erp/dashboard";

    return noCache(
      NextResponse.redirect(
        new URL(redirectPath, request.url)
      )
    );
  }

  // 6. السماح بالدخول
  return noCache(NextResponse.next());
}

// الصفحات المحمية
export const config = {
  matcher: [
    "/wezzan/:path*",
    "/erp/:path*",
  ],
};