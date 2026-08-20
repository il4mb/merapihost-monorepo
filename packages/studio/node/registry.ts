// ===================================================================
// Generated: 2026-08-20T21:51:16.548Z
// AUTOMATICALLY GENERATED FILE - DO NOT EDIT
// Modify source files in 'mods/types' or 'mods/blocks' and run watch-node script.
// ===================================================================
import { Model } from "./engine/Model";

import mod0 from "./mods/types/element/index";
import mod1 from "./mods/types/text/index";

export interface TypeRegistry {}

export interface BlockRegistry {
}

export const TYPE_REGISTRY = new Map<string, Model<any>>([
  ["element", mod0],
  ["text", mod1],
]);

export const BLOCK_REGISTRY = new Map<string, any>([
]);

const ALL_REGISTRY = new Map([...TYPE_REGISTRY, ...BLOCK_REGISTRY]);

for (const model of ALL_REGISTRY.values()) {
    const parentName = model?.extendsName;
    if (!parentName) continue;

    const parent = ALL_REGISTRY.get(String(parentName).toLowerCase());
    if (parent) {
        model.extends = parent;
    }
}
