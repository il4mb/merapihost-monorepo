import { Fragment, useMemo } from "react";
import { useContainer } from "./ContainerProvider";

type RootDocumentProps = {};

export default function RootDocument({}: RootDocumentProps) {
    const { nodes, body } = useContainer();
    const rootNodes = useMemo(() => Array.from(body.children.values()), [nodes]);
    return (
        <Fragment>
            {rootNodes.map((node) => node.render())}
        </Fragment>
    );
}
