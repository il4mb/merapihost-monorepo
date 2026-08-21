import { ModelDefinition } from "@/types/model";
export function createModel<T extends ModelName>(definition: ModelDefinition<T>): ModelDefinition<T> {
    return definition;
}