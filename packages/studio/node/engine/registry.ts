// ===================================================================
// Generated: 2026-08-19T21:47:41.059Z
// AUTOMATICALLY GENERATED FILE - DO NOT EDIT
// Modify source files in 'mods/types' or 'mods/blocks' and run watch-node script.
// ===================================================================

import { default as mod0 } from "./../mods/types/element/index";
import { default as mod1 } from "./../mods/types/text/index";
export const TYPE_REGISTRY = new Map<string, any>([
    ["element", mod0],
    ["text", mod1],
]);

export const BLOCK_REGISTRY = new Map<string, any>([
]);

for (const model of TYPE_REGISTRY.values()) {
    const parentName = model?.extendsName;
    if (!parentName) continue;

    const parent = TYPE_REGISTRY.get(String(parentName).toLowerCase());
    if (parent) {
        model.extends = parent;
    }
}
