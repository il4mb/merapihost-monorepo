"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "./StudioProvider";
import { AssetObject } from "@editor/types";

type AssetsProviderProps = {
    children: ReactNode;
};

export default function AssetsProvider({ children }: AssetsProviderProps) {
    const { state, dispatch } = useStudio();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isFetchingRef = useRef(false);
    const delayUXLoading = useRef<NodeJS.Timeout | null>(null);

    const openedFolder = useMemo<AssetObject | null>(() => {
        if (state.assets.opened && state.assets.opened.type === "folder") {
            return state.assets.opened;
        }
        return null;
    }, [state.assets.opened]);

    const currentPath = useMemo(() => {
        if (!openedFolder) return "";

        const path: string[] = [];
        let currentFolder: typeof openedFolder | null = openedFolder;

        // Traverse up the tree to build the path
        while (currentFolder) {
            const folderName = currentFolder.name;
            path.unshift(folderName);

            // Move to parent
            if (currentFolder.parentId) {
                const parent = state.assets.collection.get(currentFolder.parentId);
                if (parent && parent.type === "folder") {
                    currentFolder = parent;
                } else {
                    currentFolder = null;
                }
            } else {
                currentFolder = null;
            }
        }

        return path.join(" / ");
    }, [openedFolder, state.assets.collection]);

    const values = useMemo(() => {
        const folderId = openedFolder ? openedFolder.id : null;
        return Array.from(state.assets.collection.values()).filter(asset => asset.parentId === folderId);
    }, [state.assets.collection, openedFolder]);


    const fetchAssets = useCallback(async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        if (delayUXLoading.current) {
            clearTimeout(delayUXLoading.current);
            delayUXLoading.current = null;
        }
        try {
            setLoading(true);
            setError(null);
            const folderId = openedFolder ? openedFolder.id : null;

            const url = new URL("/api/assets", window.location.origin);
            if (folderId) {
                url.searchParams.append("folderId", folderId);
            }
            const result = await fetch(url.toString());
            const response = await result.json();
            if (!response.success || Array.isArray(response.data) === false) {
                throw new Error(response.message || "Failed to fetch assets.");
            }
            const isValid = Array.isArray(response.data) && response.data.every((asset: any) => asset.id && asset.name && ["file", "folder"].includes(asset.type));
            if (!isValid) {
                throw new Error("Invalid asset data format received from the server.");
            }
            dispatch({ type: "SET_ASSETS", payload: new Map(response.data.map((asset: any) => [asset.id, asset])) });
        } catch (error: any) {
            console.error("Error fetching assets:", error);
            setError(error.message || "An error occurred while fetching assets.");
        } finally {
            delayUXLoading.current = setTimeout(() => setLoading(false), 300); // Add a slight delay for better UX
        }
    }, [openedFolder, dispatch]);

    const handleGoBack = useCallback(() => {
        if (openedFolder) {
            const parentId = openedFolder.parentId;
            if (parentId) {
                const parentFolder = state.assets.collection.get(parentId);
                if (parentFolder && parentFolder.type === "folder") {
                    dispatch({ type: "SET_OPENED_ASSET", payload: parentFolder });
                } else {
                    dispatch({ type: "SET_OPENED_ASSET", payload: null });
                }
            } else {
                dispatch({ type: "SET_OPENED_ASSET", payload: null });
            }
        }
    }, [openedFolder, state.assets.collection, dispatch]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    const value = useMemo(() => ({
        values,
        loading,
        error,
        parent: openedFolder,
        path: currentPath,
        refresh: fetchAssets,
        handleGoBack
    }), [loading, error, openedFolder, currentPath, fetchAssets, handleGoBack]);

    return (
        <AssetsContext.Provider value={value}>
            {children}
        </AssetsContext.Provider>
    );
}


export interface AssetsContextType {
    values: AssetObject[];
    loading: boolean;
    error: string;
    parent: AssetObject | null;
    path: string;
    refresh: () => Promise<void>;
    handleGoBack: () => void;
}

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

export const useAssets = () => {
    const context = useContext(AssetsContext);
    if (!context) {
        throw new Error("useAssets must be used within an AssetsProvider");
    }
    return context;
}