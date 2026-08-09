import { createType } from "../tools";
import PageIcon from "@/components/icons/PageIcon";
import { Fragment, useEffect } from "react";
import { ElementNode } from "./ElementNode";
import { useStudio } from "@/contexts/StudioProvider";

type RootProps = {
    dom?: HTMLIFrameElement | null;
}
export const RootNode = createType<RootProps>(({ dom }) => {
    const { state, dispatch } = useStudio();
    const nodes = Array.from(state.nodes.values());
    const rootNodes = nodes.filter(n => !n.parent);

    useEffect(() => {
        if (!dom) return;
        const body = dom.contentDocument?.body;
        if (!body) return;
        dispatch({ type: "SET_DOM", payload: { id: "root", dom: body } });
        return () => {
            dispatch({ type: "REMOVE_DOM", payload: "root" });
        }
    }, [dom]);

    return (
        <Fragment>
            {rootNodes.map(rootNode => (
                <ElementNode key={rootNode.id} node={rootNode} />
            ))}
        </Fragment>
    );
}, {
    name: "Root",
    icon: PageIcon,
});