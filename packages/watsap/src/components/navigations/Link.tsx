"use client";

import { Link as MuiLink, LinkProps as MuiLinkProps } from "@mui/material";
import { memo, useCallback } from "react";
import { useClickNavigate } from "@/hooks/useNavigate";

export type CustomLinkProps<C extends React.ElementType> = {
    as?: C;
} 
& Omit<React.ComponentProps<C>, "component"> 
& Omit<MuiLinkProps, "component" | keyof React.ComponentProps<C>>;


function LinkComponent<C extends React.ElementType = "a">(props: CustomLinkProps<C>) {
    const { as, href, onClick, sx, ...rest } = props;
    const [navigate, isActive] = useClickNavigate(href);

    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (onClick) {
            onClick(e as any);
        }

        if (e.defaultPrevented) return;
        return navigate(e);
    }, [onClick, navigate]);

    return (
        <MuiLink
            component={as}
            href={href as string}
            onClick={handleClick}
            sx={{
                color: isActive ? "primary.main" : "text.primary",
                textDecoration: "none",
                "&:hover": {
                    textDecoration: href ? "underline" : "none",
                    color: href ? "primary.main" : "text.primary",
                },
                ...sx,
            }}
            {...(rest as any)}
        />
    );
}

const Link = memo(LinkComponent);
Link.displayName = "Link";
export default Link;
