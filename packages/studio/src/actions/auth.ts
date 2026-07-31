import { cookies } from "next/headers";
export const getCurrentUser = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
        return null;
    }
    try {
        const response = await fetch(`${process.env.API_URL}/v1/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new Error("Failed to fetch user data");
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}