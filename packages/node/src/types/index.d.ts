import type { Model, Node } from "@/engine/Model";

export * from "./model";
export * from "./node";

export type MReg = ModelRegistry;
export type INode<T extends MReg = MReg> = Node<T>;
export type IModel<T extends MReg = MReg> = Model<T>;