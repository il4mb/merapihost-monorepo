import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PageObject } from "@/types/page";
import { useStudio } from "@/contexts";

export interface PagesContextType {
    pages: Map<string, PageObject>;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

const Context = createContext<PagesContextType | undefined>(undefined);

type PagesProviderProps = {
    children: ReactNode;
};

export default function PagesProvider({ children }: PagesProviderProps) {
    const { state, dispatch } = useStudio();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isFetchingRef = useRef(false);

    const fetchPages = useCallback(async () => {
        if (isFetchingRef.current) return;

        isFetchingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/pages").then(r => r.json());
            if (!response.success) {
                throw new Error(response.message || "Failed to fetch pages");
            }
            if (response.data && Array.isArray(response.data)) {
                const pagesMap = new Map<string, PageObject>();
                response.data.forEach((page: PageObject) => {
                    pagesMap.set(page.id, {
                        ...page,
                        createdAt: new Date(page.createdAt),
                        updatedAt: new Date(page.updatedAt)
                    });
                });
                dispatch({ type: "SET_PAGES", payload: pagesMap });
            } else {
                throw new Error("Invalid data format received from the server");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
        }
    }, [dispatch]); // Added dispatch to dependency array

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    const values = useMemo(() => ({
        pages: state.pages.collection,
        loading,
        error,
        refresh: fetchPages
    }), [loading, error, fetchPages, state.pages.collection]);

    return (
        <Context.Provider value={values}>
            {children}
        </Context.Provider>
    );
};

export const usePages = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error("usePages must be used within a PagesProvider");
    }
    return context;
};