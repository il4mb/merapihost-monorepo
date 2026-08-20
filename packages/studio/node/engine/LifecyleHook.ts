import { NodeFiber } from "./NodeFiber";

export type EffectCallback = () => void | (() => void);
export type Effect = {
    callback: EffectCallback;
    deps: any[];
    prevDeps: any[] | null;
    cleanup?: () => void;
};

export class LifecycleHook {

    readonly fibers: Map<string, NodeFiber> = new Map();
    private effects: Set<Effect> = new Set();

    constructor() {

    }

    public useEffect(callback: () => void | (() => void), deps: any[]) {
        this.effects.add({ callback, deps, prevDeps: null });
    }
    public triggerEffects() {
        for (const effect of this.effects) {
            const hasNoDeps = !effect.deps;
            const hasChangedDeps = effect.prevDeps === null ||
                effect.deps.some((dep, i) => !Object.is(dep, effect.prevDeps![i]));

            if (hasNoDeps || hasChangedDeps) {
                // 1. Run cleanup from the previous execution if it exists
                if (effect.cleanup) {
                    effect.cleanup();
                }

                // 2. Run the actual effect callback
                const cleanup = effect.callback();

                // 3. Store the cleanup function if returned
                if (typeof cleanup === 'function') {
                    effect.cleanup = cleanup;
                }

                // 4. Update previous dependencies for the next cycle
                effect.prevDeps = [...effect.deps];
            }
        }
    }
}