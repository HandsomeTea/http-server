/**
 * 将数字补全为多少位字符串
 */
export default (num: number | string, length?: number): string => {
    if (!length || length < 2) {
        length = 2;
    }

    const _fixLen = length - `${num}`.trim().length;
    const _fixStr = _fixLen > 0 ? (0).toFixed(_fixLen - 1).replace('.', '') : '';

    return _fixStr + num;
};
