import { useNode } from '@craftjs/core';
import { Button as MUIButton } from '@mui/material';

interface ButtonProps {
    size?: 'small' | 'medium' | 'large';
    variant?: 'text' | 'outlined' | 'contained';
    children?: React.ReactNode;
}
export function Button({ size, variant, children }: ButtonProps) {
    const { connectors: { connect, drag } } = useNode();
    return (
        <MUIButton size={size} variant={variant} ref={(ref: HTMLButtonElement) => connect(drag(ref))}>
            {children}
        </MUIButton>
    )
}