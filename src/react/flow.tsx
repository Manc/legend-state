import { isFunction } from '@legendapp/state';
import { createElement, FC, memo, ReactElement, ReactNode, Fragment, useMemo, useRef } from 'react';
import { observer } from '../../react-components';
import type {
    Observable,
    ObservableObject,
    ObservableReadable,
    Selector,
    TrackingTypeInternal,
} from '../observableInterfaces';
import { useSelector } from './useSelector';
import { findIDKey, IDKey, IDValue } from '../globals';

export function Computed({ children }: { children: () => ReactNode }): ReactElement {
    return useSelector(children, { shouldRender: true }) as ReactElement;
}

export const Memo = memo(
    function Memo({ children }: { children: () => ReactNode }): ReactElement {
        return useSelector(children, { shouldRender: true }) as ReactElement;
    },
    () => true
);

export function Show<T>(props: {
    if: Selector<T>;
    else?: ReactNode | (() => ReactNode);
    wrap?: FC;
    children: ReactNode | ((value?: T) => ReactNode);
}): ReactElement;
export function Show<T>({
    if: if_,
    else: else_,
    wrap,
    children,
}: {
    if: Selector<T>;
    else?: ReactNode | (() => ReactNode);
    wrap?: FC;
    children: ReactNode | (() => ReactNode);
}): ReactElement {
    const value = useSelector<T>(if_);

    const child = (
        value ? (isFunction(children) ? children() : children) : else_ ? (isFunction(else_) ? else_() : else_) : null
    ) as ReactElement;

    return wrap ? createElement(wrap, undefined, child) : child;
}

export function Switch<T>({
    value,
    children,
}: {
    value: Selector<T>;
    children: Record<any, () => ReactNode>;
}): ReactElement {
    return (children[useSelector(value)]?.() ?? children['default']?.() ?? null) as ReactElement;
}

type ObjectWithSomeID = ({ id: IDValue } | { _id: IDValue } | { __id: IDValue }) & { [key in IDKey]?: IDValue };
// type ObjectWithID<T extends IDKey> = {
//     [key in T]: IDValue;
// }

type ForItemComponent<T> = (props: { item: Observable<T> }) => ReactElement | null;
type ForChildrenFn<T> = (value: Observable<T>) => ReactElement | null;

// export type ForProps<T extends ObjectWithID<K> = ObjectWithSomeID, K extends IDKey = 'id'> = {
export type ForProps<T extends ObjectWithSomeID> = {
    each: ObservableReadable<T[]>;
    optimized?: boolean;
    // itemProps?: TProps; // TODO: Removed `itemProps` for now to simplify typing (feature is not documented)
} & (
    | {
          item: ForItemComponent<T>;
          children?: undefined;
      }
    | {
          item?: undefined;
          children: ForChildrenFn<T>;
      }
);

// export function For<P extends ForProps<ObjectWithSomeID>>(props: P): ReactElement<any, any> | null {
export function For<T extends ObjectWithSomeID = any>(props: ForProps<T>): ReactElement | null {
    const {
        each,
        optimized,
        item,
        // itemProps,
        children,
    } = props;
    // Get the raw value with a shallow listener so this list only re-renders
    // when the array length changes
    const trackingType: TrackingTypeInternal = optimized ? 'optimize' : true;
    const values = useSelector(() => each.get(trackingType as any), {
        shouldRender: true,
    });

    let actualItemComponent: ForItemComponent<T> | undefined;

    // The child function gets wrapped in a memoized observer component
    if (item) {
        actualItemComponent = item;
    } else if (children) {
        // Update the ref so the generated component uses the latest function
        const refChildren = useRef<ForChildrenFn<T>>(children);

        actualItemComponent = useMemo(() => observer(({ item }) => refChildren.current(item)), []);
    }

    if (!values || !actualItemComponent) return null;

    // Get the appropriate id field
    const idKey: IDKey | undefined = findIDKey(values[0]);
    if (!idKey) {
        console.warn('[legend-state] Objects in array require an ID');
        return null;
    }

    // Create the child elements
    const out = values.map<ReactElement>((itemValue, index) => {
        const id = idKey in itemValue ? itemValue[idKey] : index;
        const obs = (each as any)[index]; // TODO
        const reactElement = createElement(actualItemComponent, {
            key: id,
            item: obs,
        });
        return reactElement;
    });

    return createElement(Fragment, { children: out });
    // return out as unknown as ReactElement;
}
