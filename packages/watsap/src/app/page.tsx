"use client";

import LoginGoogleButton from "@/components/auth/LoginGoogleButton";
import { Box, Button, Container, Divider, Grid, Paper, Stack, TextField, Typography, useTheme, Chip, Avatar, Fade, styled } from "@mui/material";
import { WhatsApp as WhatsAppIcon, AutoAwesome as AutoAwesomeIcon, Devices as DevicesIcon, Security as SecurityIcon, Speed as SpeedIcon, Chat as ChatIcon } from "@mui/icons-material";

const RootElement = styled(Box)(({ theme }) => ({
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[50]} 100%)`,
    position: "relative",
    overflow: "hidden",
    "&::before": {
        content: '""',
        position: "absolute",
        top: -100,
        right: -100,
        width: 500,
        height: 500,
        background: `radial-gradient(circle, ${theme.palette.primary.main}10 0%, transparent 70%)`,
        borderRadius: "50%",
        zIndex: 0,
    },
    "&::after": {
        content: '""',
        position: "absolute",
        bottom: -150,
        left: -150,
        width: 600,
        height: 600,
        background: `radial-gradient(circle, ${theme.palette.secondary.main}10 0%, transparent 70%)`,
        borderRadius: "50%",
        zIndex: 0,
    },
}));



type PageProps = {
    // Add props here if needed
};

export default function Page({ }: PageProps) {
    const theme = useTheme();

    const features = [
        { icon: <AutoAwesomeIcon fontSize="small" />, label: "Otomatisasi AI" },
        { icon: <SpeedIcon fontSize="small" />, label: "Respon Cepat" },
        { icon: <DevicesIcon fontSize="small" />, label: "Multi-Perangkat" },
        { icon: <SecurityIcon fontSize="small" />, label: "Enkripsi End-to-End" },
    ];

    return (
        <RootElement>
            <Container maxWidth="lg" sx={{ py: 6, position: "relative", zIndex: 1, maxWidth: { xs: "420px", sm: "600px", md: "1400px" } }}>
                <Grid container spacing={{ xs: 4, md: 6 }} sx={{ alignItems: "center" }}>
                    {/* Left: Welcome Section */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={4} sx={{ mb: { xs: 0, md: 12 } }}>
                            <Typography component={"span"} variant="h1" sx={{ fontWeight: 900, color: "primary.main" }}>
                                Watsap
                            </Typography>
                            {/* Brand Badge */}
                            <Chip icon={<WhatsAppIcon sx={{ color: "#25D366" }} />}
                                label="Otomatisasi Bisnis WhatsApp"
                                sx={{
                                    width: "fit-content",
                                    bgcolor: "#25D36615",
                                    color: "#25D366",
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                    px: 1,
                                    "& .MuiChip-icon": {
                                        color: "#25D366",
                                    },
                                }}
                            />

                            {/* Main Title */}
                            <Box>
                                <Typography
                                    variant="h3"
                                    component="h1"
                                    sx={{
                                        fontWeight: 800,
                                        lineHeight: 1.2,
                                        mb: 1,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #25D366 50%, ${theme.palette.primary.light} 100%)`,
                                        backgroundClip: "text",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    }}>
                                    Kembangkan Bisnis Anda
                                </Typography>
                                <Typography variant="h3" component="h1" sx={{ fontWeight: 800, lineHeight: 1.2, color: "text.primary" }}>
                                    dengan Otomatisasi WhatsApp
                                </Typography>
                            </Box>

                            {/* Description */}
                            <Typography variant="body1" sx={{ maxWidth: "90%", lineHeight: 1.8, color: "text.secondary", fontSize: "1.05rem" }}>
                                Optimalkan komunikasi bisnis Anda dengan otomatisasi
                                WhatsApp berbasis AI. Kirim pesan massal, balas otomatis
                                ke pelanggan, dan kelola percakapan dari ekosistem
                                terpusat yang modern.
                            </Typography>

                            {/* Feature Chips */}
                            <Stack
                                direction="row"
                                spacing={1.5}
                                useFlexGap={true}
                                sx={{ flexWrap: "wrap" }}>
                                {features.map((feature, index) => (
                                    <Chip
                                        key={index}
                                        icon={feature.icon}
                                        label={feature.label}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2,
                                            px: 1,
                                            py: 0.5,
                                            "& .MuiChip-icon": {
                                                color: theme.palette.primary.main,
                                            },
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Stack>
                    </Grid>

                    {/* Right: Login Form */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Box>
                            {/* Form Header */}
                            <Stack spacing={1.25} sx={{ mb: 4 }}>

                                <Typography
                                    variant="h4"
                                    component="h2"
                                    sx={{
                                        fontWeight: 800,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, #25D366)`,
                                        backgroundClip: "text",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    }}>
                                    Selamat Datang Kembali
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    Masuk ke akun Anda untuk kelola bisnis Anda
                                </Typography>
                            </Stack>

                            {/* Login Form */}
                            <Stack component="form" spacing={3} noValidate>
                                <TextField
                                    label="Alamat Email"
                                    type="email"
                                    fullWidth
                                    required
                                    autoComplete="email"
                                    autoFocus
                                    variant="outlined"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 2,
                                        },
                                    }}
                                />
                                <TextField
                                    label="Kata Sandi"
                                    type="password"
                                    fullWidth
                                    required
                                    autoComplete="current-password"
                                    variant="outlined"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 2,
                                        },
                                    }}
                                />
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mt: -1,
                                        flexWrap: "wrap",
                                        gap: 1,
                                    }}>
                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <input type="checkbox" id="remember" />
                                        <Typography
                                            component="label"
                                            htmlFor="remember"
                                            variant="body2"
                                            sx={{ ml: 1, color: "text.secondary", cursor: "pointer" }}>
                                            Ingat saya
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            textTransform: "none",
                                            color: "primary.main",
                                            fontWeight: 600,
                                        }}>
                                        Lupa kata sandi?
                                    </Button>
                                </Box>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    sx={{
                                        py: 1.15,
                                        borderRadius: 2.5,
                                        textTransform: "none",
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, #25D366)`,
                                        "&:hover": {
                                            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, #128C7E)`,
                                        },
                                        boxShadow: `0 8px 24px ${theme.palette.primary.main}40`,
                                    }}>
                                    Masuk
                                </Button>

                                <Divider sx={{ my: 0.5 }}>
                                    <Typography variant="caption" sx={{ px: 2, fontWeight: 500, color: "text.secondary" }}>
                                        atau masuk dengan
                                    </Typography>
                                </Divider>

                                <LoginGoogleButton />

                                {/* Sign Up Link */}
                                <Typography variant="body2" sx={{ textAlign: "center", mt: 1, color: "text.secondary" }}>
                                    Belum punya akun?{" "}
                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            textTransform: "none",
                                            p: 0,
                                            minWidth: "auto",
                                            fontWeight: 700,
                                            color: "primary.main",
                                            "&:hover": {
                                                background: "transparent",
                                                textDecoration: "underline",
                                            },
                                        }}>
                                        Mulai Uji Coba Gratis
                                    </Button>
                                </Typography>
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </RootElement>
    );
}