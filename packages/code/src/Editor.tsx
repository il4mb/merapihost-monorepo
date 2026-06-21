import React, { useEffect } from 'react';
import CodeMirror, { BasicSetupOptions, ViewUpdate } from '@uiw/react-codemirror';
import { basicDark } from '@uiw/codemirror-theme-basic';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter, forEachDiagnostic } from '@codemirror/lint';

const extensions = [
    json(),
    linter(jsonParseLinter()),
    lintGutter({
        // @ts-ignore
        tooltipFilter: () => false,
    })
];

export type JsonError = {
    line: number;
    message: string;
};

const basicSetupConfig: BasicSetupOptions = {
    lineNumbers: false,
};

// 1. Definisikan tipe Props untuk komponen ini
export interface EditorProps {
    value: string;
    onChange?: (value: string) => void;
    onErrorChange?: (errors: JsonError[]) => void;
    height?: string;
    readOnly?: boolean;
}

function Editor({ value: externalValue, onChange, onErrorChange, height = "180px", readOnly = false }: EditorProps) {

    const [value, setValue] = React.useState(externalValue);
    const ignoreNextUpdate = React.useRef(false);
    const [errors, setErrors] = React.useState<JsonError[]>([]);
    const errorRef = React.useRef<JsonError[]>([]);

    const handleChange = React.useCallback((val: string) => {
        if (onChange) {
            ignoreNextUpdate.current = true; // Tandai bahwa update berikutnya harus diabaikan
            onChange(val);
        }
    }, [onChange]);

    const onUpdate = React.useCallback((viewUpdate: ViewUpdate) => {
        const currentErrors: JsonError[] = [];

        forEachDiagnostic(viewUpdate.state, (diag) => {
            const lineNumber = viewUpdate.state.doc.lineAt(diag.from).number;
            currentErrors.push({
                line: lineNumber,
                message: diag.message
            });
        });

        if (JSON.stringify(currentErrors) !== JSON.stringify(errorRef.current)) {
            errorRef.current = currentErrors;
            setErrors(currentErrors);

            // 2. Beri tahu Parent Component jika status error berubah
            if (onErrorChange) {
                onErrorChange(currentErrors);
            }
        }
    }, [onErrorChange]);

    useEffect(() => {
        if (ignoreNextUpdate.current) {
            ignoreNextUpdate.current = false; // Reset flag setelah mengabaikan update
            return;
        }
        setValue(externalValue);
    }, [externalValue]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <CodeMirror
                value={value}
                height={height}
                theme={basicDark}
                extensions={extensions}
                onChange={handleChange}
                onUpdate={onUpdate}
                basicSetup={basicSetupConfig}
                readOnly={readOnly}
                editable={!readOnly} // Menghindari virtual keyboard muncul di mobile jika readOnly
            />

            {errors.length > 0 && (
                <div style={{
                    padding: '12px',
                    backgroundColor: '#2d0000',
                    color: '#ff6b6b',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '13px'
                }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>⚠️ Invalid JSON:</strong>
                    {errors.map((err, idx) => (
                        <div key={idx} style={{ marginBottom: '4px' }}>
                            • Baris {err.line}: {err.message}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Editor;