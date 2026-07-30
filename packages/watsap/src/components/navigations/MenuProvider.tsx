import { Box, Stack, styled, Typography } from "@mui/material";
import Link from "./Link";

const MenuContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    height: '100vh',
    overflow: 'hidden',
}));

const NavContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    width: '250px',
    height: '100vh',
    overflowY: 'auto',
}));

const MenuLink = styled(Link)(({ theme }) => ({
    padding: '4px 16px',
    borderRadius: theme.shape.borderRadius
}));

const LINKS = [
    { label: 'Dashboard', href: '/' },
    { label: 'Rules Based', href: '/rules' },
    { label: 'Users', href: '/users' },
    { label: 'Settings', href: '/settings' },
];

interface MenuProviderProps {
    children?: React.ReactNode;
}

export default function MenuProvider({ children }: MenuProviderProps) {
    return (
        <MenuContainer>
            <NavContainer as="nav">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Sawit Cerdas Admin
                    </Typography>
                </Box>
                <Stack>
                    {LINKS.map((link) => (
                        <MenuLink key={link.href} href={`/dash${link.href}`} variant="body1">
                            {link.label}
                        </MenuLink>
                    ))}
                </Stack>
            </NavContainer>
            <Box component="main" sx={{
                flexGrow: 1, padding: 2, overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
            }}>
                {children}
            </Box>
        </MenuContainer>
    );
}