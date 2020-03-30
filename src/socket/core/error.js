module.exports = socket => {
    socket.on('error', err => {
        console.log(err); /* eslint-disable-line no-console */
    });
};
