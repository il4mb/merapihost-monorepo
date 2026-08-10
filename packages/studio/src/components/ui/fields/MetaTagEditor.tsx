"use client";
import { Button, Alert, CircularProgress, Typography, Box } from "@mui/material";
import { useState, useEffect, useCallback, useRef } from "react";
import CodeMirror, { ViewUpdate } from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { linter, lintGutter, Diagnostic } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { useIsDark } from "@/theme";

// 1. Define allowed tags in a <head> element
const ALLOWED_HEAD_TAGS = new Set(['meta', 'link', 'script', 'style', 'title', 'base', 'noscript']);

// 2. Custom Linter: Walks the HTML syntax tree and flags unallowed tags
const headTagLinter = linter((view) => {
    const diagnostics: Diagnostic[] = [];

    syntaxTree(view.state).cursor().iterate(node => {
        // "TagName" is the identifier Lezer (CodeMirror's parser) uses for HTML tags
        if (node.name === "TagName") {
            const tagName = view.state.sliceDoc(node.from, node.to).toLowerCase();
            if (!ALLOWED_HEAD_TAGS.has(tagName)) {
                diagnostics.push({
                    from: node.from,
                    to: node.to,
                    severity: "error",
                    message: `<${tagName}> is not supported inside the document <head>.`
                });
            }
        }
    });

    return diagnostics;
});

// 3. Custom Autocomplete: Overrides default HTML autocomplete to only suggest head tags
function headCompletions(context: CompletionContext) {
    const word = context.matchBefore(/<\w*/);
    if (!word) return null;
    if (word.from === word.to && !context.explicit) return null;

    return {
        from: word.from + 1, // Start completion after the '<' character
        options: [
            { label: "meta", type: "keyword", apply: 'meta name="" content="">', detail: "Metadata" },
            { label: "link", type: "keyword", apply: 'link rel="stylesheet" href="">', detail: "External Resource" },
            { label: "script", type: "keyword", apply: 'script src=""></script>', detail: "Executable Script" },
            { label: "style", type: "keyword", apply: 'style>\n  \n</style>', detail: "Internal CSS" },
            { label: "title", type: "keyword", apply: 'title></title>', detail: "Document Title" },
            { label: "base", type: "keyword", apply: 'base href="">', detail: "Base URL" },
            { label: "noscript", type: "keyword", apply: 'noscript>\n  \n</noscript>', detail: "Fallback content" },
        ]
    };
}


type MetaTagEditorProps = {
    pageId?: string | null;
    disabled?: boolean;
    onChange?: (meta: string) => void;
}
export default function MetaTagEditor({ pageId, disabled, onChange }: MetaTagEditorProps) {

    const isDark = useIsDark();
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState("");
    const [error, setError] = useState<string | null>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const fetchMeta = useCallback(async () => {
        if (!pageId) {
            setMeta("");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/pages/${pageId}?fields=meta`).then(res => res.json());
            if (!response.success) {
                throw new Error(response.message || "Failed to fetch meta");
            }
            setMeta(response.data?.meta || "");
            if (onChangeRef.current) {
                onChangeRef.current(response.data?.meta || "");
            }
        } catch (error: any) {
            setError(error.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }, [pageId]);

    const handleMetaChange = useCallback((val: string, viewUpdate: ViewUpdate) => {
        if (disabled) return;
        setMeta(val);
        if (onChangeRef.current) {
            onChangeRef.current(val);
        }
    }, [disabled]);

    useEffect(() => {
        fetchMeta();
    }, [fetchMeta]);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Metadata
            </Typography>
            {error ? (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    action={
                        <Button color="inherit" size="small" onClick={fetchMeta}>
                            Retry
                        </Button>
                    }>
                    {error}
                </Alert>
            ) : (
                <Box sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    overflow: "hidden",
                    pointerEvents: disabled || loading ? "none" : "all",
                    opacity: disabled || loading ? 0.5 : 1,
                    transition: "opacity 0.3s",
                    position: "relative"
                }}>
                    <CodeMirror
                        theme={isDark ? "dark" : "light"}
                        value={meta}
                        height="300px"
                        extensions={[
                            html(),
                            lintGutter(),
                            headTagLinter,
                            autocompletion({ override: [headCompletions] })
                        ]}
                        onChange={handleMetaChange}
                    />
                    {loading && (
                        <Box sx={{
                            position: "absolute",
                            top: 0, left: 0, right: 0, bottom: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            backdropFilter: "blur(12px)",
                        }}>
                            <CircularProgress size={24} />
                            <Typography variant="body2" color="textSecondary">
                                Loading...
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    )
}