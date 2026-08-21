import { Fragment, useMemo } from "react";
import { useDocument } from "./DocumentProvider";

type RootDocumentProps = {};

export default function RootDocument({}: RootDocumentProps) {
    const { nodes, body } = useDocument();
    const rootNodes = useMemo(() => Array.from(body.children.values()), [nodes]);
    return (
        <Fragment>
            {rootNodes.map((node) => node.render())}
        </Fragment>
    );
}
