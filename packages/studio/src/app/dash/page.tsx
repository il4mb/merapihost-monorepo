"use client";
import Editor from "@editor/Editor";
import { useMemo } from "react";
import { colorSchemes, typography, shadows, shape, inputsCustomizations, dataDisplayCustomizations, feedbackCustomizations, navigationCustomizations, surfacesCustomizations } from "@/theme";
import { createTheme } from "@mui/material";

const themeOptions = {
    palette: {
        primary: { main: "#6a90f1" },
        secondary: { main: "#3bedba" },
        background: {
            default: "#fcf8fa",
            paper: "#fdfcfc"
        }
    },
    cssVariables: {
        colorSchemeSelector: "data-color-scheme",
        cssVarPrefix: "template"
    },
    spacing: 7,
    colorSchemes,
    typography,
    shadows,
    shape,
    components: {
        ...inputsCustomizations,
        ...dataDisplayCustomizations,
        ...feedbackCustomizations,
        ...navigationCustomizations,
        ...surfacesCustomizations
    }
}

type PageProps = {

};

export default function Page({ }: PageProps) {

    const theme = useMemo(() => createTheme(themeOptions), []);

    return (
        <div>
            <Editor
                theme={theme as any}
                options={{
                    assets: {
                        endpoint: "/api/assets",
                    }
                }} />
        </div>
    );
}
