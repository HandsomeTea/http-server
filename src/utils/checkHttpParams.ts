import { errorType } from '../configs';

/**
 * 用于检查函数参数的合法性
 *
 * @param {*} param 要检查的参数或变量
 * @param {*} type 指定要检查的参数的constructor，仅支持String|Object|Array和具体的Object，如：{type: String, required: true, notEmpty: true, msg: '', error: 'INVALID_ARGUMENTS'}
 * @param {boolean} [allowedEmpty] 是否允许为空，当type为具体的Object时，这个参数无效
 * @param {string} [error] 被检查的参数不合法时抛出的错误的type，默认errorType.INVALID_ARGUMENTS
 * @param {string} [msg] 被检查的参数不合法时，抛出的错误信息
 * @returns {boolean|Error}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (param: any, type: any, allowedEmpty = true, error = errorType.INVALID_ARGUMENTS, msg?: string): void => { // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
    const empty = new Set([null, undefined]);

    // 参数检查
    if (empty.has(param)) {
        throw new Exception(msg || `Invalid arguments: ${param}`, error);
    }

    if (empty.has(type)) {
        throw new Exception(msg || `Invalid arguments: ${type}`, error);
    }

    const supportedConstructor = new Set([String, Array, Object]);

    if (supportedConstructor.has(type)) {
        // 基础类型检查
        if (param.constructor !== type) {
            throw new Exception(msg || `Invalid arguments: require ${typeof new type()}, but get ${typeof param}`, error);
        }

        // 不为空检查
        if (!allowedEmpty) {
            if (type === String && param.trim() === '') {
                throw new Exception(msg || 'Invalid arguments: not allowed empty string.', error);
            }

            if (type === Object && Object.keys(param).length === 0) {
                throw new Exception(msg || 'Invalid arguments: not allowed empty object.', error);
            }

            if (type === Array && param.length === 0) {
                throw new Exception(msg || 'Invalid arguments: not allowed empty array.', error);
            }
        }
    }

    // 对象键值匹配检查
    if (type.constructor === Object) {
        if (param.constructor !== Object) {
            throw new Exception(msg || `Invalid arguments: require object, but get ${typeof param}`, error);
        }

        for (const key in type) {
            // 只验证键值的constructor，
            if (supportedConstructor.has(type[key])) {
                if (param[key] && param[key].constructor !== type[key]) {
                    throw new Exception(`Invalid arguments: require object key "${key}" is ${typeof new type[key]()}, but get ${typeof param[key]}`, errorType.INVALID_ARGUMENTS);
                }
            } else if (type[key].constructor === Object) {//验证键值的更多要求：是否允许为空，是否必须
                if (supportedConstructor.has(type[key].type)) {
                    // 验证键值是否必须
                    if (type[key].required === true && empty.has(param[key])) {
                        throw new Exception(type[key].msg || `Invalid arguments: object key "${key}" is required.`, type[key].error || errorType.INVALID_ARGUMENTS);
                    }

                    if (!empty.has(param[key])) {
                        // 验证键值的constructor，
                        if (param[key].constructor !== type[key].type) {
                            throw new Exception(type[key].msg || `Invalid arguments: require object key "${key}" is ${typeof new type[key].type()}, but get ${typeof param[key]}`, type[key].error || errorType.INVALID_ARGUMENTS);
                        }

                        // 验证键值是否为空
                        if (type[key].notEmpty === true) {
                            if (type[key].type === String && param[key].trim() === '') {
                                throw new Exception(type[key].msg || `Invalid arguments: object key "${key}" not allowed empty string.`, type[key].error || errorType.INVALID_ARGUMENTS);
                            }

                            if (type[key].type === Object && Object.keys(param[key]).length === 0) {
                                throw new Exception(type[key].msg || `Invalid arguments: object key "${key}" not allowed empty object.`, type[key].error || errorType.INVALID_ARGUMENTS);
                            }

                            if (type[key].type === Array && param[key].length === 0) {
                                throw new Exception(type[key].msg || `Invalid arguments: object key "${key}" not allowed empty array.`, type[key].error || errorType.INVALID_ARGUMENTS);
                            }
                        }
                    }
                }
            } else {
                // 未知检查条件
            }
        }
    }
};
