import { symbolGetNode, symbolIsEvent, symbolIsObservable } from './globals';
import { isBoolean, isFunction } from './is';
import { doNotify } from './notify';
import {
    ListenerFn,
    NodeValue,
    ObservableChild,
    ObservableListenerDispose,
    TrackingType,
} from './observableInterfaces';
import { onChange } from './onChange';
import { updateTracking } from './tracking';

export class ObservablePrimitiveClass {
    public _node: NodeValue;

    constructor(node: NodeValue) {
        this._node = node;
        this.set = this.set.bind(this);
        this.toggle = this.toggle.bind(this);
    }

    // Getters

    public peek(): any {
        const root = this._node.root;
        if (root.activate) {
            root.activate();
            root.activate = undefined;
        }
        return root._;
    }

    public get(): any {
        const node = this._node;
        updateTracking(node);
        return this.peek();
    }

    // Setters

    public set<T>(value: T | ((prev: T) => T)): ObservableChild<T> {
        if (isFunction(value)) {
            value = value(this._node.root._);
        }
        if (this._node.root.locked) {
            throw new Error(
                process.env.NODE_ENV === 'development'
                    ? '[legend-state] Cannot modify an observable while it is locked. Please make sure that you unlock the observable before making changes.'
                    : '[legend-state] Modified locked observable'
            );
        }
        const root = this._node.root;
        const prev = root._;
        root._ = value;
        doNotify(this._node, value, [], value, prev, 0);
        return this as unknown as ObservableChild<T>;
    }

    public toggle(): boolean {
        const value = this.peek();
        if (isBoolean(value)) {
            this.set(!value);
        } else /* if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') */ {
            throw new Error('[legend-state] Cannot toggle a non-boolean value');
        }
        return !value;
    }


    // Listener

    public onChange<T>(cb: ListenerFn<T>, track?: TrackingType, noArgs?: boolean): ObservableListenerDispose {
        return onChange(this._node, cb, track, noArgs);
    }
}

// Getters
Object.defineProperty(ObservablePrimitiveClass.prototype, symbolGetNode, {
    configurable: true,
    get() {
        return this._node;
    },
});
Object.defineProperty(ObservablePrimitiveClass.prototype, symbolIsObservable, {
    configurable: true,
    value: true,
});
Object.defineProperty(ObservablePrimitiveClass.prototype, symbolIsEvent, {
    configurable: true,
    value: false,
});

// Setters
ObservablePrimitiveClass.prototype.set = function <T>(value: T | ((prev: T) => T)): ObservableChild<T> {
    if (isFunction(value)) {
        value = value(this._node.root._);
    }
    if (this._node.root.locked) {
        throw new Error(
            process.env.NODE_ENV === 'development'
                ? '[legend-state] Cannot modify an observable while it is locked. Please make sure that you unlock the observable before making changes.'
                : '[legend-state] Modified locked observable'
        );
    }
    const root = this._node.root;
    const prev = root._;
    root._ = value;
    doNotify(this._node, value, [], value, prev, 0);
    return this as unknown as ObservableChild<T>;
};
