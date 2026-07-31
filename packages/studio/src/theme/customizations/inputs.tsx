"use client"
import { alpha, Theme, Components } from "@mui/material/styles";
import { toggleButtonGroupClasses } from "@mui/material/ToggleButtonGroup";
import { toggleButtonClasses } from "@mui/material/ToggleButton";
import { brand, gray, green, orange, red } from "../themePrimitives";
import { blue } from "@mui/material/colors";
import { Square, SquareCheck } from "lucide-react";

const colors = { primary: brand, secondary: gray, success: green, error: red, warning: orange, info: blue } as const;
type ColorName = keyof typeof colors;
const colorsName = Object.keys(colors) as ColorName[];

const getColor = (name: ColorName) => {
    return colors[name] || brand;
}

export const inputsCustomizations: Components<Theme> = {
    MuiButtonBase: {
        defaultProps: {
            disableTouchRipple: true,
            disableRipple: true
        },
        styleOverrides: {
            root: ({ theme }) => ({
                boxSizing: "border-box",
                transition: "all 100ms ease-in",
                borderRadius: theme.shape.borderRadius,
                "&:focus-visible": {
                    outline: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                    outlineOffset: "2px",
                }
            }),
        },
    },

    MuiButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                boxShadow: "none",
                textTransform: "none",
                borderRadius: theme.shape.borderRadius,
                transition: 'all 0.2s ease-out',
                lineHeight: '1.2rem',
                variants: [
                    ...['text', 'outlined', 'contained'].flatMap((variant) => colorsName.map((name) => {
                        const color = getColor(name);
                        return {
                            props: {
                                variant,
                                color: name
                            },
                            style: {

                                // text
                                color: color[500],

                                // contained
                                ...(variant == "contained" && {
                                    transition: 'all 0.2s ease-out',
                                    color: ["error", "primary"].includes(name) ? "#fff" : color[900],
                                    background: color[400],
                                    backgroundSize: '100%',
                                    backgroundPosition: '0% 0%',
                                    "&:hover": {
                                        color: '#fff',
                                        background: color[500],
                                    },
                                    "&:active": {
                                        backgroundSize: '200%',
                                        backgroundPosition: '100% 0%',
                                    }
                                }),


                                // outlined
                                ...(variant == "outlined" && {
                                    borderColor: color[500],
                                    background: `${color[50]}`,
                                    "&:hover": {
                                        color: color[50],
                                        background: color[500],
                                    }
                                }),


                                ...theme.applyStyles('dark', {

                                    // text - dark
                                    color: color[300],


                                    // contained - dark
                                    ...(variant == "contained" && {
                                        transition: 'all 0.2s ease-out',
                                        color: color[100],
                                        backgroundSize: '100%',
                                        backgroundPosition: '0% 0%',
                                        "&:hover": {
                                            color: '#fff',
                                            backgroundSize: '200%',
                                            backgroundPosition: '0% 0%',
                                        },
                                        "&:active": {
                                            backgroundSize: '200%',
                                            backgroundPosition: '100% 0%',
                                        }
                                    }),



                                    // outlined - dark
                                    ...(variant == "outlined" && {

                                        borderColor: color[500],
                                        background: alpha(color[300], 0.1),
                                        "&:hover": {
                                            color: color[50],
                                            background: color[500],
                                        }
                                    }),
                                }),

                            }
                        }
                    })
                    ),
                    {
                        props: {
                            disabled: true,
                        },
                        style: {
                            opacity: 0.5
                        }
                    }
                ],
            }),
        },
    },
    MuiListItemButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                "&.Mui-selected": {
                    color: '#ffc000',
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 80%)`,
                    "& .MuiListItemIcon-root": {
                        color: '#ffc000',
                    }
                }
            })
        }
    },
    MuiIconButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                boxShadow: "none",
                borderRadius: theme.shape.borderRadius,
                textTransform: "none",
                fontWeight: theme.typography.fontWeightMedium,
                letterSpacing: 0,
                border: "1px solid ",
                borderColor: '#6662',
                minWidth: 0,
                padding: 0,
                width: '2rem',
                height: '2rem',
                transition: 'all 0.2s ease-out',
                "& svg": { fontSize: "1rem" },
                variants: [
                    {
                        props: {
                            size: "small",
                        },
                        style: {
                            width: "1.55rem",
                            height: "1.55rem",
                            padding: "0.25rem",
                        },
                    },
                    {
                        props: {
                            size: "large",
                        },
                        style: {
                            width: "2.5rem",
                            height: "2.5rem",
                        },
                    },
                    ...colorsName.map((name) => {
                        const colors = getColor(name);
                        const color = colors[["error", "primary"].includes(name) ? 300 : 400];

                        return {
                            props: {
                                color: name
                            },
                            style: {
                                background: alpha(color, 0.05),
                                color: color,
                                fill: color,
                                border: '1px solid',
                                borderColor: alpha(color, 0.4),
                                "&:hover": {
                                    background: alpha(color, 0.5),
                                }
                            }
                        }
                    })
                ],
            }),
        },
    },
    MuiToggleButtonGroup: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: theme.shape.borderRadius,
                boxShadow: `0 4px 16px ${alpha(gray[400], 0.2)}`,
                [`& .${toggleButtonGroupClasses.selected}`]: {
                    color: brand[500],
                },
                ...theme.applyStyles("dark", {
                    [`& .${toggleButtonGroupClasses.selected}`]: {
                        color: "#fff",
                    },
                    boxShadow: `0 4px 16px ${alpha(brand[700], 0.5)}`,
                }),
            }),
        },
    },
    MuiToggleButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                padding: "12px 16px",
                textTransform: "none",
                borderRadius: theme.shape.borderRadius,
                fontWeight: 500,
                ...theme.applyStyles("dark", {
                    color: gray[400],
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
                    [`&.${toggleButtonClasses.selected}`]: {
                        color: brand[300],
                    },
                }),
            }),
        },
    },
    MuiCheckbox: {
        defaultProps: {
            disableRipple: true,
            icon: (
                <Square
                    size={22}
                    style={{
                        position: "absolute",
                    }}
                />
            ),
            checkedIcon: (
                <SquareCheck
                    size={22}
                    style={{
                        position: "absolute",
                    }}
                />
            ),
            // indeterminateIcon: <CircleX />,
        },
        styleOverrides: {
            root: ({ theme }) => ({
                margin: 10,
                height: 16,
                width: 16,
                borderRadius: 4,
                border: "none",
                backgroundColor: alpha(gray[100], 0.4),
                transition: "border-color, background-color, 120ms ease-in",

                "&.Mui-focusVisible": {
                    outline: `3px solid ${alpha(brand[500], 0.5)}`,
                    outlineOffset: "2px",
                },
                "&.Mui-checked": {
                    boxShadow: `none`,
                    backgroundColor: brand[100],
                    "&:hover": {
                        backgroundColor: brand[100],
                    },
                },
                ...theme.applyStyles("dark", {
                    backgroundColor: alpha(gray[900], 0.8),
                    "&.Mui-focusVisible": {
                        outline: `3px solid ${alpha(brand[500], 0.5)}`,
                        outlineOffset: "2px",
                    },
                    "&.Mui-checked": {
                        boxShadow: `none`,
                        backgroundColor: brand[800],
                        "&:hover": {
                            backgroundColor: brand[800],
                        },
                    },
                }),
                variants: [
                    ...colorsName.map((name) => {
                        const colors = getColor(name);
                        const color = colors[["error", "primary"].includes(name) ? 300 : 400];

                        return {
                            props: {
                                color: name
                            },
                            style: {
                                backgroundColor: alpha(color, 0.05),
                                color: color,
                                fill: color,
                                border: '1px solid',
                                borderColor: alpha(color, 0.4),
                                "&:hover": {
                                    backgroundColor: alpha(color, 0.5),
                                },
                                "&.Mui-checked": {
                                    boxShadow: `none`,
                                    backgroundColor: alpha(color, 0.05),
                                    "&:hover": {
                                        backgroundColor: alpha(color, 0.5),
                                    },
                                },
                                "&.Mui-focusVisible": {
                                    outline: `3px solid ${alpha(color, 0.5)}`,
                                    outlineOffset: "2px",
                                },
                            }
                        }
                    })
                ]
            }),
        },
    },

    MuiFormControl: {
        styleOverrides: {
            root: ({ theme }) => ({
                "& .MuiFormLabel-root[data-shrink=false]": {
                    top: "1.25rem",
                    transform: "translate(14px, -50%)",
                    transition: 'all 0.2s ease',
                    "&.MuiInputLabel-sizeSmall": {
                        top: "1rem"
                    }
                },
                "&:has(.Mui-focused), &:has(.MuiFormLabel-filled)": {
                    "& .MuiFormLabel-root[data-shrink=true]": {
                        top: 0,
                        transform: "translate(14px, -50%) scale(0.758)",
                        ...theme.applyStyles("dark", {
                            color: "white"
                        })
                    }
                },
                "&:has( .MuiInputAdornment-positionStart)": {
                    "& .MuiFormLabel-root[data-shrink=true]": {
                        top: 0,
                        transform: "translate(14px, -50%) scale(0.758)",
                    }
                },
                "& .MuiPickersInputBase-root": {
                    height: "2.6rem",
                },

                // input select
                "&:has( .MuiSelect-root)": {
                    "& .MuiSelect-root": {
                        borderColor: 'transparent',

                        "& .MuiSelect-select": {
                            display: 'block !important',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            paddingRight: '2.2px !important',
                        }
                    }
                }
            })
        }
    },
    MuiInputBase: {
        styleOverrides: {
            root: {
                border: "none",
            },
            input: ({ theme }) => ({
                color: "#000",
                "&::placeholder": {
                    opacity: 0.7,
                },
                ...theme.applyStyles("dark", {
                    color: "#fff",
                    "&::placeholder": {
                        opacity: 0.6,
                        color: "white",
                    },
                }),
            }),
        },
    },
    MuiOutlinedInput: {
        styleOverrides: {
            input: {
                padding: 0,
            },
            root: ({ theme, ownerState }) => {

                const { multiline } = ownerState;

                return {
                    padding: "8px 12px",
                    color: theme.palette.text.primary,
                    borderRadius: theme.shape.borderRadius,
                    transition: "border 120ms ease-in",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: blue[800],
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: blue[800],
                    },
                    ...(multiline && {
                        textAlign: 'left',
                        verticalAlign: 'top'
                    }),
                    ...theme.applyStyles("dark", {
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: blue[400],
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: blue[400],
                            color: "white"
                        },
                    }),
                    variants: [
                        {
                            props: {
                                size: "small",
                            },
                            style: {
                                height: multiline ? "unset" : "2rem",
                                "& .MuiFormLabel-root": {
                                    top: "0%",
                                    transform: "translate(14px, -50%)",
                                    transition: 'all 0.2s ease'
                                },
                            },
                        },
                        {
                            props: {
                                size: "medium",
                            },
                            style: {
                                height: multiline ? "unset" : "2.5rem",
                            },
                        },
                    ],
                }
            },
            notchedOutline: ({ theme }) => ({
                border: `1px solid`,
                transition: "border 120ms ease-in",
                borderColor: alpha(gray[600], 0.4),
                ...theme.applyStyles("dark", {
                    borderColor: alpha("#818181", 0.5),
                }),
            }),
        },
    },

    MuiInputAdornment: {
        styleOverrides: {
            root: ({ theme }) => ({
                color: theme.palette.grey[500],
                ...theme.applyStyles("dark", {
                    color: theme.palette.grey[400],
                }),
            }),
        },
    },

    MuiFormLabel: {
        styleOverrides: {
            root: ({ theme }) => ({
                typography: theme.typography.caption,
                transform: "translate(14px, 0px)",
                transition: "color 120ms ease-in",
                color: theme.palette.text.secondary,
                "&.Mui-focused": {
                    color: gray[800],
                },
            }),
        },
    },

    MuiSelect: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: theme.shape.borderRadius,
                border: `0px solid`,
                transition: "border 120ms ease-in",
                "&:hover": {
                    borderColor: gray[800],
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: gray[800],
                    }
                },
                variants: [
                    {
                        props: {
                            size: "small",
                        },
                        style: {
                            height: "2.25rem",
                        },
                    },
                ],


            })
        }
    },

    MuiAutocomplete: {
        styleOverrides: {
            root: ({ theme }) => ({
                "& > .MuiFormControl-root > .MuiFormLabel-root[data-shrink=false]": {
                    top: '50%',
                    transform: 'translate(14px, -50%) scale(1)'
                },
                "& > .MuiFormControl-root > .MuiFormLabel-root[data-shrink=true]": {
                    top: 0,
                    transform: "translate(14px, -50%) scale(0.758)",
                }
            })
        }
    }
};