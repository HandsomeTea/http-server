// const _ = require('underscore');

// const { createLoginToken, tokenExpiration, hashStampedToken } = require('../../utils');
// const { Users, Sessions } = require('../../models');
// const { redisService, HTTP } = require('../../services');
// const { completeUserData, checkAvInfo, updateEmail, checkMettingRoom } = require('./function');
// const { auditLogger, devLogger } = require('../../configs/log');
// const { errorType } = require('../../configs/error');

module.exports = async (/*params, socket*/) => {
    // const { userId, type, form } = socket.attempt;
    // const _user = await Users.findById(userId);

    // if (!_user) {
    //     throw new Exception('user is not found.', errorType.USER_NOT_FOUND);
    // }


    // // set user session
    // await Sessions.insertUserSession(userId, socket.attempt.connection.id, socket.attempt.connection.device);

    // // add to global socket map
    // if (!global.WebsocketServerMap[userId]) {
    //     global.WebsocketServerMap[userId] = new Set();
    // }
    // global.WebsocketServerMap[userId].add(socket);

    // // login success
    // auditLogger({ user: _user.name, operate: 'LOGIN', server: 'USER', ip: socket.attempt.connection.ip }, `login-${type}-success`, 'tranx-proxy').info(`${userId} login by ${type} success.`);
    // return {
    //     id: userId,
    //     token: stampedLoginToken.token,
    //     tokenExpires: { $date: tokenExpiration(stampedLoginToken.when) },
    //     type
    // };
};
