import { Element, useNode } from '@craftjs/core';
import { Card as MuiCard, CardContent as MUICardContent } from '@mui/material';

interface CardContentProps {
    children?: React.ReactNode;
}

export function CardContent({ children }: CardContentProps) {
    const { connectors: { connect } } = useNode();
    return (
        <MUICardContent ref={(ref: HTMLDivElement) => connect(ref)}>
            {children}
        </MUICardContent>
    );
}

CardContent.craft = {
    displayName: 'CardContent',
    props: {},
    related: {},
};

interface CardProps {
    title?: string;
    children?: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
    const { connectors: { connect, drag } } = useNode();

    return (
        <MuiCard ref={(ref) => connect(drag(ref))} sx={{ margin: 2 }}>
            <Element id="card-canvas" is={CardContent} canvas>
                {children}
            </Element>
        </MuiCard>
    );
}

Card.craft = {
    displayName: 'Card',
    props: {
        title: 'Default Title',
    },
    related: {},
};