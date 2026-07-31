import { Button as MUIButton } from '@mui/material';

interface ButtonProps {
    size?: 'small' | 'medium' | 'large';
    variant?: 'text' | 'outlined' | 'contained';
    children?: React.ReactNode;
}
export function Button({ size, variant, children }: ButtonProps) {

    return (
        <MUIButton size={size} variant={variant}>
            {children}
        </MUIButton>
    )
}