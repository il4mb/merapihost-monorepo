import { Monaco } from "@monaco-editor/react"

export function setupElementSCSS(monaco: Monaco) {
    if (monaco.languages.getLanguages().some(v => v.id === "element-scss")) {
        return
    }

    monaco.languages.register({
        id: "element-scss"
    })

    // 1. Language Configuration (Auto-closing brackets, quotes, etc.)
    monaco.languages.setLanguageConfiguration("element-scss", {
        brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"]
        ],
        autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"', notIn: ["string"] },
            { open: "'", close: "'", notIn: ["string"] }
        ],
        surroundingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: "'", close: "'" }
        ]
    })

    // 2. Syntax Highlighting
    monaco.languages.setMonarchTokensProvider("element-scss", {
        tokenizer: {
            root: [
                [/\/\*/, "comment", "@comment"],
                [/\/\/.*$/, "comment"],
                [/&[\w:\-.#()]+/, "type.identifier"],
                [/[a-zA-Z-]+(?=\s*:)/, "attribute.name"],
                [/:/, "delimiter"],
                [/#[0-9a-fA-F]+/, "number.hex"],
                [/[0-9]+(px|em|rem|vh|vw|%|s|ms|deg)?/, "number"],
                [/\{/, "@brackets"],
                [/\}/, "@brackets"],
                [/".*?"/, "string"],
                [/'.*?'/, "string"],
                [/[;,.]/, "delimiter"]
            ],
            comment: [
                [/[^\/*]+/, "comment"],
                [/\*\//, "comment", "@pop"],
                [/[\/*]/, "comment"]
            ]
        }
    })

    // 3. Autocompletion
    monaco.languages.registerCompletionItemProvider("element-scss", {
        triggerCharacters: [":", "&", ".", "-"],
        provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position)
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            }

            const propertySuggestions = PROPERTIES.map(prop => ({
                label: prop,
                kind: monaco.languages.CompletionItemKind.Property,
                insertText: `${prop}: $0;`,
                range,
                insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            }))

            const pseudoSuggestions = PSEUDO_SELECTORS.map(pseudo => {
                const isFunction = pseudo.endsWith("()")
                const insertText = isFunction
                    ? `${pseudo.slice(0, -1)}$1) {\n\t$0\n}`
                    : `${pseudo} {\n\t$0\n}`

                return {
                    label: pseudo,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText,
                    range,
                    insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                }
            })

            return { suggestions: [...propertySuggestions, ...pseudoSuggestions] }
        }
    })

    // 4. Color Provider (Enables the visual color picker widget)
    monaco.languages.registerColorProvider("element-scss", {
        provideDocumentColors(model) {
            const text = model.getValue()
            const colors = []

            // Regex for HEX colors
            const hexRegex =
                /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/gi
            let match

            while ((match = hexRegex.exec(text)) !== null) {
                const hex = match[1]
                let r = 0,
                    g = 0,
                    b = 0,
                    a = 1

                if (hex.length === 3 || hex.length === 4) {
                    r = parseInt(hex[0] + hex[0], 16) / 255
                    g = parseInt(hex[1] + hex[1], 16) / 255
                    b = parseInt(hex[2] + hex[2], 16) / 255
                    if (hex.length === 4) a = parseInt(hex[3] + hex[3], 16) / 255
                } else {
                    r = parseInt(hex.substring(0, 2), 16) / 255
                    g = parseInt(hex.substring(2, 4), 16) / 255
                    b = parseInt(hex.substring(4, 6), 16) / 255
                    if (hex.length === 8) a = parseInt(hex.substring(6, 8), 16) / 255
                }

                const startPos = model.getPositionAt(match.index)
                const endPos = model.getPositionAt(match.index + match[0].length)

                colors.push({
                    range: {
                        startLineNumber: startPos.lineNumber,
                        startColumn: startPos.column,
                        endLineNumber: endPos.lineNumber,
                        endColumn: endPos.column
                    },
                    color: { red: r, green: g, blue: b, alpha: a }
                })
            }

            // Regex for RGB/RGBA colors
            const rgbRegex =
                /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/gi
            while ((match = rgbRegex.exec(text)) !== null) {
                const startPos = model.getPositionAt(match.index)
                const endPos = model.getPositionAt(match.index + match[0].length)

                colors.push({
                    range: {
                        startLineNumber: startPos.lineNumber,
                        startColumn: startPos.column,
                        endLineNumber: endPos.lineNumber,
                        endColumn: endPos.column
                    },
                    color: {
                        red: parseInt(match[1]) / 255,
                        green: parseInt(match[2]) / 255,
                        blue: parseInt(match[3]) / 255,
                        alpha: match[4] !== undefined ? parseFloat(match[4]) : 1
                    }
                })
            }

            return { colors }
        },

        provideColorPresentations(model, colorInfo) {
            const { red, green, blue, alpha } = colorInfo.color
            const toHex = (n: number) => {
                const hex = Math.round(n * 255).toString(16)
                return hex.length === 1 ? "0" + hex : hex
            }

            let hexValue = `#${toHex(red)}${toHex(green)}${toHex(blue)}`
            if (alpha !== 1) {
                hexValue += toHex(alpha) // append alpha if not fully opaque
            }

            return [{ label: hexValue }]
        }
    })

    // 5. Theme
    monaco.editor.defineTheme("element-theme", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "attribute.name", foreground: "9CDCFE" },
            { token: "type.identifier", foreground: "C586C0" },
            { token: "number", foreground: "B5CEA8" },
            { token: "number.hex", foreground: "B5CEA8" },
            { token: "string", foreground: "CE9178" },
            { token: "comment", foreground: "6A9955" }
        ],
        colors: {
            // Optional: You can tweak editor UI colors here if needed
        }
    })
}

export const PROPERTIES = [
    "align-content",
    "align-items",
    "align-self",
    "animation",
    "appearance",
    "backdrop-filter",
    "background",
    "background-color",
    "background-image",
    "background-position",
    "background-repeat",
    "background-size",
    "border",
    "border-bottom",
    "border-color",
    "border-left",
    "border-radius",
    "border-right",
    "border-style",
    "border-top",
    "border-width",
    "bottom",
    "box-shadow",
    "box-sizing",
    "color",
    "column-gap",
    "cursor",
    "display",
    "flex",
    "flex-basis",
    "flex-direction",
    "flex-flow",
    "flex-grow",
    "flex-shrink",
    "flex-wrap",
    "float",
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "gap",
    "grid",
    "grid-area",
    "grid-column",
    "grid-row",
    "grid-template-columns",
    "grid-template-rows",
    "height",
    "justify-content",
    "justify-items",
    "justify-self",
    "left",
    "letter-spacing",
    "line-height",
    "list-style",
    "margin",
    "margin-bottom",
    "margin-left",
    "margin-right",
    "margin-top",
    "max-height",
    "max-width",
    "min-height",
    "min-width",
    "opacity",
    "outline",
    "overflow",
    "overflow-x",
    "overflow-y",
    "padding",
    "padding-bottom",
    "padding-left",
    "padding-right",
    "padding-top",
    "pointer-events",
    "position",
    "right",
    "row-gap",
    "text-align",
    "text-decoration",
    "text-overflow",
    "text-shadow",
    "text-transform",
    "top",
    "transform",
    "transform-origin",
    "transition",
    "user-select",
    "vertical-align",
    "visibility",
    "white-space",
    "width",
    "word-break",
    "z-index"
]

export const PSEUDO_SELECTORS = [
    "&:hover",
    "&:focus",
    "&:focus-within",
    "&:focus-visible",
    "&:active",
    "&:visited",
    "&:disabled",
    "&:empty",
    "&:first-child",
    "&:last-child",
    "&:first-of-type",
    "&:last-of-type",
    "&:nth-child()",
    "&:nth-of-type()",
    "&::before",
    "&::after",
    "&::placeholder",
    "&::selection"
]
