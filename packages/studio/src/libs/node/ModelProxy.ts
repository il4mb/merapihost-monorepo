import type { TypeComponent, TypeModel } from "@/types";
import { NodeContext } from "./NodeModel";
import { REGISTRY } from ".";

/**
 * A proxy class that wraps a TypeModel and provides access to its properties, including inherited properties from parent models.
 * This class allows for easy retrieval of model information, including default values and properties that may be defined in parent models.
 */
export class ModelProxy {

    readonly type: TypeComponent;
    readonly model: TypeModel;

    constructor(type: TypeComponent) {
        this.type = type;
        this.model = type.model;
    }

    get name() {
        return this.model?.name || this.extends?.name || "Unknown";
    }

    get extends() {
        const extendsType = this.model?.extends;
        if (!extendsType) return null;
        const parentModel = REGISTRY[extendsType];
        if (!parentModel) return null;
        return new ModelProxy(parentModel);
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

    get accepts() {
        return this.model?.accepts ?? this.extends?.accepts ?? true;
    }

    get visibleOnTree() {
        return this.model?.visibleOnTree ?? this.extends?.visibleOnTree ?? true;
    }

    get render() {
        return this.type; // Return the component itself for rendering
    }

    getDefaultName(nm: NodeContext) {
        if (typeof this.model?.default?.name === "string") {
            return this.model.default.name;
        }
        if (typeof this.model?.default?.name === "function") {
            return this.model.default.name(nm);
        }
        return this.model.name || this.extends?.getDefaultName(nm) || "Unknown";
    }

    getDefaultEvents(nm: NodeContext) {
        if (Array.isArray(this.model?.default?.events)) {
            return this.model.default.events;
        }
        if (typeof this.model?.default?.events === "function") {
            return this.model.default.events(nm);
        }
        return this.extends?.getDefaultEvents(nm) || [];
    }

    getDefaultProps(nm: NodeContext): Record<string, any> {
        if (this.model?.default?.props) {
            return this.model.default.props;
        }
        return this.extends?.getDefaultProps(nm) || {};
    }
}