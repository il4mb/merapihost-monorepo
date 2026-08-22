import { Model } from "./Model";
import mod0 from "@/mods/types/element/index";
import mod1 from "@/mods/types/text/index";

export class Container {
    constructor(protected registries: Map<string, Model<any>> = new Map()) {
        [mod0, mod1].forEach(define => {
            if (define && define.name) {
                this.registries.set(define.name, new Model(this, define as any));
            }
        });
    };

    has(name: string): boolean {
        return this.registries.has(name);
    };

    get<T extends ModelName>(name: T): Model<T> | null {
        return this.registries.has(name) ? this.registries.get(name) : null;
    };
}