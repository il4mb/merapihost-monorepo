import { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
    const { token } = await request.json(); 
}