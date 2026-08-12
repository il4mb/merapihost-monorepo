import { createType } from "../tools";
import PageIcon from "@/components/icons/PageIcon";
import { Fragment, useEffect } from "react";
import { useNodesReducer, useStudio } from "@/contexts/StudioProvider";
import { NodeRender } from "..";

type RootProps = {
    dom?: HTMLIFrameElement | null;
}
export const RootNode = createType<RootProps>(({ dom }) => {
    const { state, dispatch } = useNodesReducer();
    const nodes = Array.from(state.collection.values());
    const rootNodes = nodes.filter(n => !n.parent);

    useEffect(() => {
        if (!dom) return;
        const body = dom.contentDocument?.body;
        if (!body) return;
        dispatch({ type: "SET_DOM", payload: { id: "root", dom: body } });
        dom.style.height = "100%";
        dom.style.width = "100%";
        dom.style.minHeight = "100vh";
        return () => {
            dispatch({ type: "REMOVE_DOM", payload: "root" });
        }
    }, [dom]);

    return (
        <Fragment>
            {rootNodes.map(rootNode => (
                <NodeRender key={rootNode.id} node={rootNode} />
            ))}
        </Fragment>
    );
}, {
    name: "Root",
    icon: PageIcon,
});