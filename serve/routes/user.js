/**
 * 用户API router
 * add by wwj
 * 2016-12-22 17:45:53
 */
var express = require('express');

var router = express.Router();

var userDao = require('../controllers/user');
var { checkToken } = require('../middlewares/check'); // 检查token的中间件
var { checkAdminToken } = require('../middlewares/check'); // 检验管理员token

/**
 * 注册 post
 */
router.post('/reg', (req, res, next) => {
  userDao.reg(req, res, next);
});

/**
 * 检测邮箱是否注册
 */
router.get('/checkEmail', (req, res, next) => {
  userDao.checkEmail(req, res, next);
});

/**
 * 登录
 */
router.post('/login', (req, res, next) => {
  userDao.login(req, res, next);
});

/**
 * 退出
 */
router.get('/logout', checkToken, (req, res, next) => {
  userDao.logout(req, res, next);
});

/**
 * 更新token 防止token过期
 */
router.put('/token', (req, res, next) => {
  userDao.updateAccessToken(req, res, next);
});

/**
 * 查询全部用户 支持 高级搜索、分页
 */
router.get('/list', checkAdminToken, (req, res, next) => {
  userDao.getUserList(req, res, next);
});

/**
 * 查询用户 byuuid
 */
router.get('/info', (req, res, next) => {
  userDao.getUserInfo(req, res, next);
});

/**
 * 更新用户信息
 */
router.put('/info', checkToken, (req, res, next) => {
  userDao.updateUserInfo(req, res, next);
});

/**
 * 修改密码
 */
router.put('/pwd', checkToken, (req, res, next) => {
  userDao.updateUserPwd(req, res, next);
});

module.exports = router;
