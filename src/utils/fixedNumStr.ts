/**
 * 将数字补全为多少位字符串
 */
export function fixedNumString(num: number, length: number): string
export function fixedNumString(num: string, length: number): string
export function fixedNumString(num: number): string
export function fixedNumString(num: string): string
export function fixedNumString(num: number | string, length?: number) {
    if (!length || length < 2) {
        length = 2;
    }

    const _fixLen = length - `${num}`.trim().length;
    const _fixStr = _fixLen > 0 ? (0).toFixed(_fixLen - 1).replace('.', '') : '';

    return _fixStr + num;
}
