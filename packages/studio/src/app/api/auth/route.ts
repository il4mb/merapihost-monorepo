import { serverApi } from "@/libs/api-server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const publicDomain = process.env.NEXT_PUBLIC_DOMAIN;
if (!publicDomain) {
    throw new Error("NEXT_PUBLIC_DOMAIN is not defined in the environment variables");
}

export const POST = async (request: NextRequest) => {
    try {
        const { token } = await request.json();
        if (!token) {
            return NextResponse.json({
                success: false,
                message: "Token is required"
            }, { status: 400 });
        }
        // Validate the token with the server API
        const response = await serverApi.post(`/v1/auth/login`, { token }, {
            headers: {
                'Content-Type': 'application/json',
            },
        });


        if (!response.data.success) {
            return NextResponse.json({
                success: false,
                message: response.data.message || "Failed to authenticate with server"
            }, { status: 401 });
        }

        const cookieJar = await cookies();
        cookieJar.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
            // Wildcard domain
            // domain: `.${process.env.NEXT_PUBLIC_DOMAIN}`
        });

        return NextResponse.json({
            success: true,
            message: "Token received successfully",
            token
        });
    } catch (error: any) {
        console.error("Error in /api/auth:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "An unexpected error occurred"
        }, { status: 500 });
    }
}