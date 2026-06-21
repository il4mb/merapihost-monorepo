import { setupElementSCSS } from "../../constants/css"
import Editor from "@monaco-editor/react"
import { useCallback, useMemo } from "react"

interface CSSEditorProps {
    initialValue?: Record<string, any>
    onChange?: (style: Record<string, any>) => void
}

export default function CSSEditor({ initialValue, onChange }: CSSEditorProps) {
    const initialCode = useMemo(() => {
        if (!initialValue) return ""

        const transformer = (obj: Record<string, any>, indent = 0): string => {
            let result = ""
            const indentation = "    ".repeat(indent)
            for (const key in obj) {
                const value = obj[key]
                if (typeof value === "object" && value !== null) {
                    result += `${indentation}${key} {\n`
                    result += transformer(value, indent + 1)
                    result += `${indentation}}\n`
                } else {
                    result += `${indentation}${key}: ${value};\n`
                }
            }
            return result
        }
        return transformer(initialValue)
    }, [initialValue])

    const handleChange = useCallback(
        (value?: string) => {
            if (!onChange || !value) return

            const root: Record<string, any> = {}

            const stack: Record<string, any>[] = [root]

            const lines = value.split("\n")

            for (let raw of lines) {
                const line = raw.trim()

                if (!line) continue

                // open block
                if (line.endsWith("{")) {
                    const selector = line.slice(0, -1).trim()

                    const obj: Record<string, any> = {}

                    const current = stack[stack.length - 1]

                    current[selector] = obj

                    stack.push(obj)

                    continue
                }

                // close block
                if (line.startsWith("}")) {
                    stack.pop()
                    continue
                }

                // declaration
                const match = line.match(/^([\w-]+)\s*:\s*(.+?);?$/)

                if (match) {
                    const [, prop, val] = match

                    const current = stack[stack.length - 1]

                    current[prop] = val.trim()
                }
            }

            onChange(root)
        },
        [onChange]
    )

    return (
        <Editor
            defaultLanguage="element-scss"
            defaultValue={initialCode}
            beforeMount={setupElementSCSS}
            theme={"element-theme"}
            onChange={handleChange}
            options={{
                minimap: {
                    enabled: false
                },
                padding: {
                    top: 8,
                    bottom: 8
                },
                fontSize: 12,
                tabSize: 4,
                automaticLayout: true,
                suggest: {
                    showWords: true
                },
                colorDecorators: true,
                fixedOverflowWidgets: true
            }}
        />
    )
}
