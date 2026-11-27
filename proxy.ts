
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const type = request.cookies.get("type")?.value;

  const path = request.nextUrl.pathname;

  const noCache = (response: NextResponse) => {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0",
    );

    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  };

  // الصفحات العامة التي لا تحتاج إلى تسجيل دخول
  const publicPages = [
    "/register",
  ];

  const isPublicPage = publicPages.some(
    (page) => path === page || path.startsWith(page + "/"),
  );

  if (isPublicPage) {
    return noCache(NextResponse.next());
  }

  // التحقق من تسجيل الدخول
  if (!token || !type) {
    return noCache(
      NextResponse.redirect(new URL("/login", request.url)),
    );
  }

  // تحديد الصفحات المسموح بها حسب نوع الحساب
  let allowedPages: string[] = [];

  if (type === "platform") {
    allowedPages = ["/wezzan"];
  } else if (type === "erp" || type === "owner") {
    allowedPages = ["/erp"];
  }

  // منع الحسابات غير المعروفة
  if (allowedPages.length === 0) {
    return noCache(
      NextResponse.redirect(new URL("/login", request.url)),
    );
  }

  // التحقق من صلاحية الوصول
  const isAllowed = allowedPages.some(
    (page) => path === page || path.startsWith(page + "/"),
  );

  if (!isAllowed) {
    const redirectPath =
      type === "platform"
        ? "/wezzan/dashboard"
        : "/erp/dashboard";

    return noCache(
      NextResponse.redirect(new URL(redirectPath, request.url)),
    );
  }

  return noCache(NextResponse.next());
}

export const config = {
  matcher: [
    "/wezzan/:path*",
    "/erp/:path*",
    "/register/:path*",
  ],
};
