"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LinearProgress, styled } from "@mui/material";
import { usePathname } from "next/navigation";

const ProgressIndicator = styled(LinearProgress)(() => ({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    zIndex: 9999,
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
    '&.loading': {
        opacity: 1,
    },
}));

interface NavigationProviderProps {
    children: ReactNode;
}

export default function NavigationProvider({ children }: NavigationProviderProps) {

    const pathname = usePathname();
    const finishLoadingRef = useRef<NodeJS.Timeout | null>(null);
    const [state, setState] = useState({
        open: false,
        loading: false
    });

    const finishLoading = useCallback(() => {
        if (finishLoadingRef.current) {
            clearTimeout(finishLoadingRef.current);
        }
        finishLoadingRef.current = setTimeout(() => {
            setState(prevState => ({
                ...prevState,
                loading: false
            }));
        }, 500);
    }, []);

    useEffect(() => {
        finishLoading();
    }, [pathname]);

    const value = useMemo(() => ({
        ...state,
        toggle: (visibility?: boolean) => {
            setState(prevState => ({
                ...prevState,
                open: typeof visibility === 'boolean' ? visibility : !prevState.open
            }));
        },
        setLoading: (loading: boolean) => {
            setState(prevState => ({
                ...prevState,
                loading
            }));
        }
    }), [state.loading, state.open]);

    return (
        <Context.Provider value={value}>
            <ProgressIndicator className={state.loading ? 'loading' : ''} />
            {children}
        </Context.Provider>
    );
}

type NavigationContextType = {
    open: boolean;
    toggle: (visibility?: boolean) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
};
const Context = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error("useNavigation must be used within a NavigationProvider");
    }
    return context;
}