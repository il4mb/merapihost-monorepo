import { useCallback, useMemo } from "react";
import { NodeModel } from "../..";
import { useNodeChildren } from "@/hooks";
import { useNodesReducer } from "@/contexts/StudioProvider";

type RenderEditingTypeProps = {
    node: NodeModel;
};

export default function RenderEditingType({ node }: RenderEditingTypeProps) {

    const { dispatch } = useNodesReducer();
    const Component = useMemo(() => node.type.render, [node.type]);

    const childrenNode = useNodeChildren(node);
    const orderedNodes = useMemo(() => {
        return childrenNode.sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [childrenNode]);

    const children = useMemo(() => {
        return orderedNodes.map((child) => {
            return (
                <RenderEditingType
                    key={child.id}
                    node={child} />
            );
        });
    }, [orderedNodes]);

    const setRef = useCallback((dom: HTMLElement | null) => {
        dispatch({ type: "SET_DOM", payload: { id: node.id, dom } });
    }, [node.id]);

    return (
        <Component node={node} childrenNode={orderedNodes} ref={setRef}>
            {children}
        </Component>
    );
}
