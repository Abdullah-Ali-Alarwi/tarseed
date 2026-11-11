import { NextResponse } from "next/server";


const permissions = {

  platform: [
    "/wezzan",
   
  ],


  owner: [
    "/accounting",
    "/customers",
    "/dashboard",
    "/inventory",
    "/products",
    "/purchases",
    "/sales",
    "/suppliers",
    "/users",
  ],
};

export function proxy(request) {

  const token = request.cookies.get("token")?.value;
  const type = request.cookies.get("type")?.value;

  // الصفحة المطلوبة
  const path = request.nextUrl.pathname;

  // 1. التحقق من تسجيل الدخول
  if (!token || !type) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // 2. التحقق من نوع الحساب
  const allowedPages = permissions[type];

  if (!allowedPages) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // 3. التحقق من صلاحية الوصول للصفحة
  const isAllowed = allowedPages.some((page) => {
    return path === page || path.startsWith(page + "/");
  });

  // 4. منع الدخول إذا لم تكن الصفحة مسموحة
  if (!isAllowed) {
    const redirectPath =
      type === "platform"
        ? "/wezzan/dashboard"
        : "/dashboard";

    return NextResponse.redirect(
      new URL(redirectPath, request.url)
    );
  }

  // 5. السماح بالدخول
  return NextResponse.next();
}

// الصفحات التي نريد تطبيق الحماية عليها
export const config = {
  matcher: [
    "/wezzan/:path*",
    "/accounting/:path*",
    "/customers/:path*",
    "/dashboard/:path*",
    "/inventory/:path*",
    "/products/:path*",
    "/purchases/:path*",
    "/sales/:path*",
    "/suppliers/:path*",
    "/users/:path*",
  ],
};