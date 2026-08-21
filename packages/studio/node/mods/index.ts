import { ModelDefinition, RegistryKey } from "@nodes/types/type";
export function createModel<T extends RegistryKey>(definition: ModelDefinition<T>): ModelDefinition<T> {
    return definition;
}