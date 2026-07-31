import SidebarLayout from "@/components/SidebarLayout";
import AuthProvider from "@/contexts/AuthProvider";
import { ReactNode } from "react";

type LayoutProps = {
    children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
    return (
        <AuthProvider>
            <SidebarLayout>
                {children}
            </SidebarLayout>
        </AuthProvider>
    );
}
