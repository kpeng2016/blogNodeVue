/**
 * user controllers
 * add by wwj
 * 2019-05-03 20:52:05
 */
var co = require('co');
var md5 = require('blueimp-md5'); // md5 加密
var i18n = require('i18n'); // i18n 国际化
var utils = require('../libs/utils'); // 工具类
var { User } = require('../models/index'); // 用户
var tokenService = require('../services/token'); // token服务

module.exports = {
  /**
   * 检测邮箱是否注册checkEmail
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
   */
  checkEmail (req, res, next) {
    // 参数
    var params = req.query || req.params;
    // 变量
    var email = utils.trim(params.email);
    if (!email) {
      utils.handleJson({
        response: res,
        msg: i18n.__('success'),
        result: {
          emailHadReg: false
        }
      });
    }
    co(function * () {
      var userResult = yield User.findOne({
        where: {
          email
        }
      });
      var result = false;
      if (userResult) {
        result = true;
      }
      // success
      utils.handleJson({
        response: res,
        msg: i18n.__('success'),
        result: {
          emailHadReg: result
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
   * 注册 post
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
   */
  reg (req, res, next) {
    var params = req.body;
    // 变量
    var email = utils.trim(params.email);
    var password = utils.trim(params.password);
    // 检查用户名、密码是否为空
    if (!email || !password) {
      utils.handleJson({
        response: res,
        msg: i18n.__('emailOrPwdNull')
      });
      return;
    }
    // 检查是否注册过
    co(function * () {
      var userResult = yield User.findOne({
        where: {
          email
        }
      });
      // 用户已被注册
      if (userResult) {
        utils.handleJson({
          response: res,
          msg: i18n.__('emailHadReg')
        });
        return;
      }
      userResult = yield User.create({
        email,
        password: md5(password),
        state: '1' // 先默认已激活状态 //状态 0未激活邮箱、1已激活邮箱
      });
      if (!userResult) { // 注册失败
        utils.handleJson({
          response: res,
          msg: i18n.__('regFail')
        });
        return;
      }
      // 成功入库
      var user = userResult.dataValues;
      // 删除密码
      delete user.password;
      // success
      utils.handleJson({
        response: res,
        msg: i18n.__('regSuccess'),
        result: {
          user,
          accessToken: tokenService.setToken({
            uuid: user.uuid
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
   * 登录
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
   */
  login (req, res, next) {
    // 参数
    var params = req.body;
    // 变量
    var mobile = utils.trim(params.mobile);
    var password = utils.trim(params.password);
    // 检查用户名、密码是否为空
    if (!mobile || !password) {
      utils.handleJson({
        response: res,
        msg: i18n.__('emailOrPwdNull')
      });
      return;
    }
    // 检查是否存在该用户
    co(function * () {
      var userResult = yield User.findOne({
        where: {
          mobile
        }
      });
      if (!userResult) { // 用户不存在
        utils.handleJson({
          response: res,
          msg: i18n.__('userNotExist')
        });
        return;
      }
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
      // 增加用户标识
      if (user.password) {
        delete user.password;// 删除密码
        user.isPwd = true;
      }
      if (user.idcard) {
        delete user.idcard;// 删除身份证
        user.isVerify = true;
      }
      // success
      utils.handleJson({
        response: res,
        msg: i18n.__('loginSuccess'),
        result: {
          user,
          accessToken: tokenService.setToken({
            uuid: user.uuid
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
    // 清空 session 中用户信息
    // req.session.user = null;
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
   * 查询全部
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
   */
  getUserList (req, res, next) {
    var params = req.query || req.params;
    var { email } = params;// 邮箱
    var { trueName } = params;// 真实姓名
    var { role } = params;// 角色
    var condition = {};
    if (email) {
      condition.email = {
        $like: `%${email}%`
      };
    }
    if (trueName) {
      condition.trueName = {
        $like: `%${trueName}%`
      };
    }
    if (role) {
      condition.role = role;
    }
    // 分页
    var page = {
      currPage: utils.handleCurrPage(params.currPage), // 获取当前页
      pageSize: utils.handlePageSize(params.pageSize) // 每页数量
    };
    // 查询
    co(function * () {
      var result = yield User.findAndCountAll({
        where: condition,
        attributes: {
          excludse: ['password']
        },
        limit: page.pageSize, // 每页多少条
        offset: page.pageSize * (page.currPage - 1), // 跳过多少条
        order: [ // 排序
          ['createDate', 'DESC']
        ]
      });
      var userList = result.rows || [];
      // 处理分页
      var pageResult = yield utils.handlePage({
        count: result.count,
        page
      });
      // success
      utils.handleJson({
        response: res,
        result: {
          list: userList,
          page: pageResult
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
   * 获取用户详情
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
   */
  getUserInfo (req, res, next) {
    var params = req.query || req.params;
    var userUuid = utils.trim(params.viewUserUuid);
    // 检查
    if (!userUuid) {
      utils.handleJson({
        response: res,
        msg: i18n.__('pleasePassUserUuid')
      });
      return;
    }
    co(function * () {
      var userResult = yield User.findOne({
        where: {
          uuid: userUuid
        },
        attributes: {
          exclude: ['password']// 不含password
        }
      });
      if (userResult) {
        // success
        utils.handleJson({
          response: res,
          result: {
            user: userResult.dataValues
          }
        });
      } else {
        // fail
        utils.handleJson({
          response: res,
          msg: i18n.__('userInfoNull')
        });
      }
    })['catch']((error) => {
      // err
      utils.handleError({
        response: res,
        error
      });
    });
  },
  /**
   * 更新用户信息 post
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
   */
  updateUserInfo (req, res, next) {
    // 参数
    var params = req.body;
    // 用户信息
    var { user } = params;
    // userUuid
    var userUuid = utils.trim(user.uuid);
    if (!userUuid) {
      utils.handleJson({
        response: res,
        msg: i18n.__('pleasePassUserUuid')
      });
      return;
    }
    // 更新
    co(function * () {
      var userResult = yield User.update(user, {
        // fields: ['trueName', 'birth', 'sex', 'city', 'address'], //设置允许更新字段白名单
        where: {
          uuid: userUuid
        }
      });
      if (!userResult) {
        utils.handleJson({
          response: res,
          msg: i18n.__('updateUserInfoFail')
        });
        return;
      }
      // success
      utils.handleJson({
        response: res,
        msg: i18n.__('updateUserInfoSuccess'),
        result: '+1'
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
   * 修改密码 put
   * @param {Object} req
   * @param {Object} res
   * @param {Object} next
   */
  updateUserPwd (req, res, next) {
    // 参数
    var params = req.body;
    // 检验必传项是否存在遗漏
    var checkFlag = utils.validateMandatory(params);
    if (!checkFlag) {
      utils.handleJson({
        response: res,
        msg: i18n.__('pleasePassParamsComplete')
      });
      return;
    }
    // 验证新旧密码
    var { userUuid } = params;
    var oldPwd = utils.trim(params.oldPwd);
    var newPwd = utils.trim(params.newPwd);
    if (oldPwd === newPwd) {
      utils.handleJson({
        response: res,
        msg: i18n.__('newPwdEqOldPwd')
      });
      return;
    }
    // 检测是否存在当前用户
    co(function * () {
      var userResult = yield User.findOne({
        where: {
          uuid: userUuid
        }
      });
      if (!userResult) {
        utils.handleJson({
          response: res,
          msg: i18n.__('userNotExist')
        });
        return;
      }
      // 接受user
      var user = userResult.dataValues;
      if (user.password && md5(oldPwd) !== user.password) {
        utils.handleJson({
          response: res,
          msg: i18n.__('oldPwdError')
        });
        return;
      }
      yield User.update({
        password: md5(newPwd)
      }, {
        // fields: ['password'], //设置允许更新字段白名单
        where: {
          uuid: userUuid
        }
      });
      // 成功入库
      utils.handleJson({
        response: res,
        msg: i18n.__('updateSuccess'),
        result: '+1'
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
