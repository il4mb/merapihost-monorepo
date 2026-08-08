import { Toolbar, LeftPanel, RightPanel } from "@/components/panels";
import { Stack } from "@mui/material";
import { Fragment, ReactNode } from "react";

type StudioLayoutProps = {
    children: ReactNode;
};

export default function StudioLayout({ children }: StudioLayoutProps) {
    return (
        <Fragment>
            <Toolbar />
            <Stack
                direction="row"
                sx={{ flex: 1 }}>
                <LeftPanel />
                <Stack sx={{ flex: 1, p: 2 }}>
                    {children}
                </Stack>
                <RightPanel />
            </Stack>
        </Fragment>
    );
}
