import { NextRequest, NextResponse } from "next/server";
import { serverApi } from "@/libs/api-server";
import { z } from "zod";

const TEST_DRIVE_ID = "6a722772e2e33ad34320e974"; // Replace with your actual test drive ID    

// Included the preprocess trick from earlier so "?folderId=null" resolves to actual null
const querySchema = z.object({
    folderId: z.preprocess(
        (val) => (val === "null" || val === "undefined" || val === "" ? null : val),
        z.string().nullable().optional().default(null)
    ),
});

export const GET = async (req: NextRequest) => {
    try {
        // 1. Convert URLSearchParams to a plain JSON object
        const searchParams = Object.fromEntries(req.nextUrl.searchParams);
        
        // 2. Parse the plain object
        const { folderId } = querySchema.parse(searchParams);
        
        console.log("Fetching assets for folderId:", folderId);
        
        const response = await serverApi.get(`/v1/drives/${TEST_DRIVE_ID}?folderId=${folderId}`);
        
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