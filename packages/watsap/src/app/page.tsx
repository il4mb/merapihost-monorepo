"use client";
import LoginGoogleButton from "@/components/auth/LoginGoogleButton";
import { Box, Button, Container, Divider, Grid, Stack, TextField, Typography, useTheme, Chip, styled, alpha, InputAdornment, IconButton, FormControlLabel, Checkbox, CircularProgress } from "@mui/material";
import { WhatsApp as WhatsAppIcon, AutoAwesome as AutoAwesomeIcon, Devices as DevicesIcon, Security as SecurityIcon, Speed as SpeedIcon } from "@mui/icons-material";
import { useCallback, useEffect, useState, useRef } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { enqueueSnackbar } from "notistack";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/libs/firebase";
import { useNavigate } from "@/hooks/useNavigate";
import { useValidator } from "@/hooks/useValidator";
import { loginSchema } from "@/libs/schemas/auth";

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

const features = [
    { icon: <AutoAwesomeIcon fontSize="small" />, label: "Otomatisasi AI" },
    { icon: <SpeedIcon fontSize="small" />, label: "Respon Cepat" },
    { icon: <DevicesIcon fontSize="small" />, label: "Multi-Perangkat" },
    { icon: <SecurityIcon fontSize="small" />, label: "Enkripsi End-to-End" },
];

type PageProps = {
    // Add props here if needed
};

export default function Page({ }: PageProps) {
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const redirect = useNavigate();
    const [loading, setLoading] = useState({
        email: false,
        google: false,
    });
    const theme = useTheme();
    const [data, setData] = useState({
        showPassword: false,
        email: "",
        password: "",
        rememberMe: false,
    });

    const { validate, errors, isValid } = useValidator(loginSchema, { email: data.email, password: data.password }, false);

    const updateData = <T extends keyof typeof data>(field: T, value: typeof data[T]) => {
        setData((prevData) => {
            const newData = { ...prevData, [field]: value };
            validate({
                email: newData.email,
                password: newData.password,
            });
            return newData;
        });
    };


    const handleLogin = useCallback(async () => {
        if (!isValid) {
            enqueueSnackbar("Data tidak valid. Silakan periksa kembali.", { variant: "error" });
            return;
        }
        const formData = {
            email: data.email,
            password: data.password,
            rememberMe: data.rememberMe,
        }
        try {
            setLoading((prev) => ({ ...prev, email: true }));
            const result = await signInWithEmailAndPassword(auth, formData.email, formData.password);

            console.log("Login successful with user:", result.user);
            enqueueSnackbar("Berhasil login!", { variant: "success" });
            redirect("/dash");
        } catch (error) {
            enqueueSnackbar("Gagal login. Silakan coba lagi.", { variant: "error" });
        } finally {
            setLoading((prev) => ({ ...prev, email: false }));
        }
    }, [data.email, data.password, data.rememberMe, redirect]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent default form submission behavior

            // If email has an error or is empty, focus it
            if (errors.email || !data.email) {
                emailRef.current?.focus();
                return;
            }

            // If password has an error or is empty, focus it
            if (errors.password || !data.password) {
                passwordRef.current?.focus();
                return;
            }

            // If no errors, try to submit
            handleLogin();
        }
    }, [errors.email, errors.password, data.email, data.password, handleLogin]);

    const shouldDisabledInteraction = loading.email || loading.google;


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
                            <Stack sx={{ gap: 3 }}>
                                <TextField
                                    inputRef={emailRef}
                                    onKeyDown={handleKeyDown}
                                    disabled={shouldDisabledInteraction}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    label="Alamat Email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => updateData("email", e.target.value)}
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
                                    inputRef={passwordRef}
                                    onKeyDown={handleKeyDown}
                                    disabled={shouldDisabledInteraction}
                                    error={!!errors.password}
                                    helperText={errors.password}
                                    label="Kata Sandi"
                                    type={data.showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={(e) => updateData("password", e.target.value)}
                                    fullWidth
                                    required
                                    autoComplete="current-password"
                                    variant="outlined"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 2,
                                        },
                                    }}
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={() => updateData("showPassword", !data.showPassword)}>
                                                        {data.showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mt: -2,
                                        flexWrap: "wrap",
                                        gap: 1,
                                        px: 1
                                    }}>
                                    <FormControlLabel
                                        label="Ingat saya"
                                        control={
                                            <Checkbox
                                                disabled={shouldDisabledInteraction}
                                                checked={data.rememberMe}
                                                onChange={(e) => updateData("rememberMe", e.target.checked)}
                                            />
                                        }
                                    />

                                    <Button
                                        variant="text"
                                        size="small"
                                        disabled={shouldDisabledInteraction}
                                        sx={{
                                            color: "primary.main",
                                            fontWeight: 600,
                                        }}>
                                        Lupa kata sandi?
                                    </Button>
                                </Box>

                                {/* LOGIN BUTTON */}
                                <Box
                                    component="button"
                                    disabled={shouldDisabledInteraction}
                                    onClick={handleLogin}
                                    sx={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        width: "100%",
                                        color: "#fff",
                                        textAlign: "center",
                                        py: 1.75,
                                        borderRadius: 2.5,
                                        textTransform: "none",
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, #25D366)`,
                                        backgroundSize: "1000% auto",
                                        transition: "all 0.15s ease-in-out",
                                        boxShadow: `0 8px 24px ${theme.palette.primary.main}40`,
                                        border: "none",
                                        outline: "none",
                                        "&:hover": {
                                            backgroundSize: "100% auto",
                                            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.5)}`,
                                        },
                                        "&:disabled": {
                                            background: theme.palette.action.disabledBackground,
                                            color: theme.palette.action.disabled,
                                            boxShadow: "none",
                                        },
                                    }}>
                                    {loading.email && (
                                        <CircularProgress size={20} sx={{ mr: 1, color: "text.secondary" }} />
                                    )}
                                    {loading.email ? "Memproses..." : "Masuk"}
                                </Box>

                                <Divider sx={{ my: 0.5 }}>
                                    <Typography variant="caption" sx={{ px: 2, fontWeight: 500, color: "text.secondary" }}>
                                        atau masuk dengan
                                    </Typography>
                                </Divider>

                                <LoginGoogleButton
                                    disabled={shouldDisabledInteraction}
                                    onBeforeLogin={() => setLoading((prev) => ({ ...prev, google: true }))}
                                    onAfterLogin={() => setLoading((prev) => ({ ...prev, google: false }))}
                                />

                                {/* Sign Up Link */}
                                <Typography variant="body2" sx={{ textAlign: "center", mt: 1, color: "text.secondary" }}>
                                    Belum punya akun?{" "}
                                    <Button
                                        disabled={shouldDisabledInteraction}
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