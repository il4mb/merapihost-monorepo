// ===================================================================
// Generated: 2026-08-21T17:24:35.187Z
// AUTOMATICALLY GENERATED FILE - DO NOT EDIT
// Modify source files in 'mods/types' or 'mods/blocks' and run watch-node script.
// ===================================================================
import { Model } from "./engine/Model";

import mod0 from "./mods/types/element/index";
import mod1 from "./mods/types/text/index";

export const MODEL_REGISTRY = new Map<string, Model<ModelName>>([
    ["element", new Model(mod0 as any)],
    ["text", new Model(mod1 as any)],
]);

export const BLOCK_REGISTRY = new Map<string, any>([
]);

for (const model of MODEL_REGISTRY.values()) {
    const parentName = model?.extendsName;
    if (!parentName) continue;

    const parent = MODEL_REGISTRY.get(String(parentName).toLowerCase());
    if (parent) {
        // @ts-ignore
        model.extends = parent;
    }
}
