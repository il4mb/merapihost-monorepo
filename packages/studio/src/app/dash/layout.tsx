import AuthProvider from "@/contexts/AuthProvider";
import StudioLayout from "@/components/StudioLayout";
import { ReactNode, Suspense } from "react";

type LayoutProps = {
    children: ReactNode;
};

export default async function Layout({ children }: LayoutProps) {
    return (
        <AuthProvider>
            <StudioLayout>
                <Suspense fallback={<p>Loading...</p>}>
                    {children}
                </Suspense>
            </StudioLayout>
        </AuthProvider>
    );
}