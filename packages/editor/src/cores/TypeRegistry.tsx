import { createContext, ElementType, FC, useCallback, useContext, useMemo, useState } from "react";
import { TypeComponent } from "../type";
import { TextNode } from "../components/TextNode";
import { Root } from "../components/Root";
import { Element } from "../components/Element";
import { Slots } from "../components/Slots";

type ComponentProviderProps = {
    children?: React.ReactNode;
    resolver: {
        [key: string]: TypeComponent<any>;
    }
}
export default function TypeRegistry({ children, resolver }: ComponentProviderProps) {

    const [registries, setRegistries] = useState<Record<string, TypeComponent<any>>>({ ...resolver, textnode: TextNode, Root, Element, Slots });
    const registerComponent = useCallback((name: string, component: TypeComponent<any>) => {
        if (["Element", "Root", "TextNode", "Slots"].some(n => n === name || n.toLowerCase() === name.toLowerCase())) {
            console.warn(`Component name "${name}" is reserved and cannot be registered.`);
            return;
        }
        if (component === Root) {
            console.warn(`Component "${name}" cannot be registered as it is a reserved base component.`);
            return;
        }
        setRegistries(prev => ({ ...prev, [name]: component }));
    }, []);

    const getComponent = useCallback((name: string | FC | ElementType): TypeComponent<any> | undefined => {
        if (typeof name === "function") {
            const found = Object.values(registries).find(component => component === name);
            return found;
        }
        return registries[name];
    }, [registries]);

    const contextValue = useMemo(() => ({
        registries,
        registerComponent,
        getComponent
    }), [registries, registerComponent, getComponent]);

    return (
        <ComponentContext.Provider value={contextValue}>
            {children}
        </ComponentContext.Provider>
    );
}

type ComponentContextValue = {
    registries: Record<string, TypeComponent<any>>;
    registerComponent: (name: string, component: TypeComponent<any>) => void;
    getComponent: (name: string | FC | ElementType) => TypeComponent<any> | undefined;
}
const ComponentContext = createContext<ComponentContextValue>({ registries: {}, registerComponent: () => { }, getComponent: () => undefined });

export const useTypeRegistry = () => {
    return useContext(ComponentContext);
}