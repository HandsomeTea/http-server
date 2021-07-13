/** 字符串转义 */
export const escapeRegExp = (str: string): string => {
    return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
};

/** 首字母大写 */
export const capitalize = (str: string): string => {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
};
