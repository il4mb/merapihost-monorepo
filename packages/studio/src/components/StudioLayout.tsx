import { Toolbar, LeftPanel, RightPanel } from "@/components/panels";
import StudioProvider from "@/contexts/StudioProvider";
import { Stack } from "@mui/material";
import { Fragment, ReactNode } from "react";

type StudioLayoutProps = {
    children: ReactNode;
};

export default function StudioLayout({ children }: StudioLayoutProps) {
    return (
        <StudioProvider>
            <Fragment>
                <Toolbar />
                <Stack direction="row" sx={{ flex: 1, overflow: "hidden" }}>
                    <LeftPanel />
                    <Stack sx={{ flex: 1, overflow: "visible" }}>
                        {children}
                    </Stack>
                    <RightPanel />
                </Stack>
            </Fragment>
        </StudioProvider>
    );
}
