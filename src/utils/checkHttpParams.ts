import { errorType } from '../configs';

type CheckType = StringConstructor | ArrayConstructor | ObjectConstructor

interface CheckRuleType {
    type: CheckType,
    notEmpty?: boolean
    required?: boolean
    msg?: string
    error?: string
}

/**
 * 检查数据的合法性
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default (param: any, type: CheckType | { [x: string]: CheckType | CheckRuleType }, allowedEmpty = true, error = errorType.INVALID_ARGUMENTS, msg?: string): void => {// eslint-disable-line @typescript-eslint/no-explicit-any
    if (param === null || param === undefined) {
        throw new Exception(msg || `Invalid arguments: ${param}`, error);
    }

    if (type === String || type === Array || type === Object) {
        /**
         * example:
         * check(x, String, false);
         */

        if (param.constructor !== type) {
            throw new Exception(msg || `Invalid arguments: require ${typeof new type()}, but get ${param} is type of ${typeof param}`, error);
        }

        if (!allowedEmpty) {
            if (type === String && typeof param === 'string' && param.trim() === '') {
                throw new Exception(msg || 'Invalid arguments: not allowed empty string.', error);
            }

            if (type === Object && Object.keys(param).length === 0) {
                throw new Exception(msg || 'Invalid arguments: not allowed empty object.', error);
            }

            if (type === Array && Array.isArray(param) && param.length === 0) {
                throw new Exception(msg || 'Invalid arguments: not allowed empty array.', error);
            }
        }
    } else {
        if (param.constructor !== Object) {
            throw new Exception(msg || `Invalid arguments: require object, but get ${typeof param}`, error);
        }

        for (const key in type) {
            if (type[key] === String || type[key] === Array || type[key] === Object) {
                /**
                 * example:
                 *  check(x, {
                        key1: String
                    });
                 */

                if (param[key] && param[key].constructor !== type[key]) {
                    throw new Exception(`Invalid arguments: require object key "${key}" is ${typeof new type[key]()}, but get ${param[key]} is type of ${typeof param[key]}`, errorType.INVALID_ARGUMENTS);
                }
            } else {
                /**
                 * example:
                 *  check(x, {
                        key1: { type: String, required: true, notEmpty: true }
                    });
                 */
                const rule = type[key] as CheckRuleType;

                if (rule.type === String || rule.type === Array || rule.type === Object) {
                    if (rule.required === true && (param[key] === null || param[key] === undefined)) {
                        throw new Exception(rule.msg || `Invalid arguments: object key "${key}" is required.`, rule.error || errorType.INVALID_ARGUMENTS);
                    }

                    if (param[key] !== null && param[key] !== undefined) {
                        if (param[key].constructor !== rule.type) {
                            throw new Exception(rule.msg || `Invalid arguments: require object key "${key}" is ${typeof new rule.type()}, but get ${typeof param[key]}`, rule.error || errorType.INVALID_ARGUMENTS);
                        }

                        if (rule.notEmpty === true) {
                            if (rule.type === String && typeof param[key] === 'string' && param[key].trim() === '') {
                                throw new Exception(rule.msg || `Invalid arguments: object key "${key}" not allowed empty string.`, rule.error || errorType.INVALID_ARGUMENTS);
                            }

                            if (rule.type === Object && Object.keys(param[key]).length === 0) {
                                throw new Exception(rule.msg || `Invalid arguments: object key "${key}" not allowed empty object.`, rule.error || errorType.INVALID_ARGUMENTS);
                            }

                            if (rule.type === Array && Array.isArray(param[key]) && param[key].length === 0) {
                                throw new Exception(rule.msg || `Invalid arguments: object key "${key}" not allowed empty array.`, rule.error || errorType.INVALID_ARGUMENTS);
                            }
                        }
                    }
                }
            }
        }
    }
};
