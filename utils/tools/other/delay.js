module.exports = (_time = 0) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, _time);
    });
};