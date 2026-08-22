export type EventMap = Record<string, (...args: any[]) => any>;


export class EventEmitter<Events extends EventMap = EventMap> {
    private listeners = new Map<keyof Events, Array<Events[keyof Events]>>();

    on<K extends keyof Events>(
        event: K,
        callback: Events[K]
    ): void {
        const list = this.listeners.get(event) ?? [];

        list.push(callback);
        this.listeners.set(event, list);
    }

    off<K extends keyof Events>(
        event: K,
        callback: Events[K]
    ): void {
        const list = this.listeners.get(event);
        if (!list) return;

        this.listeners.set(
            event,
            list.filter(cb => cb !== callback)
        );
    }

    trigger<K extends keyof Events>(
        event: K,
        ...args: Parameters<Events[K]>
    ): void {
        const list = this.listeners.get(event);
        if (!list) return;

        for (const callback of list) {
            callback(...args);
        }
    }
}