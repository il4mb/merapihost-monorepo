import { createType } from "@/libs/node/createType";
import PageIcon from "@/components/icons/PageIcon";
import { Fragment, useEffect, useMemo } from "react";
import { useNodes } from "@/contexts";
import NodeRender from "../NodeRender";
import { ROOT_NODE } from "@/libs/reducers/nodes";

type RootProps = {
    dom?: HTMLIFrameElement | null;
}
export const RootType = createType<any, RootProps>(({ dom }) => {
    const { state, dispatch } = useNodes();
    const nodes = useMemo(() => Array.from(state.collection.values()), [state.collection]);
    const rootNodes = useMemo(() => nodes.filter(n => n.parent === ROOT_NODE.id), [nodes]);

    useEffect(() => {
        if (!dom) return;
        const body = dom.contentDocument?.body as HTMLBodyElement;

        dispatch({ type: "SET_DOM", payload: { id: "root", dom: body } });
        body.style.height = "100%";
        body.style.width = "100%";
        body.style.minHeight = "100vh";

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
    extends: "element",
    icon: PageIcon,
    actions: {
        parent: null,
        delete: null
    }
});