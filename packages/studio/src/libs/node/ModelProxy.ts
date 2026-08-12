import type { TypeModel } from "@/types";
import { NodeContext } from "./NodeModel";
import { REGISTRY } from ".";

/**
 * A proxy class that wraps a TypeModel and provides access to its properties, including inherited properties from parent models.
 * This class allows for easy retrieval of model information, including default values and properties that may be defined in parent models.
 */
export class ModelProxy {

    readonly realModel: TypeModel | null = null;

    constructor(model: TypeModel) {
        this.realModel = model;
    }

    get name() {
        return this.realModel?.name || this.extends?.name || "Unknown";
    }

    get extends() {
        const extendsType = this.realModel?.extends;
        if (!extendsType) return null;
        const parentModel = REGISTRY[extendsType]?.model;
        if (!parentModel) return null;
        return new ModelProxy(parentModel);
    }

    get icon() {
        return this.realModel?.icon || this.extends?.icon || null;
    }

    get color() {
        return this.realModel?.color || this.extends?.color || undefined;
    }

    get childrenColor() {
        return this.realModel?.childrenColor || this.extends?.childrenColor || undefined;
    }

    get draggable() {
        return this.realModel?.draggable ?? this.extends?.draggable ?? true;
    }

    get droppable() {
        return this.realModel?.droppable ?? this.extends?.droppable ?? true;
    }

    get accepts() {
        return this.realModel?.accepts ?? this.extends?.accepts ?? true;
    }

    get visibleOnTree() {
        return this.realModel?.visibleOnTree ?? this.extends?.visibleOnTree ?? true;
    }

    getDefaultName(nm: NodeContext) {
        if (typeof this.realModel?.default?.name === "string") {
            return this.realModel.default.name;
        }
        if (typeof this.realModel?.default?.name === "function") {
            return this.realModel.default.name(nm);
        }
        return this.realModel.name || this.extends?.getDefaultName(nm) || "Unknown";
    }

    getDefaultEvents(nm: NodeContext) {
        if (Array.isArray(this.realModel?.default?.events)) {
            return this.realModel.default.events;
        }
        if (typeof this.realModel?.default?.events === "function") {
            return this.realModel.default.events(nm);
        }
        return this.extends?.getDefaultEvents(nm) || [];
    }

    getDefaultProps(nm: NodeContext) {
        if (this.realModel?.default?.props) {
            return this.realModel.default.props;
        }
        return this.extends?.getDefaultProps(nm) || {};
    }
}