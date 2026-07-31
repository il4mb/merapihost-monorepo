import { SxProps, Typography } from "@mui/material";
import { memo } from "react";

interface LabelWidgetProps {
    children: React.ReactNode;
    sx?: SxProps;
}

const LabelWidget = memo(({ children, sx }: LabelWidgetProps) => (
    <Typography component={"span"} sx={{ fontSize: "12px", color: "text.secondary", ...sx }}>
        {children}
    </Typography>
));
LabelWidget.displayName = "LabelWidget";
export default LabelWidget;
