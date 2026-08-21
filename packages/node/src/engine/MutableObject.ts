import { LifecycleHook } from "./LifecyleHook";

/**
 * Lifecycle Object
 * Manages the lifecycle of nested objects, enforcing write restrictions on specified keys.
 */
export class MutableObject<T extends Record<string, any>, K extends keyof T = keyof T> implements ProxyHandler<T> {

    private writableKeys: Set<keyof T>;

    constructor(
        protected hook: LifecycleHook,
        value: T,
        writableKeys?: K[]
    ) {
        if (writableKeys) {
            this.writableKeys = new Set(writableKeys);
        } else {
            this.writableKeys = new Set(
                (Object.keys(value) as Array<keyof T>).filter((key) =>
                    this.isPublicAndWritable(value, key)
                )
            );
        }

        return new Proxy(value, this as ProxyHandler<T>) as any;
    }

    get(target: T, prop: string | symbol, receiver: any): any {
        const isTargetInstance = receiver === target || (receiver && Object.getPrototypeOf(receiver) === Object.getPrototypeOf(target));
        if (!isTargetInstance) {
            throw new Error(`Accessing property '${String(prop)}' on a non-target instance is not allowed.`);
        }
        // console.log(`MutableObject: Accessing property '${String(prop)}' of node with id '${target.id}'`);
        return Reflect.get(target, prop, receiver);
    }

    set(target: T, prop: string | symbol, value: any, receiver: any): boolean {
        // 1. Direct reference check: If receiver is the proxy itself, target matches.
        // 2. Inheritance check: Check if receiver inherits from target's constructor.
        const isTargetInstance = receiver === target || (receiver && Object.getPrototypeOf(receiver) === Object.getPrototypeOf(target));

        if (!isTargetInstance) {
            if (!this.writableKeys.has(prop as keyof T)) {
                throw new Error(`Property '${String(prop)}' is not writable.`);
            }
        }

        Reflect.set(target, prop, value, receiver);
        this.hook.notifyChange();
        return true;
    }



    /**
     * Checks runtime descriptor up the prototype chain to ensure 
     * property is public, not a method, and writable (has setter or writable: true).
     */
    protected isPublicAndWritable(obj: any, key: keyof T): boolean {

        // 1. Exclude private/internal naming conventions (e.g., '_privateField')
        if (typeof key === "string" && key.startsWith("_")) {
            return false;
        }

        // 2. Exclude methods/functions (methods are read-only references)
        if (typeof obj[key] === "function") {
            return false;
        }

        // 3. Walk prototype chain to find the property descriptor
        let current = obj;
        let desc: PropertyDescriptor | undefined;

        while (current && current !== Object.prototype) {
            desc = Object.getOwnPropertyDescriptor(current, key);
            if (desc) break;
            current = Object.getPrototypeOf(current);
        }

        // If no descriptor is found, default to own enumerable property behavior
        if (!desc) return true;

        // 4. Accessor Descriptor: Must have a setter to be writable
        if (desc.get || desc.set) {
            return typeof desc.set === "function";
        }

        // 5. Data Descriptor: Must be explicitly writable
        return desc.writable === true;
    }
}
