import AuthProvider from "@/contexts/AuthProvider";
import { ReactNode } from "react";

type LayoutProps = {
    children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}
