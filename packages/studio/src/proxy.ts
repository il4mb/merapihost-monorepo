import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./actions/auth";

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

    try {

        const result = await getCurrentUser();
        console.log("Current user result:", result);
        if (!result.success) {
            if (isPublic) {
                return NextResponse.next();
            }
            return NextResponse.redirect(new URL("/", request.url));
        }

        if (pathname === "/") {
            return NextResponse.redirect(new URL("/dash", request.url));
        }

        return NextResponse.next();
    } catch {
        const response = isPublic ? NextResponse.next() : NextResponse.redirect(new URL("/", request.url));
        response.cookies.delete("token");
        return response;
    }
}

export const config = {
    matcher: [
        "/((?!api|_next|favicon.ico).*)",
    ],
};