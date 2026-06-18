import { Fragment, useEffect } from "react";
import { useEditor } from "../cores/EditorProvider";
import { Element } from "./Element";

type RootProps = {
    dom?: HTMLIFrameElement | null
}
export const Root = ({ dom }: RootProps) => {
    const { state, dispatch } = useEditor();
    const nodes = Array.from(state.nodes.values());
    const rootNode = nodes.find(n => n.type === "Root");

    useEffect(() => {
        if(!dom) return;  
        const body = dom.contentDocument?.body;
        if (!body) return;
        dispatch({ type: "SET_DOM", payload: { id: rootNode?.id || "root", dom: body } });
        return () => {
            dispatch({ type: "REMOVE_DOM", payload: rootNode?.id || "root" });
        }
    }, [dom]);

    return (
        <Fragment>
            {rootNode && (
                <Element key={rootNode.id} node={rootNode} />
            )}
        </Fragment>
    )
}