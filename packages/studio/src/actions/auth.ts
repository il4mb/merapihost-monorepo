import { serverApi } from "@/libs/api-server";
import { cookies } from "next/headers";

export const getCurrentUser = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
        return null;
    }
    try {
        const { data } = await serverApi.get(`/v1/auth/me`);
        console.log("User data fetched successfully:", data);
        return {
            success: Boolean(data.success),
            user: data.user || null,
            message: data.message || null   
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}