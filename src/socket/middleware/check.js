
module.exports = async (method/*, params, socket*/) => {
    if (method !== 'login') {
        return {
            a: 'into attempt a'
        };
    } else {
        return new Error('middle test error');
    }
};
