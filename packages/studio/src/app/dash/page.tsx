"use client";
import ScreenContainer from "@/components/screens/ScreenContainer";
import ScreenFrame from "@/components/screens/ScreenFrame";
import { Box, Paper, Typography, Fade, Grow, useTheme } from "@mui/material";
import { motion } from "motion/react";

export default function Page() {
    const theme = useTheme();

    return (
        <ScreenContainer>
            <ScreenFrame>
                <Box
                    component={motion.div}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    sx={{
                        position: "absolute",
                        width: "400px",
                        height: "400px",
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${theme.palette.primary.main}10 0%, transparent 70%)`,
                        top: "-100px",
                        right: "-100px",
                        zIndex: 0,
                    }}
                />

                <Box
                    component={motion.div}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2,
                    }}
                    sx={{
                        position: "absolute",
                        width: "300px",
                        height: "300px",
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${theme.palette.secondary.main}10 0%, transparent 70%)`,
                        bottom: "-50px",
                        left: "-50px",
                        zIndex: 0,
                    }}
                />

                <Fade in timeout={800}>
                    <Box
                        sx={{
                            maxWidth: "800px",
                            textAlign: "center",
                            position: "relative",
                            zIndex: 1,
                            px: { xs: 3, sm: 4 },
                        }}>
                        <Grow in timeout={1000}>
                            <Box
                                sx={{
                                    display: "inline-block",
                                    px: 2,
                                    py: 0.5,
                                    mb: 3,
                                    borderRadius: "20px",
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.primary.light}20)`,
                                    border: `1px solid ${theme.palette.primary.main}30`,
                                }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 600,
                                        color: theme.palette.primary.main,
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}>
                                    ✨ Next-Gen Website Builder
                                </Typography>
                            </Box>
                        </Grow>
                        <Box
                            component={motion.div}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}>
                            <Typography
                                variant="h3"
                                component="h1"
                                sx={(theme) => ({
                                    fontWeight: 800,
                                    lineHeight: 1.2,
                                    mb: 2,
                                    fontSize: { xs: "2rem", sm: "2.5rem", md: "3.5rem" },
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #25D366 50%, ${theme.palette.primary.light} 100%)`,
                                    backgroundClip: "text",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundSize: "200% 200%",
                                    animation: "gradientShift 6s ease infinite",
                                    "@keyframes gradientShift": {
                                        "0%": { backgroundPosition: "0% 50%" },
                                        "50%": { backgroundPosition: "100% 50%" },
                                        "100%": { backgroundPosition: "0% 50%" },
                                    },
                                })}>
                                Build stunning websites with drag & drop simplicity
                            </Typography>
                        </Box>
                        <Box
                            component={motion.div}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.4 }}>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: "text.secondary",
                                    fontSize: { xs: "0.9rem", sm: "1.1rem" },
                                    fontWeight: 400,
                                    lineHeight: 1.6,
                                    maxWidth: "600px",
                                    mx: "auto",
                                    mb: 4,
                                }}>
                                Welcome to the Studio! Select a page from the left panel to get started
                                and bring your creative vision to life.
                            </Typography>
                        </Box>
                        <Box
                            component={motion.div}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1.5,
                                justifyContent: "center",
                                mt: 3,
                            }}>
                            {["🎨 Drag & Drop", "⚡ Real-time Preview", "📱 Responsive", "🚀 One-click Deploy"].map((feature, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        px: 2.5,
                                        py: 1,
                                        borderRadius: "20px",
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.primary.light}10)`,
                                        border: `1px solid ${theme.palette.primary.main}20`,
                                        fontSize: "0.85rem",
                                        fontWeight: 500,
                                        color: "text.secondary",
                                        transition: "all 0.3s ease",
                                        "&:hover": {
                                            transform: "translateY(-2px)",
                                            boxShadow: theme.shadows[2],
                                            borderColor: theme.palette.primary.main,
                                        },
                                    }}>
                                    {feature}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Fade>
            </ScreenFrame>
        </ScreenContainer>
    );
}