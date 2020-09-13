/**
 * admin controllers
 * add by wwj
 * 2017-01-05 11:42:54
 */
var co = require('co');
var md5 = require('blueimp-md5'); // md5 加密
var i18n = require('i18n'); // i18n 国际化
var utils = require('../libs/utils'); // 工具类
var { AdminUser } = require('../models/index'); // 管理员
var tokenService = require('../services/token'); // token服务

module.exports = {
  /**
   * 登录 post
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
  */
  login (req, res, next) {
    // 参数
    var params = req.body;
    var userName = utils.trim(params.userName);
    var password = utils.trim(params.password);
    // 检查用户名、密码是否为空
    console.log('=== login admin.js ===');
    if (!userName || !password) {
      utils.handleJson({
        response: res,
        msg: i18n.__('userNameOrPwdNull')
      });
      return;
    }
    co(function * () {
      var userResult = yield AdminUser.findOne({
        where: {
          userName
        }
      });
      if (!userResult) { // 用户不存在
        utils.handleJson({
          response: res,
          msg: i18n.__('adminUserNotExist')
        });
        return;
      }
      // 存在该用户
      var user = userResult.dataValues;
      // 检查密码
      if (md5(password) !== user.password) {
        // 密码不正确
        utils.handleJson({
          response: res,
          msg: i18n.__('passwordError')
        });
        return;
      }
      // 登录成功
      delete user.password; // 删除密码
      // succss
      utils.handleJson({
        response: res,
        msg: i18n.__('loginSuccess'),
        result: {
          user,
          accessToken: tokenService.setToken({
            uuid: user.uuid,
            isAdmin: true// admin标识
          }) // token
        }
      });
    })['catch']((error) => {
      // err
      utils.handleError({
        response: res,
        error
      });
    });
  },
  /**
   * 退出登录 get
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
   */
  logout (req, res, next) {
    // 清空当前用户的token
    var token = req.headers.accesstoken;
    var result = tokenService.delToken(token);
    // 退出登录
    utils.handleJson({
      response: res,
      msg: i18n.__('logoutSuccess'),
      result
    });
  },
  /**
   * 根据用户对象更新token post
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
  */
  updateAccessToken (req, res, next) {
    var params = req.body;
    var { userUuid } = params;
    var { token } = params;
    if (!userUuid || !token) {
      // fail
      utils.handleJson({
        response: res,
        msg: i18n.__('doFail')
      });
      return;
    }
    co(function * () {
      // 验证token
      yield tokenService.verifyToken(token, userUuid);
      // success
      utils.handleJson({
        response: res,
        msg: i18n.__('tokenUpdate'),
        result: {
          accessToken: tokenService.setToken({
            uuid: userUuid
          }) // token
        }
      });
    })['catch']((error) => {
      // err
      utils.handleError({
        response: res,
        error
      });
    });
  },
  /**
   * 创建管理员 post
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
   */
  createAdminUser (req, res, next) {
    console.log('=== in admin.js ===');
    // 参数
    var params = req.body;
    var userName = utils.trim(params.userName);
    var password = utils.trim(params.password);
        console.log('=== username ===', req.body, '=== password ===', password);
    // 检查用户名、密码是否为空
    if (!userName || !password) {
      utils.handleJson({
        response: res,
        msg: i18n.__('userNameOrPwdNull')
      });
      return;
    }
    co(function * () {
      var userResult = yield AdminUser.findOne({
        where: {
          userName
        }
      });
      // 用户已被注册
      if (userResult) {
        utils.handleJson({
          response: res,
          msg: i18n.__('adminUserHadReg')
        });
        return;
      }
      // 注册
      userResult = yield AdminUser.create({
        userName,
        password: md5(password),
        role: utils.trim(params.role) || '1' // 角色 1超级管理员、2普通管理员
      });
      if (!userResult) { // 注册失败
        utils.handleJson({
          response: res,
          msg: i18n.__('regFail')
        });
        return;
      }
      // 管理员
      var user = userResult.dataValues;
      // 登录成功
      delete user.password; // 删除密码
      // succss
      utils.handleJson({
        response: res,
        msg: i18n.__('regSuccess'),
        result: {
          user,
          accessToken: tokenService.setToken({
            uuid: user.uuid,
            isAdmin: true // admin标识
          }) // token
        }
      });
    })['catch']((error) => {
      // err
      utils.handleError({
        response: res,
        error
      });
    });
  },
  /**
   * 管理员列表
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
   */
  getAdminUserList (req, res, next) {
    var params = req.query || req.params;
    var condition = {};
    // 分页
    var page = {
      currPage: utils.handleCurrPage(params.currPage), // 获取当前页
      pageSize: utils.handlePageSize(params.pageSize) // 每页数量
    };
    // 查询
    AdminUser.findAndCountAll({
      where: condition,
      attributes: {
        exclude: ['password']
      },
      limit: page.pageSize, // 每页多少条
      offset: page.pageSize * (page.currPage - 1), // 跳过多少条
      order: [ // 排序
        ['updateDate', 'DESC']
      ]
    }).then((result) => {
      var userList = result.rows || [];
      // 处理分页
      utils.handlePage({
        count: result.count,
        page
      }).then((result) => {
        // success
        utils.handleJson({
          response: res,
          result: {
            list: userList,
            page: result
          }
        });
      });
    })['catch']((error) => {
      // err
      utils.handleError({
        response: res,
        error
      });
    });
  }
};
