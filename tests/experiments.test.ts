/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { observable } from '../src/observable';

interface ListItem {
    __id: string;
    label: string;
    obj?: {
        val?: number;
    };
}

interface StateData {
    testObject: {
        a: string;
        b: string;
        c: number;
        d: number;
        e: boolean;
        f: boolean;
        g: null;
        h: undefined;
        i: string[];
        j: number[];
        k: ListItem[];
        l?: string;
        m?: string;
        n?: string;
    };
}

const initialStateData: StateData = {
    testObject: {
        a: 'A',
        b: '',
        c: 2,
        d: 0,
        e: true,
        f: false,
        g: null,
        h: undefined,
        i: ['a', 'b', 'c', ''],
        j: [11, 12, 13, 0],
        k: [
            { __id: 'a', label: 'A', },
            { __id: 'b', label: 'B', obj: { val: 2 } },
            { __id: 'c', label: 'C', obj: {} },
        ],
        l: '', // empty string
        m: undefined,
        // n: Do not even set `undefined`
    },
};

describe('Experiments', () => {
    test('Accessing properties of Observable', () => {
        const obs = observable<StateData>(initialStateData);

        expect(
            obs.testObject.a.get()
        ).toBe('A');

        expect(
            obs.testObject.b.get()
        ).toBe('');

        expect(
            obs.testObject.c.get()
        ).toBe(2);

        expect(
            obs.testObject.d.get()
        ).toBe(0);

        expect(
            obs.testObject.e.get()
        ).toBe(true);

        expect(
            obs.testObject.f.get()
        ).toBe(false);

        expect(
            obs.testObject.g.get()
        ).toBeNull();

        expect(
            obs.testObject.h.get()
        ).toBeUndefined();

        expect(
            obs.testObject.i.get()
        ).toEqual(['a', 'b', 'c', '']);

        expect(
            obs.testObject.j.get()
        ).toEqual([11, 12, 13, 0]);

        expect(
            obs.testObject.k.get()
        ).toEqual([
            { __id: 'a', label: 'A', },
            { __id: 'b', label: 'B', obj: { val: 2 } },
            { __id: 'c', label: 'C', obj: {} },
        ]);

        // Access a specific array item
        expect(
            obs.testObject.k[0].get()
        ).toEqual({ __id: 'a', label: 'A', });

        // Access non-existing array item
        expect(
            obs.testObject.k[3].get()
        ).toBeUndefined();

        // Access an object property in a specific array item
        expect(
            obs.testObject.k[0].label.get()
        ).toBe('A');

        // Access a nested object property in a specific array item that does not exist
        expect(
            obs.testObject.k[0].obj.val.get()
        ).toBeUndefined();

        // Access a nested object property in a specific array item that does exist
        expect(
            obs.testObject.k[1].obj.val.get()
        ).toBe(2);

        expect(
            obs.testObject.l.get()
        ).toBe('');

        expect(
            obs.testObject.m.get()
        ).toBeUndefined();

        expect(
            obs.testObject.n.get()
        ).toBeUndefined();
    });
});
