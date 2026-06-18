import { IconButton } from "@mui/material";
import { memo } from "react";

type ActionProps = {
    icon: React.ReactNode;
    onClick?: () => void;
    color: "primary" | "default" | "error" | "inherit" | "secondary" | "success" | "warning";
    disabled?: boolean;
};
const ActionWidget = memo(({ icon, onClick, color, disabled }: ActionProps) => (
    <IconButton
        size="small"
        sx={{ width: 20, height: 20, minWidth: 0, minHeight: 0, p: 0, border: 'none' }}
        onClick={onClick}
        color={color}
        disabled={disabled}>
        {icon}
    </IconButton>
));

ActionWidget.displayName = "ActionWidget";
export default ActionWidget;