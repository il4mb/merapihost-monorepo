import type { NodeModel, TypeComponent, TypeModel } from "@/types";
import { NodeContext } from "./NodeModel";
import { REGISTRY } from ".";
import { merge } from "lodash";

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

    get data() {
        let currentModel: TypeModel | undefined = this.model;
        let mergedData: Record<string, unknown> = {};
        while (currentModel) {
            mergedData = merge({}, currentModel.data, mergedData);
            const parentTypeName = currentModel.extends;
            if (parentTypeName) {
                const parentModel = REGISTRY[parentTypeName.toLowerCase()];
                if (parentModel) {
                    currentModel = parentModel.model;
                } else {
                    currentModel = undefined;
                }
            } else {
                currentModel = undefined;
            }
        }
        return mergedData as Record<string, unknown>;
    }

    get name() {
        return String(this.model?.name);
    }

    get extends() {
        const extendsType = this.model?.extends;
        if (!extendsType) return null;
        const parentModel = REGISTRY[extendsType.toLowerCase()];
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

    get visibleOnTree() {
        return this.model?.visibleOnTree ?? this.extends?.visibleOnTree ?? true;
    }

    get render() {
        return this.type; // Return the component itself for rendering
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
            return droppable.includes(target?.type?.name);
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
            return accepts.includes(source.type.name);
        }
        return Boolean(accepts);
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

    getDefaultTagName(nm: NodeContext) {
        if (typeof this.model?.default?.tagName === "string") {
            return this.model.default.tagName;
        }
        if (typeof this.model?.default?.tagName === "function") {
            return this.model.default.tagName(nm);
        }
        return this.extends?.getDefaultTagName(nm) || "div";
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