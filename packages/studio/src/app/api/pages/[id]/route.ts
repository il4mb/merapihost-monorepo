import { NextRequest, NextResponse } from "next/server";
import { serverApi } from "@/libs/api-server";

const TEST_WEB_ID = "6a70c8335ea713aa44dd3209";

export const GET = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    
    const { id } = await params;
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);

    try {
        const response = await serverApi.get(`/v1/websites/${TEST_WEB_ID}/webpages/${id}`, {
            params: searchParams
        });
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