import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
    
    const { pathname } = request.nextUrl;
    const isPublic = pathname === "/";
    const token = request.cookies.get("token")?.value;

    if (!token) {
        if (isPublic) {
            return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next|favicon.ico).*)",
    ],
};