/**
 * token服务
 * add by boomer 2019-05-03 21:57:11
 */
var Promise = require('bluebird');
var config = require('config-lite'); // 配置
var jwt = require('jsonwebtoken'); // json token

module.exports = {
  /**
   * 设置token 创建token
   * @param {[type]} payload
   * @return {[type]} Object
   */
  setToken (payload) {
    // var expiresIn = Math.floor(Date.now() / 1000) + (1 * 60); // var expiresIn = '24h';
    var expiresIn = Date.now() + 3600000 * 24;// 24小时后
    var token = jwt.sign(payload, config.token.secretOrPrivateKey, {
      expiresIn // 设置过期时间
    });
    return {
      token,
      expiresIn
    };
  },
  /**
   * 验证token是否正确：传入当前token和当前用户uuid
   * @param {[type]} token
   * @param {[type]} userUuid
   * @return {[Object]} promise
   */
  verifyToken (token, userUuid) {
    return new Promise(((resolve, reject) => {
      jwt.verify(token, config.token.secretOrPrivateKey, (err, tokenData) => {
        if (tokenData && tokenData.uuid === userUuid) {
          resolve('token is ok!!!');
        } else {
          Promise.reject('fail');
        }
      });
    }));
  },
  /**
   * 路由验证token
   * @param {[type]} req
   * @param {[type]} res
   * @param {[type]} next
   * @param {[type]} isAdmin
   */
  verifyRouterToken (req, res, next, isAdmin) {
    // accesstoken 被自动转小写了
    var token = req.headers.accesstoken;
    if (!token) { // 如果没有token，则返回错误
      res.json({
        code: '401'
      });
    } else { // 验证token
      jwt.verify(token, config.token.secretOrPrivateKey, (err, tokenData) => { // 只有在token正确时tokenData有值
        if (err) {
          res.json({
            code: '402'
          });
        } else {
          // 验证是否为管理员
          if (isAdmin && !tokenData.isAdmin) {
            res.json({
              code: '403'
            });
          } else if (!isAdmin && tokenData.uuid && !tokenData.isAdmin) {
            // 验证userUuid 避免普通用户登录修改其他人资料
            var { userUuid } = req.body || req.query || req.params;
            if (userUuid && userUuid !== tokenData.uuid) {
              res.json({
                code: '403'
              });
            } else {
              next();
            }
          } else {
            next();
          }
        }
      });
    }
  },
  /**
   * 清除token
   * @param {[type]} token
   * @return {[type]} String
   */
  delToken (token) {
    if (!token) {
      return 'delTokenFail';
    } else {
      jwt.decode(token);
      return 'delTokenSuccess';
    }
  }
};
