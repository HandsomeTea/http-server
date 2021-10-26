import { log, errorType } from '@/configs';
import middleware from '../middleware';
import * as methods from './method-map';
import { MyWebSocket } from '../../../websocket';

export default (socket: MyWebSocket): void => {
    socket.on('message', async parameter => {
        //数据格式化
        let data = null;

        try {
            data = JSON.parse(parameter.toString());
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

                    if (_result?.constructor === Object) {
                        socket.attempt = {
                            ...socket.attempt,
                            ..._result
                        };
                    }
                } catch (error) {
                    log('socket-middleware').error(error);
                    const e = error as InstanceException;

                    if (method === 'login') {
                        socket.send(JSON.stringify({ msg: 'result', id, type: e.code || errorType.INTERNAL_SERVER_ERROR, reason: e.reason || [], data: {} }));
                    } else {
                        socket.send(JSON.stringify({ msg: 'result', id: id, error: { reason: e.message, error: e.code || errorType.INTERNAL_SERVER_ERROR } }));
                    }
                    return;
                }
            }

            if (method === 'login') {
                log(`socket-${method}-attempt`).debug(JSON.stringify(socket.attempt));
            }

            // 执行具体method，拿到执行结果
            try {
                const result = await methods[method]([...params], method === 'login' ? socket : socket.attempt);

                socket.send(JSON.stringify({ msg: 'result', id, type: 'SUCCESS', reason: [], data: result || {} }));
            } catch (error) {
                const e = error as InstanceException;

                log(`socket-method:${method}-result`).error(e);
                socket.send(JSON.stringify({ msg: 'result', id, type: e.code || errorType.INTERNAL_SERVER_ERROR, reason: e.reason || [], data: {} }));
            }
        } else {
            log('socket-recieve').error('unknown socket action:');
            log('socket-recieve').error(params);
        }
    });
};
