// import { MODEL_REGISTRY } from "@/registry";
import { LifecycleHook } from "./LifecycleHook";
import { Model, Node } from "@/engine";
import type { NodeObject, PlainNodeObject } from "@/types";
import { Container } from "./Container";
import { Stylish } from "./styles/Stylish";

export class Document extends LifecycleHook {

    static ORDER_EPS = 0.001; // increment terkecil, biasanya dikalikan segIdx
    static ORDER_MINOR = 0.01; // offset gaya "before"
    static ORDER_MAJOR = 0.02; // offset gaya "after"

    private collection: Map<string, Node<any>> = new Map();

    readonly head: Node<"element">;
    readonly body: Node<"element">;
    readonly stylish: Stylish;

    constructor(
        public container: Container,
        nodes?: NodeObject<ModelName>[]
    ) {
        super();

        this.head = this.createNode("element", { tagName: "head" });
        this.body = this.createNode("element", { tagName: "body" });
        this.stylish = new Stylish(this);

        this.head.on("mounted", () => {
            console.log("Head Mounted");
            this.stylish.render();
        });

        if (nodes && Array.isArray(nodes)) {
            Node.sort(nodes).forEach(raw => this.createNode(raw.type || "element", raw));
        }

    }

    get nodes() {
        return new Map(this.collection);
    }

    /**
     * Create Node at this Document
     * @param type Model of node
     * @param nodeObject raw data of node
     * @returns Node
     */
    public createNode<T extends ModelName>(type: T, nodeObject?: PlainNodeObject<T> | NodeObject<T>): Node<T> {

        const typeModel = this.container.get(type) as Model<T> | undefined;
        if (!typeModel) {
            throw new Error(`Type ${type} not found in registry`);
        }

        const node = typeModel.buildNode(this, nodeObject) as Node<T>;
        this.collection.set(node.id, node);

        if (nodeObject?.parent) {
            const parent = this.findNode(nodeObject.parent);
            if (parent) {
                this.addNodeChildren(parent, node, nodeObject.order);
            } else {
                console.warn(`Cannot add children to node with id ${nodeObject.order} was not found!`);
            }
        }

        if (this.body && !node.parent) {
            console.warn(`Node ${node.id} does't have parent, fallback to the body`);
            this.addNodeChildren(this.body, node);
        }

        if (this.head && this.stylish) { // ensure after head
            this.stylish?.parseNodeStyle(node);
        }
        node.model.invokeHook("onCreate", node);

        if (nodeObject.children && Array.isArray(nodeObject.children)) {
            Node.sort(nodeObject.children)
                .forEach(childRaw => {
                    const child = this.createNode(childRaw.type || "element", childRaw);
                    this.addNodeChildren(node, child);
                });
        }

        return node;
    }


    /**
     * Find a node by its ID in the document's children.
     * @param id The ID of the node to find.
     * @returns The node with the specified ID, or null if not found.
     */
    public findNode<T extends ModelName>(id: string): Node<T> | null {
        return this.collection.has(id)
            ? this.collection.get(id)
            : null;
    }



    /**
     * Add Children
     */
    public addNodeChildren(parent: Node<any>, node: Node<any>, at?: number) {
        this.ensureOwner(parent, node);
        const children = this.getChildren(parent); // Map<string, Node>
        const entries = Array.from(children.values()).sort((a, b) => a.order - b.order);

        if (at === undefined || at === null) {
            // Append: set order after last existing child
            node.order = entries.length > 0 ? entries[entries.length - 1].order + Document.ORDER_EPS : 0;
        } else {
            const targetIndex = Math.max(0, Math.min(Math.floor(at), entries.length));

            if (targetIndex === 0) {
                // Insert at beginning
                const firstOrder = entries.length > 0 ? entries[0].order : 0;
                node.order = firstOrder - Document.ORDER_EPS;
            } else if (targetIndex >= entries.length) {
                // Insert at end
                const lastOrder = entries.length > 0 ? entries[entries.length - 1].order : 0;
                node.order = lastOrder + Document.ORDER_EPS;
            } else {
                // Insert between two nodes
                const prevOrder = entries[targetIndex - 1].order;
                const nextOrder = entries[targetIndex].order;
                node.order = (prevOrder + nextOrder) / 2; // Fractional average
            }
        }

        node.parent = parent;
        this.normalizeChildrenOrder(parent);
    }

    public removeChildren(parent: Node<any>, child: Node<any>) {

    }

    public reorderChildren(parent: Node<any>, startIndex?: number) {
        this.ensureOwner(parent)
        const children = this.getChildren(parent);
    }


    /**
     * Get Node Ancestors
     * @param node starting point
     * @returns 
     */
    public getAncestors<T extends ModelName>(node: Node<T>) {
        this.ensureOwner(node);
        const result = new Map<string, Node<any>>();
        let currentNode: Node<any> | undefined = node;

        while (currentNode.parent.id) {
            const parentNode = this.collection.get(currentNode.parent.id);
            if (!parentNode) break;

            result.set(parentNode.id, parentNode);
            currentNode = parentNode;
        }
        return this.toReadonlyMap(result);
    }

    /**
     * Walk up finder until endId
     * @param startId starting node id
     * @param endId finish node id
     * @param map the collection
     * @returns ancestor chain
     */
    public getAncestorChain<T extends ModelName>(start: Node<any>, end: Node<any>): Node<T>[] {
        this.ensureOwner(start, end);
        const chain: Node<any>[] = [];
        let current = this.findNode(start.id);
        while (current && current.id !== end.id) {
            chain.push(current);
            current = this.findNode(current.parent.id);
        }
        return chain;
    };


    /**
     * Walk down finder
     * @param node 
     * @param collection 
     * @returns Map<string, Node>
     */
    public getDescendants<T extends ModelName>(node: Node<T>) {
        this.ensureOwner(node);
        const childrenMap = new Map<string, Node<any>[]>();
        for (const child of this.collection.values()) {
            if (!child.parent) continue;
            const children = childrenMap.get(child.parent.id);
            if (children) {
                children.push(child);
            } else {
                childrenMap.set(child.parent.id, [child]);
            }
        }

        const descendants = new Map<string, Node<any>>();
        const walk = (parentId: string) => {
            for (const child of childrenMap.get(parentId) ?? []) {
                descendants.set(child.id, child);
                walk(child.id);
            }
        };
        walk(node.id);

        return this.toReadonlyMap(descendants);
    }

    /**
     * Node Children Only
     * @param node 
     * @param collection 
     * @returns Map<string, Node>
     */
    public getChildren(node: Node<any>) {
        this.ensureOwner(node);
        const childrenArray = Array.from(this.collection.values())
            .filter(n => n.parent?.id === node.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        return this.toReadonlyMap(new Map(childrenArray.map(n => [n.id, n])));
    }


    public getSiblings(node: Node<any>) {
        this.ensureOwner(node);
        const childrenArray = Array.from(this.collection.values())
            .filter(n => n.parent === node.parent)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        return this.toReadonlyMap(new Map(childrenArray.map(n => [n.id, n])));
    }

    /**
     * Remove parentles node
     * @param map 
     */
    public purgeOrphan() {
        const validIds = new Set<string>();
        const traverse = (id: string | null) => {
            validIds.add(id);
            const children = Array.from(this.collection.values()).filter((n) => n.parent.id === id);
            children.forEach((child) => traverse(child.id));
        };
        traverse(null);

        this.collection.forEach((n, id) => {
            if (!validIds.has(id)) {
                this.collection.delete(id);
            }
        });
    };



    /**
     * Normalize node orders recursively.
     */
    public normalizeOrder() {
        const topLevelNodes = this.getTopLevelNodes();
        topLevelNodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        topLevelNodes.forEach((node, index) => {
            node.order = index;
            this.normalizeChildrenOrder(node, true);
        });
    }

    /**
     * Normalize Spesific Node Children Order
     * @param parent 
     * @param recursive 
     * @returns 
     */
    public normalizeChildrenOrder(parent: Node<any>, recursive: boolean = false) {
        const children = Array.from(this.collection.values())
            .filter(node => node.parent?.id === parent.id);

        if (children.length === 0) return;
        children.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        children.forEach((child, index) => {
            child.order = index;
            if (recursive) {
                this.normalizeChildrenOrder(child, true);
            }
        });
    }


    public getTopLevelNodes() {
        return Array.from(this.collection.values())
            .filter((node) => !node.parent || !this.collection.has(node.parent.id))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }



    /**
     * Helper Create Readonly Map
     * @param map 
     * @returns 
     */
    private toReadonlyMap(map: Map<string, Node<any>>): ReadonlyMap<string, Node<any>> {
        const mutatingMethods = new Set(['set', 'delete', 'clear']);
        return new Proxy(map, {
            get(target, prop: string) {
                // Block mutating methods
                if (mutatingMethods.has(prop)) {
                    throw new TypeError(`Method '${prop}' cannot be called on a ReadonlyMap.`);
                }
                const value = target[prop];
                // Bind methods like .get(), .has(), .keys() to the original Map instance
                return typeof value === 'function' ? value.bind(target) : value;
            }
        });
    }

    public ensureOwner(...nodes: Node<any>[]) {
        if (!(Array.isArray(nodes) ? nodes : [nodes]).every(e => e.owner === this)) {
            throw new Error("Canot find ancestors node is not owned by this document");
        }
    }
}