
module.exports = async (method/*, params, socket*/) => {
    if (method !== 'login') {
        return {
            a: 'into attempt a'
        };
    } else {
        throw new Error('middle test error');
    }
};
