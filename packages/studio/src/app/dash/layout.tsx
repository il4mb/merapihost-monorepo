import AuthProvider from "@/contexts/AuthProvider";
import StudioLayout from "@/components/StudioLayout";
import { ReactNode } from "react";

type LayoutProps = {
    children: ReactNode;
};

export default async function Layout({ children }: LayoutProps) {
    return (
        <AuthProvider>
            <StudioLayout>
                {children}
            </StudioLayout>
        </AuthProvider>
    );
}
