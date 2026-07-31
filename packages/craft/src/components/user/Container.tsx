import { SxProps, Container as MUIContainer } from "@mui/material";
import { useNode } from "@craftjs/core";

interface ContainerProps {
    sx?: SxProps;
    children?: React.ReactNode;
}
export function Container({ sx, children }: ContainerProps) {
    const { connectors: { connect, drag } } = useNode();
    return (
        <MUIContainer sx={sx} ref={(ref: HTMLDivElement) => connect(drag(ref))}>
            {children}
        </MUIContainer>
    )
}