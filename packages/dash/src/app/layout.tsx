import { ReactNode } from "react";
import { Theme } from "@merapihost/theme";

type LayoutProps = {
    children?: ReactNode
};

export default function Layout({ children }: LayoutProps) {
    return (
        <html lang="en">
            <body>
                <Theme>
                    {children}
                </Theme>
            </body>
        </html>
    );
}
