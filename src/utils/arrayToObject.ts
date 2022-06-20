/* eslint-disable @typescript-eslint/no-explicit-any */

export function arrayToObject<O extends Record<string, any>, Okey extends keyof O>(source: Array<O>, key: { keyOf: keyof O, valOf: keyof O, keyRepeatOverwrite?: boolean, }): { result: Record<string, O[Okey]>, invalid?: Array<O>, repeat?: Array<O> };
export function arrayToObject<O extends Record<string, any>>(source: Array<O>, key: { keyOf: keyof O, keyRepeatOverwrite?: boolean }): { result: Record<string, O>, invalid?: Array<O>, repeat?: Array<O> };


export function arrayToObject<O extends Record<string, any>, Okey extends keyof O>(source: Array<O>, key: { keyOf: keyof O, valOf?: keyof O, keyRepeatOverwrite?: boolean }): { result: Record<string, O | O[Okey]>, invalid?: Array<O>, repeat?: Array<O> } {
    if (source.length === 0) {
        return {
            result: {}
        };
    }
    const { keyOf, valOf } = key;
    const keyRepeatOverwrite = Boolean(key.keyRepeatOverwrite);

    const result: Record<string, O> = {};
    const invalid: Array<O> = [];
    const repeat: Array<O> = [];

    for (let s = 0; s < source.length; s++) {
        if (typeof source[s][keyOf] !== 'undefined' && source[s][keyOf] !== null && source[s][keyOf] !== '') {
            if (typeof result[source[s][keyOf]] !== 'undefined' && keyRepeatOverwrite === false) {
                repeat.push(source[s]);
            } else {
                result[source[s][keyOf]] = !valOf ? source[s] : source[s][valOf];
            }
        } else {
            invalid.push(source[s]);
        }
    }

    return {
        result,
        ...invalid.length > 0 ? { invalid } : {},
        ...repeat.length > 0 ? { repeat } : {}
    };
}
