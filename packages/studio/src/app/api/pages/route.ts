import { NextRequest, NextResponse } from "next/server";
import { serverApi } from "@/libs/api-server";

const TEST_WEB_ID = "6a70c8335ea713aa44dd3209";

export const GET = async (req: NextRequest) => {
    try {
        const response = await serverApi.get(`/v1/websites/${TEST_WEB_ID}/webpages`);
        return NextResponse.json(response.data, {
            status: response.status
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: error.message || "An unexpected error occurred"
        }, { status: 500 });
    }
}