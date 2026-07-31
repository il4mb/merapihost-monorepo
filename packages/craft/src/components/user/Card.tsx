import { Card as MuiCard, CardContent, Typography } from '@mui/material';

interface CardProps {
    title?: string;
    children?: React.ReactNode;
}
export function Card({ title, children }: CardProps) {

    return (
        <MuiCard>
            <CardContent>
                {title && <Typography variant="h5">{title}</Typography>}
                {children}
            </CardContent>
        </MuiCard>
    )
}