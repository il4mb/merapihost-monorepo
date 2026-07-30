import { z } from 'zod';
import { useState, useEffect, useMemo, useCallback } from 'react';

// 1. Tipe rekursif untuk mendukung nested object
export type NestedErrors<T> = {
    [K in keyof T]?: T[K] extends Date | Array<any>
    ? string // Jika tipe adalah Date atau Array, error berupa string
    : T[K] extends object
    ? NestedErrors<T[K]> // Jika object biasa, rekursif ke dalam object
    : string; // Tipe primitif (string, number, boolean) berupa string
};

/**
 * Hook untuk validasi data menggunakan Zod schema.
 * @param schema - Zod schema (ZodObject, ZodTypeAny, dll)
 * @param data - Data yang akan divalidasi (harus sesuai dengan tipe infer dari schema)
 * @returns Object berisi errors (key-value) dan status isValid
 */
export function useValidator<T extends z.ZodTypeAny>(schema: T, data: z.infer<T>, autoValidate = true) {
    const [errors, setErrors] = useState<NestedErrors<z.infer<T>>>({});
    const [isValid, setIsValid] = useState(false);
    const dataSignature = JSON.stringify(data);

    const validate = useCallback((data: z.infer<T>) => {
        const result = schema.safeParse(data);
        if (result.success) {
            setErrors({});
            setIsValid(true);
        } else {
            // Gunakan 'any' secara internal saat merakit object 
            // agar lebih mudah menambah properti bersarang
            const errs: any = {};

            result.error.issues.forEach((issue) => {
                const path = issue.path;
                let current = errs;

                // 2. Loop melalui path Zod untuk membuat nested object
                for (let i = 0; i < path.length; i++) {
                    const key = path[i];
                    const isLastKey = i === path.length - 1;

                    if (isLastKey) {
                        // Jika ini key terakhir (misal 'start'), set pesannya
                        if (current[key] === undefined) {
                            current[key] = issue.message;
                        }
                    } else {
                        // Jika bukan key terakhir (misal 'schedule'), buat object kosong jika belum ada
                        if (current[key] === undefined) {
                            current[key] = {};
                        }
                        // Pindah ke level object berikutnya
                        current = current[key];
                    }
                }
            });

            setErrors(errs);
            setIsValid(false);
        }
    }, [schema, dataSignature]);

    useEffect(() => {
        if (autoValidate) {
            validate(data);
        }
    }, [validate, autoValidate, dataSignature]);

    return useMemo(() => ({ validate, errors, isValid }), [validate, errors, isValid]);
}