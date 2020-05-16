const _ = require('underscore');

const { log, errorType } = require('../../configs');
const middleware = require('../middleware');
const methods = require('./method-map');
const { Users } = require('../../models');

module.exports = socket => {
    socket.on('message', async params => {
        //数据格式化
        let data = null;

        try {
            data = JSON.parse(params);
        } catch (e) {
            log('socket-recieve').error(`unknown message with ${params}`);
        }

        if (data.msg === 'connect') {
            socket.attempt.userId = data.user;
            socket.send(JSON.stringify({ msg: 'connected', session: socket.attempt.connection.id }));
        } else if (data.msg === 'pong') {
            socket.lastPing = +new Date();
        } else if (data.msg === 'sub') {
            socket.send(JSON.stringify({ msg: 'ready', subs: [data.id] }));
        } else if (data.msg === 'method' && methods[data.method]) {
            log(`socket-${data.method}-data`).info(JSON.stringify(data));

            socket.attempt = {
                ...socket.attempt
            };

            //加载所有中间件
            middleware(socket);

            //执行中间件：中间件函数必须return一个object才可以将结果添加到attempt中
            for (const _middleFn of socket.middlewareMap) {
                try {
                    const _result = await _middleFn(data.method, [...data.params], socket);

                    if (_.isObject(_result) && !_.isArray(_result) && !_.isFunction(_result)) {
                        socket.attempt = {
                            ...socket.attempt,
                            ..._result
                        };
                    }
                } catch (e) {
                    socket.send(JSON.stringify({ msg: 'result', id: data.id, result: e.type || errorType.INTERNAL_SERVER_ERROR }));
                    return;
                }
            }

            // log(`socket-do-${data.method}-attempt`).info(JSON.stringify(socket.attempt));

            // 执行具体method，拿到执行结果
            try {
                const result = await methods[data.method]([...data.params], data.method === 'login' ? socket : socket.attempt);

                // log(`socket-do-${data.method}-attempt`).info(JSON.stringify(socket.attempt));
                log(`socket-${data.method}-result`).info(JSON.stringify(result));
                if (data.method === 'login') {
                    const user = await Users.findById(socket.attempt.userId);

                    socket.send(JSON.stringify({ msg: 'added', collection: 'users', id: socket.attempt.userId, fields: { emails: user.emails, username: user.username } }));
                }
                socket.send(JSON.stringify({ msg: 'result', id: data.id, result }));
            } catch (e) {
                log(`socket-${data.method}-result`).error(e);
                socket.send(JSON.stringify({ msg: 'result', id: data.id, error: { reason: e.type || errorType.INTERNAL_SERVER_ERROR } }));
            }
        }
    });
};
