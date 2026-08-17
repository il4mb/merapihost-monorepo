"use client";
import { auth } from "@/libs/firebase";
import { CircularProgress, Typography } from "@mui/material";
import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import CenteredFlexboxItem from "@/components/ui/CenteredFlexboxItem";

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const Context = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

type AuthProviderProps = {
    children?: React.ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        let delayTimeout: NodeJS.Timeout | null = null;
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            delayTimeout = setTimeout(() => setLoading(false), 0); // Added a slight delay for better UX
        });

        return () => {
            unsubscribe();
            if (delayTimeout) {
                clearTimeout(delayTimeout);
            }
        };
    }, []);

    return (
        <Context.Provider value={{ user, loading }}>
            {loading ? (
                <CenteredFlexboxItem>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading...</Typography>
                </CenteredFlexboxItem>
            ) : children}
        </Context.Provider>
    );
}