const typeIs = data => toString.call(data).replace(/object|\[|]|\s/g, '').toLowerCase();

exports.typeIs = typeIs;
exports.isString = data => typeIs(data) === 'string';
exports.isObject = data => typeIs(data) === 'object';
exports.isArray = data => typeIs(data) === 'array';
exports.isNumber = data => typeIs(data) === 'number';
exports.isBoolean = data => typeIs(data) === 'boolean';
exports.isDate = data => typeIs(data) === 'date';
exports.isFunction = data => typeIs(data).includes('function');
exports.isPromise = data => typeIs(data) === 'promise';
exports.isPromiseFn = data => typeIs(data) === 'asyncfunction';
exports.isUndefined = data => typeIs(data) === 'undefined';
exports.isNull = data => typeIs(data) === 'null';
exports.isError = data => typeIs(data) === 'error';
exports.isSet = data => typeIs(data) === 'set';
exports.isMap = data => typeIs(data) === 'map';
exports.isSymbol = data => typeIs(data) === 'symbol';
exports.isEmpty = data => typeIs(data) === 'string' && data.length === 0
    || typeIs(data) === 'object' && Object.keys(data).length === 0
    || typeIs(data) === 'array' && data.length === 0
    || typeIs(data) === 'set' && data.size === 0;
exports.isEmptyObj = data => typeIs(data) === 'object' && Object.keys(data).length === 0;
exports.isEmptyArr = data => typeIs(data) === 'array' && data.length === 0;
exports.isEmptySet = data => typeIs(data) === 'set' && data.size === 0;
