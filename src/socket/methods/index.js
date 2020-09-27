const { log, errorType } = require('../../configs');
const middleware = require('../middleware');
const methods = require('./method-map');
const { Users } = require('../../models');

module.exports = socket => {
    socket.on('message', async parameter => {
        //数据格式化
        let data = null;

        try {
            data = JSON.parse(parameter);
        } catch (e) {
            log('socket-recieve').error(`unknown message with ${parameter}`);
        }

        const { msg, method, id, params } = data;

        if (msg === 'connect') {
            socket.send(JSON.stringify({ msg: 'connected', session: socket.attempt.connection.id }));
        } else if (msg === 'pong') {
            // socket.lastPing = +new Date();
        } else if (msg === 'ping') {
            socket.send(JSON.stringify({ msg: 'pong' }));
        } else if (msg === 'sub') {
            socket.send(JSON.stringify({ msg: 'ready', subs: [id] }));
        } else if (msg === 'method' && methods[method]) {
            log(`socket-method:${method}-parameter`).debug(parameter);

            socket.attempt = {
                ...socket.attempt
            };

            //加载所有中间件
            middleware(socket);

            //执行中间件：中间件函数必须return一个object才可以将结果添加到attempt中
            for (const _middlewareFn of socket.middlewareMap) {
                try {
                    const _result = await _middlewareFn(method, [...params], socket);

                    if (_result && _result.constructor === Object) {
                        socket.attempt = {
                            ...socket.attempt,
                            ..._result
                        };
                    }
                } catch (e) {
                    log('socket-middleware').error(e);
                    socket.send(JSON.stringify({ msg: 'result', id: id, error: { reason: e.message || e.msg, error: e.type || errorType.INTERNAL_SERVER_ERROR } }));
                    return;
                }
            }

            if (method === 'login') {
                log(`socket-${method}-attempt`).debug(JSON.stringify(socket.attempt));
            }

            // 执行具体method，拿到执行结果
            try {
                const result = await methods[method]([...params], method === 'login' ? socket : socket.attempt);

                log(`socket-method:${method}-result`).debug(JSON.stringify(result));
                if (method === 'login') {
                    const user = await Users.findById(socket.attempt.userId);

                    socket.send(JSON.stringify({ msg: 'added', collection: 'users', id: socket.attempt.userId, fields: { email: user.email, username: user.username } }));
                }

                socket.send(JSON.stringify({ msg: 'result', id, result }));
            } catch (e) {
                log(`socket-method:${method}-result`).error(e);
                if (method === 'surpass') {
                    socket.send(JSON.stringify({
                        msg: 'result',
                        id,
                        result: JSON.stringify({
                            status: e.status || 500,
                            type: e.type || errorType.INTERNAL_SERVER_ERROR,
                            msg: e.msg || e.message
                        })
                    }));
                } else {
                    socket.send(JSON.stringify({ msg: 'result', id, error: { reason: e.message || e.msg, error: e.type || errorType.INTERNAL_SERVER_ERROR } }));
                }
            }
        } else {
            log('socket-recieve').error('unknown socket action:');
            log('socket-recieve').error(params);
        }
    });
};
