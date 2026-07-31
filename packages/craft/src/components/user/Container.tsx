import { SxProps, Container as MUIContainer } from "@mui/material";

interface ContainerProps {
    sx?: SxProps;
    children?: React.ReactNode;
}
export function Container({ sx, children }: ContainerProps) {

    return (
        <MUIContainer sx={sx}>
            {children}
        </MUIContainer>
    )
}