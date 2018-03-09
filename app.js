import Koa from "koa";
import onerror from "koa-onerror";
import logger from "koa-logger";
import koaDebug from "debug";
import http from "http";
import socketOperation from "./controller/socket";
import log from "./log/index";
const app = new Koa()
const debug = koaDebug('demo:server')
const port = normalizePort(process.env.PORT || '3000');

// error handler
onerror(app)


app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
// app.use(index.routes(), index.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});


let server = http.Server(app.callback());
let io = require('socket.io')(server);


// 用户连接池
let userList = [];

//连接身份验证
io.use((socket, next) => {
  let token = socket.handshake.query.token;
  if (token) {
    return next();
  }
  const startTime = new Date();
  log.tokenError(startTime);
  return next(new Error('身份验证失败，请重新连接'));
});

//连接
io.on('connection', function(socket){
  const token = socket.handshake.query.token;
  //连接回执
  socket.emit('connected');
  /**
   * [保存连接的用户信息]
   */
  socket.on('connectNewUser', function (data) {
    const startTime = new Date();
    socketOperation.connectNewUser(socket, token, data, userList, startTime);
  });

  /**
   * 收到信息
   */
  socket.on('message', function(data){
    const startTime = new Date();
    socketOperation.onMessage(io, socket, data, userList, startTime);
  })

  //断线
  socket.on('disconnect', function(reason) {
    socketOperation.onDisconnect(socket, userList);
  })
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  let port = parseInt(val, 10);
  if (isNaN(port)) {
    // named pipe
    return val;
  }
  if (port >= 0) {
    // port number
    return port;
  }
  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
