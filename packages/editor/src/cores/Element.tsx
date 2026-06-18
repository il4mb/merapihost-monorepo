// import React, { ElementType, ComponentPropsWithoutRef, useMemo, createElement, createContext, useContext, memo, useEffect, RefObject } from "react";
// import { NodeObject } from "../type";
// import NodeProvider from "./NodeProvider";
// import { Element } from "../base/Element";
// import { useModelRegistry } from "../hooks/useResolver";
// import { useComponentRegistries } from "./ComponentProvider";

// /**
//  * The Wrapper component for all elements in the editor. It handles the registration of nodes, linking to parent nodes, and rendering of children. 
//  * It also ensures that custom components are properly connected to the editor's state and resolver system.
//  */
// interface ElementBaseProps<T extends ElementType> {
//     as?: T
//     children?: React.ReactNode
//     id?: string
//     ref?: RefObject<HTMLElement|null> | ((instance: HTMLElement | null) => void);
//     slotProps?: {
//         node?: {
//             name?: string
//             order?: number
//         }
//     }
// }
// export type ElementProps<T extends ElementType> = ElementBaseProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof ElementBaseProps<T>>
// // @ts-ignore
// const Element = memo(function <T extends ElementType = "div">({ as: type = "div" as T, ref, ...rest }: ElementProps<T>) {

//     const { getComponent } = useComponentRegistries();
//     const component = useMemo(() => {
//         const component = getComponent(type);
//         if (!component && typeof type === "function") {
//             return Element;
//         }
//         return component || Element;
//     }, [type, rest]);

//     // --- Children Wrapping ---
//     const children = useMemo(() => {
//         return React.Children.map(rest.children, (child) => {
//             if (React.isValidElement(child)) {
//                 const childType = child.props.as || child.type;
//                 const isAlreadyElement = childType === Element;
//                 if (!isAlreadyElement) {
//                     return createElement(Element, {
//                         as: childType,
//                         ...child.props
//                     });
//                 }
//             }
//             return child;
//         })
//     }, [rest.children]);

//     return (
//         <NodeProvider component={component} name={rest.slotProps?.node?.name} props={rest} type={type} ref={ref}>
//             {children}
//         </NodeProvider>
//     );
// });
// Element.displayName = "Element";
// export default Element;

// export interface NodeContextValue { };
// const NodeContext = createContext<NodeObject | undefined>(undefined);

// export const useNode = () => {
//     return useContext(NodeContext) as NodeObject | undefined
// };
