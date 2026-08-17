import { NodeModel, NodeReducerAction, TypeActionDefine, TypeComponent, TypeModel } from "@/types";
import { REGISTRY } from ".";
import { NodeContext } from "./NodeModel";
import { Dispatch } from "react";
import { merge } from "lodash";
import { ModelContext } from "./ModelContext";


/**
 * A proxy class that wraps a TypeModel and provides access to its properties, including inherited properties from parent models.
 * This class allows for easy retrieval of model information, including default values and properties that may be defined in parent models.
 */
export class ModelProxy {

    private wiredCommands: Map<string, (p?: any) => void> = new Map();
    readonly node: NodeModel;
    readonly type: TypeComponent;
    readonly model: TypeModel;

    private get mergedActionsRecord(): TypeActionDefine {
        // Get parent actions recursively
        const parentActions = this.extends ? this.extends.mergedActionsRecord : {};

        // Resolve current actions (handle both Function and Object variants)
        let currentActions: TypeActionDefine = {};

        if (typeof this.model.actions === "function") {
            const evaluatedActions = this.model.actions;
            if (evaluatedActions) {
                let evaluated = evaluatedActions(this.node);
                if (evaluated) {
                    currentActions = evaluated;
                }
            }
        } else if (this.model.actions) {
            currentActions = this.model.actions;
        }

        // Merge them: child actions overwrite parent actions automatically
        return {
            ...parentActions,
            ...currentActions
        };
    }

    constructor(node: NodeModel, type: TypeComponent) {
        this.node = node;
        this.type = type;
        this.model = type.model;
    }

    get isText(): boolean {
        return String(this.model.name).toLowerCase() === "text" || (this.extends?.isText ?? false);
    }

    get extends(): ModelProxy | null {
        // You could pass a Set of visited names into an overloaded or private constructor 
        // to block circular instantiation completely. 
        const extendsType = this.model?.extends;
        if (!extendsType) return null;

        // Basic self-reference check
        if (extendsType.toLowerCase() === this.name.toLowerCase()) {
            console.warn(`Model ${this.name} attempts to extend itself.`);
            return null;
        }

        const parentModel = REGISTRY[extendsType.toLowerCase()];
        if (!parentModel) return null;

        return new ModelProxy(this.node, parentModel);
    }

    get data() {
        let currentModel: TypeModel | undefined = this.model;
        let mergedData: Record<string, unknown> = {};
        const visited = new Set<string>(); // Keep track of visited models

        while (currentModel) {
            const modelName = String(currentModel.name).toLowerCase();

            // Prevent infinite loop on circular dependency
            if (visited.has(modelName)) {
                console.warn(`Circular dependency detected in model data chain at: ${modelName}`);
                break;
            }
            visited.add(modelName);

            mergedData = merge({}, currentModel.data, mergedData);
            const parentTypeName = currentModel.extends;

            if (parentTypeName) {
                const parentModel = REGISTRY[parentTypeName.toLowerCase()];
                currentModel = parentModel ? parentModel.model : undefined;
            } else {
                currentModel = undefined;
            }
        }
        return mergedData as Record<string, unknown>;
    }

    get name() {
        return String(this.model?.name).toLowerCase();
    }

    get icon() {
        return this.model?.icon || this.extends?.icon || null;
    }

    get color() {
        return this.model?.color || this.extends?.color || undefined;
    }

    get childrenColor() {
        return this.model?.childrenColor || this.extends?.childrenColor || undefined;
    }

    get draggable() {
        return this.model?.draggable ?? this.extends?.draggable ?? true;
    }

    get droppable() {
        return this.model?.droppable ?? this.extends?.droppable ?? true;
    }

    get visibleOnTree() {
        return this.model?.visibleOnTree ?? this.extends?.visibleOnTree ?? true;
    }

    get render() {
        return this.type; // Return the component itself for rendering
    }

    get actions() {
        // Pass the node into our recursive merger
        const mergedRecord = this.mergedActionsRecord;

        return Object.entries(mergedRecord).map(([key, action]) => action && ({
            id: key,
            title: key,
            ...action // This will gracefully allow action to override 'title' if it provides one
        })).filter(Boolean);
    }

    get commands() {
        const thisCommands = this.model.commands;
        const parentCommands = this.extends?.commands || {};

        return {
            ...parentCommands,
            ...thisCommands
        };
    }

    unWireCommand(id: string) {
        this.wiredCommands.delete(id);
    }
    wireCommand(id: string, callback: (p?: any) => void) {
        this.wiredCommands.set(id, callback);
        return () => this.unWireCommand(id);
    }
    
    invokeCommand(id: string, context: ModelContext, props?: any) {
        const wiredCommand = this.wiredCommands.get(id);
        if (wiredCommand) return wiredCommand(props);

        const command = this.commands[id];
        if (typeof command === "function") {
            return context.withNode(this.node, () => {
                return command.call(this, { ...props, context, node: this.node });
            });
        }
        console.warn(`Command "${id}" was not found at ${this.model.name}, not definded or wire missing`);
    }

    getColor(isDarkMode: boolean) {
        const color = this.color;
        if (!color) return undefined;
        if (typeof color === "string") return color;
        return isDarkMode ? color.dark : color.light;
    }

    getChildrenColor(isDarkMode: boolean) {
        const childrenColor = this.childrenColor;
        if (!childrenColor) return undefined;
        if (typeof childrenColor === "string") return childrenColor;
        return isDarkMode ? childrenColor.dark : childrenColor.light;
    }

    isDraggable(node: NodeModel) {
        if (!node || !node.type) return false;
        const draggable = this.model?.draggable ?? this.extends?.model?.draggable ?? true;
        if (typeof draggable === "function") {
            return draggable(node);
        }
        return Boolean(draggable);
    }

    /**
     * Determines if the current model can be dropped onto the target model.
     * @param target The target NodeModel to check against.
     * @returns A boolean indicating if the current model can be dropped onto the target model.
     */
    isDroppable(target: NodeModel) {
        if (!target || !target.type) return false;
        const droppable = this.model?.droppable ?? this.extends?.model?.droppable ?? true;
        if (typeof droppable === "function") {
            return droppable(target);
        }
        if (Array.isArray(droppable)) {
            return droppable.map(e => String(e).toLocaleLowerCase())
                .includes(String(target.type.name).toLocaleLowerCase());
        }
        return Boolean(droppable);
    }

    /**
     * Determines if the current model can accept the source model as a child.
     * @param source The source NodeModel to check against.
     * @returns A boolean indicating if the current model can accept the source model as a child.
     */
    isAccepted(source: NodeModel) {
        if (!source || !source.type) return false;
        const accepts = this.model?.accepts ?? this.extends?.model?.accepts ?? true;
        if (typeof accepts === "function") {
            return accepts(source);
        }
        if (Array.isArray(accepts)) {
            return accepts.map(e => String(e).toLocaleLowerCase())
                .includes(String(source.type.name).toLocaleLowerCase());
        }
        return Boolean(accepts);
    }

    getDefaultName(nm: NodeContext) {
        const definedName = this.model.default?.name;
        if (typeof definedName === "string") {
            return this.model.default.name;
        }
        if (typeof definedName === "function") {
            return definedName(nm);
        }
        return this.model.name || this.extends?.getDefaultName(nm) || "Unknown";
    }

    getDefaultTagName(nm: NodeContext) {
        const definedTagName = this.model.default?.tagName;
        if (typeof definedTagName === "string") {
            return definedTagName.toLowerCase();
        }
        if (typeof definedTagName === "function") {
            return definedTagName(nm).toLowerCase();
        }
        return this.extends?.getDefaultTagName(nm);
    }

    getDefaultEvents(nm: NodeContext) {
        const definedEvents = this.model.default?.events;
        if (Array.isArray(definedEvents)) {
            return definedEvents;
        }
        if (typeof definedEvents === "function") {
            return definedEvents(nm);
        }
        return this.extends?.getDefaultEvents(nm) || [];
    }

    getDefaultProps(nm: NodeContext): Record<string, any> {
        if (this.model?.default?.props) {
            return this.model.default.props;
        }
        // If A extends B and B extends A, this will recurse until a Stack Overflow
        return this.extends?.getDefaultProps(nm) || {};
    }
}