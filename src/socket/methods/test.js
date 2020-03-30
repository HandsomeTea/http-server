module.exports = (params, attempt) => {
    console.log(`test : ${JSON.stringify(attempt)}`); /* eslint-disable-line no-console */
    return { result: 'success' };
};
