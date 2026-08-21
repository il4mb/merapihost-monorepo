import type { INode } from "@/types";

export type EffectCallback = (triggering?: INode<ModelName>) => void | (() => void);

export type EffectDeps = (() => any[]) | (() => any)[] | null;

export type Effect = {
    callback: EffectCallback;
    depsFn: () => any[] | null;       // Always a function that returns current deps
    prevDeps?: any[] | null;
    cleanup?: () => void;
    hasRun?: boolean;
};

export class LifecycleHook {
    private effects: Set<Effect> = new Set();

    /**
     * Register an effect with dependencies.
     * 
     * @param callback - The effect function (optionally returns a cleanup)
     * @param deps - Can be:
     *   - `null` or `undefined`: runs on every notifyChange
     *   - `() => any[]`: lazy function, re‑evaluated each time
     *   - `(() => any)[]`: array of getters, each re‑evaluated each time
     * @returns A cleanup function to remove this effect
     * 
     * @example
     * // Lazy function (most flexible)
     * hook.useEffect(() => console.log(text, count), () => [text, count]);
     * 
     * @example
     * // Array of getters (more concise)
     * hook.useEffect(() => console.log(text, count), [() => text, () => count]);
     * 
     * @example
     * // No dependencies – runs every time
     * hook.useEffect(() => console.log('always runs'), null);
     */
    public useEffect(callback: EffectCallback, deps?: EffectDeps): () => void {
        let depsFn: () => any[] | null;

        if (deps === null || deps === undefined) {
            depsFn = () => null;
        } else if (Array.isArray(deps)) {
            // It's an array of getter functions
            depsFn = () => deps.map(fn => fn());
        } else {
            // It's a lazy function
            depsFn = deps;
        }

        const effect: Effect = {
            callback,
            depsFn,
            prevDeps: null,
            hasRun: false,
        };

        this.effects.add(effect);

        return () => {
            if (effect.cleanup) effect.cleanup();
            this.effects.delete(effect);
        };
    }

    /**
     * Notify that something changed – re‑evaluates all effects.
     */
    public notifyChange(triggering?: INode<ModelName>): void {
        for (const effect of this.effects) {
            const currentDeps = effect.depsFn();

            let shouldRun = false;

            if (currentDeps === null) {
                // No deps → run every time
                shouldRun = true;
            } else if (!effect.hasRun || effect.prevDeps === undefined) {
                // First run
                shouldRun = true;
            } else {
                // Compare using Object.is on each element
                shouldRun = currentDeps.some(
                    (dep, index) => !Object.is(dep, effect.prevDeps![index])
                );
            }

            if (shouldRun) {
                // Run cleanup if any
                if (typeof effect.cleanup === "function") {
                    try {
                        effect.cleanup();
                    } catch (error) {
                        console.error("Error during effect cleanup:", error);
                    }
                    effect.cleanup = undefined;
                }

                // Store current deps for next comparison
                effect.prevDeps = currentDeps ? [...currentDeps] : null;
                effect.hasRun = true;

                // Execute the callback
                try {
                    const cleanup = effect.callback(triggering);
                    if (typeof cleanup === "function") {
                        effect.cleanup = cleanup;
                    }
                } catch (error) {
                    console.error("Error executing lifecycle effect:", error);
                }
            }
        }
    }

    /**
     * Manually update the dependency getter for an existing effect.
     */
    public updateDeps(effect: Effect, newDeps: EffectDeps): void {
        if (Array.isArray(newDeps)) {
            effect.depsFn = () => newDeps.map(fn => fn());
        } else if (typeof newDeps === 'function') {
            effect.depsFn = newDeps;
        } else {
            effect.depsFn = () => null;
        }
        // Reset so the effect will run on next notify
        effect.prevDeps = null;
        effect.hasRun = false;
    }

    /**
     * Dispose all effects (runs all cleanups).
     */
    public dispose(): void {
        for (const effect of this.effects) {
            if (typeof effect.cleanup === "function") {
                try {
                    effect.cleanup();
                } catch (error) {
                    console.error("Error during effect disposal:", error);
                }
            }
        }
        this.effects.clear();
    }
}