import { createType } from "../tools";
import PageIcon from "../icons/PageIcon";
import { useEditor } from "../cores/EditorProvider";
import { Fragment, useEffect } from "react";
import { Element } from "./Element";

type RootProps = {
    dom?: HTMLIFrameElement | null;
}
export const Root = createType<RootProps>(({ dom }) => {
    const { state, dispatch } = useEditor();
    const nodes = Array.from(state.nodes.values());
    const rootNode = nodes.find(n => n.type === "Root");

    useEffect(() => {
        if (!dom) return;
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
}, {
    name: "Root",
    icon: PageIcon,
});