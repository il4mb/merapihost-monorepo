"use client";
import { useMemo, useEffect } from "react";
import { Node } from "@/engine";

type NodeRenderProps = {
    node: Node;
};
export default function NodeRender({ node }: NodeRenderProps) {
    // const wires = useMemo(() => node.model.wires, [node.model]);

    // useEffect(() => {
    //     for (const [id, { callback }] of wires) {
    //         callback();
    //     }
    // }, [wires]);

    // return <NodeInternal node={node} />;
}
