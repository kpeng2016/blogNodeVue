/**
 * 检查中间件
 * add by boomer 2019-05-03 21:57:26
 */
var tokenService = require('../services/token'); // token服务

module.exports = {
  /**
   * 检验普通用户token
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
   */
  checkToken (req, res, next) {
    tokenService.verifyRouterToken(req, res, next);
  },

  /**
   * 检验管理员token
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
   */
  checkAdminToken (req, res, next) {
    console.log('checkAdminToken');
    tokenService.verifyRouterToken(req, res, next, true);
  }
};
