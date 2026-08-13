import { useStudio } from "@/contexts/StudioProvider";
import { useMemo } from "react";

export const usePages = () => {
    const { state, dispatch } = useStudio();
    return useMemo(() => Array.from(state.pages.collection.values()), [state.pages.collection]);
}

export const useCurrentPage = () => {
    const { state } = useStudio();
    return useMemo(() => {
        if (!state.pages.opened) return null;
        return state.pages.opened;
    }, [state.pages.opened]);
}
