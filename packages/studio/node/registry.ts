// ===================================================================
// Generated: 2026-08-20T19:09:27.233Z
// AUTOMATICALLY GENERATED FILE - DO NOT EDIT
// Modify source files in 'mods/types' or 'mods/blocks' and run watch-node script.
// ===================================================================
import { Model } from "./engine/Model";

import mod0 from "./mods/types/element/index";
import mod1 from "./mods/types/text/index";

export interface TypeRegistry {
    "element": typeof mod0;
    "text": typeof mod1;
}

export interface BlockRegistry {
}

export const TYPE_REGISTRY = new Map<string, Model<keyof TypeRegistry>>([
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
