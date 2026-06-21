import { createContext, useContext, useMemo } from "react";

interface ConnectorProviderProps {
    children?: React.ReactNode
    onConnect?: (ref: HTMLElement | null) => void
}

export default function Connector({ children, onConnect }: ConnectorProviderProps) {
    const value = useMemo(() => {
        return {
            connect: (ref: HTMLElement | null) => onConnect?.(ref)
        }
    }, [onConnect])

    return <Context.Provider value={value}>{children}</Context.Provider>
}

export type ConnectorContextType = {
    connect: (ref: HTMLElement | null) => void
}
const Context = createContext<ConnectorContextType | undefined>(undefined)
Context.displayName = "Connector"

export const useConnector = () => {
    const context = useContext(Context);
    return context || { connect: () => { } };
}
