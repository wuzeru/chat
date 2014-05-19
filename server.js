/**
 +------------------------------------------------------------------------------
 * server.js
 +------------------------------------------------------------------------------
 */

var express = require('express');

var http = require('http');
var path = require('path');
var socket = require('./model/socket');
var settings = require('./settings');
var app = express();

/**
 +------------------------------------------------------------------------------
 *  express 配置 //定义共享环境
 +------------------------------------------------------------------------------
 */

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.bodyParser({uploadDir:'./uploads'}));
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session({
    secret:settings.cookieSecret,
    key:settings.db

}));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/**
 +------------------------------------------------------------------------------
 * Route 处理GET和POST请求（Controllers）
 +------------------------------------------------------------------------------
 */
var routes = require('./routes');
routes(app);
/**
 +------------------------------------------------------------------------------
 * Socket.io listen server
 +------------------------------------------------------------------------------
 */
var server  = http.createServer(app);
var io = require('socket.io').listen(server);

//执行socket.io的内容
socket(io);

// Configuratio
io.set('log level',0);

/**
 +------------------------------------------------------------------------------
 * Server listen port(3000) 可以修改为其他端口
 +------------------------------------------------------------------------------
 */
server.listen(app.get('port'),function(){
    console.log('Express server listening on port' + app.get('port'));
});


