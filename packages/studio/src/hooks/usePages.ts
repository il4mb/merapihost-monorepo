import { useMemo } from "react";
import { useStudio } from "@/contexts";

export const usePages = () => {
    const { state } = useStudio();
    return useMemo(() => Array.from(state.pages.collection.values()), [state.pages.collection]);
}

export const useCurrentPage = () => {
    const { state } = useStudio();
    return useMemo(() => {
        if (!state.pages.opened) return null;
        return state.pages.opened;
    }, [state.pages.opened]);
}
