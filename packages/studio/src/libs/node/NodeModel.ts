import type { NodeObject, Block, BlockNodeObject } from "@/types";
import { ElementNode, REGISTRY } from ".";
import { ModelProxy } from "./ModelProxy";
import { merge } from "lodash";
import { nanoid } from "nanoid";

export interface NodeContext {
    node: NodeObject | null;
    type: ModelProxy | null;
    dom: HTMLElement | null;
}

export class NodeModel implements NodeContext {

    readonly node: NodeObject;
    readonly type: ModelProxy;
    private _dom: HTMLElement | null = null;

    private findType(node: NodeObject): ModelProxy {
        if ("type" in node && node.type && node.type in REGISTRY) {
            return new ModelProxy(REGISTRY[node.type]);
        }
        const match = Object.values(REGISTRY).find(
            (item) => item.model.isInstance?.(node)
        );
        return match ? new ModelProxy(match) : new ModelProxy(ElementNode);
    }

    private mergeDefaultProps() {
        const typeDefaultProps = this.type.getDefaultProps(this);
        const mergedProps = merge({}, typeDefaultProps, this.node.props || {});
        this.node.props = mergedProps;
    }

    constructor(node: NodeObject | NodeModel) {
        if (node instanceof NodeModel) {
            // existing NodeModel
            this.node = node.node;
            this.type = node.type;
            this._dom = node.dom;
        } else {
            // new NodeModel
            this.node = node;
            this.type = this.findType(node);

            // Merge default props for new nodes only, not for existing NodeModel instances
            this.mergeDefaultProps();
        }
    }

    get id() {
        return this.node.id;
    }

    get dom() {
        return this._dom;
    }
    set dom(value: HTMLElement | null) {
        this._dom = value;
    }

    /**
     * Gets the name of the node.   
     */
    get name() {
        return this.node?.name || this.type.getDefaultName(this);
    }
    set name(value: string) {
        this.node.name = value;
    }


    get props() {
        return this.node?.props || {};
    }
    set props(value: Record<string, any>) {
        this.node.props = { ...value };
    }


    get content() {
        return this.node?.content || undefined;
    }
    set content(value: string | undefined | null) {
        this.node.content = value;
    }


    get tagName() {
        return this.node?.tagName || this.type.getDefaultTagName(this);
    }
    set tagName(value: string) {
        this.node.tagName = value;
    }


    get parent(): string | null {
        return this.node?.parent || null;
    }
    set parent(value: string | null) {
        this.node.parent = value;
    }


    get order(): number {
        return this.node?.order || 0;
    }
    set order(value: number) {
        this.node.order = value;
    }


    get visible(): boolean {
        return this.node?.visible ?? true;
    }
    set visible(value: boolean) {
        this.node.visible = value;
    }


    /**
     * Converts the NodeModel instance back to a plain NodeObject.
     * @returns A plain NodeObject representation of the NodeModel.
     */
    toJSON(): NodeObject {
        const typeName = String(this.type?.model?.name).toLowerCase();
        if (typeName === "textnode") {
            return {
                id: this.node.id,
                type: this.node.type,
                name: this.node.name,
                content: this.node.content,
                parent: this.node.parent || null,
            };
        }
        return {
            id: this.node.id,
            type: this.node.type,
            tagName: this.node.tagName,
            name: this.node.name,
            props: { ...this.node.props },
            parent: this.node.parent || null,
            order: this.node.order
        };
    }


    // Overloads
    static build(
        content: BlockNodeObject,
        parentId?: string | null
    ): NodeModel;
    static build(
        content: BlockNodeObject,
        parentId: string | null,
        map: Map<string, NodeModel>
    ): { root: NodeModel; collection: Map<string, NodeModel> };

    // Implementation
    static build(
        content: BlockNodeObject,
        parentId: string | null = null,
        map?: Map<string, NodeModel>
    ): NodeModel | { root: NodeModel; collection: Map<string, NodeModel> } {
        const { children, ...rest } = content;

        // 1. Create the new node
        const node = new NodeModel({
            ...rest,
            id: nanoid(),
            parent: parentId,
        });

        // 2. If map is provided, process children recursively
        if (map) {
            map.set(node.id, node);

            if (Array.isArray(children) && children.length > 0) {
                children.forEach((childBlock, index) => {
                    // Because 'map' is passed, TypeScript knows this returns { root, collection }
                    const result = NodeModel.build(childBlock, node.id, map);

                    // Maintain sequence order for descendants
                    result.root.order = index;
                });
            }

            return {
                root: node,
                collection: map
            };
        }

        // 3. If no map is provided, ignore children and return the single node
        return node;
    }
}