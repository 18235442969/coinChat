import sendMessage from "../server/sendMessage";
import log from "../log/index";
/**
 * [连接]
 * @param  {[type]} socket   [用户socket]
 * @param  {[type]} data     [用户数据信息]
 * @param  {[type]} userList [用户连接池]
 */
const connectNewUser = (socket, token, data, userList, startTime) => {
	const userInfo = userList.find(e => e.userId == data.userId);
	//在用户连接池获取到当前的用户信息
	const user = {
    userId: data.userId,
    socketId: socket.id,
    userName: data.userName,
    token: token,
    orderId: data.orderId
  }
  if (!userInfo) {
    userList.push(user)
  } else {
  	userInfo.token = token;
  	userInfo.orderId = data.orderId;
    userInfo.socketId = socket.id;
  }
  console.log(`${data.userName} 连接成功`);
  //写入日志
  log.onConnectLog(userList, user, startTime);
}

/**
 * [收到消息转发]
 * @param  {[type]} io       [io]
 * @param  {[type]} socket   [用户socket]
 * @param  {[type]} data     [用户发送数据]
 * @param  {[type]} userList [用户连接池]
 * @param  {[type]} startTime [开始时间]
 */
const onMessage = async (io, socket, data, userList, startTime) => {
	//接收者id
  const receiveUserId = data.receiveUserId;
  //发送者id
  const sendUserId = data.sendUserId;
  //消息
  const message = data.message;
  //发送者用户信息
  const sendUserInfo = userList.find(e => e.userId == sendUserId);
  //接受者用户信息
  const receiveUserInfo = userList.find(e => e.userId == receiveUserId);
  const par = {
    content: message
  };
  //保存订单的id
  let id;
  //判断订单货币类型
  switch (data.coinType) {
    case 'atc':
      par.atcOrderID = data.atcOrderId;
      id = 'atcOrderID';
      break;
    case 'vrh':
      par.vrhOrderID = data.vrhOrderId;
      id = 'vrhOrderID';
      break;
    default:
      par.atcOrderID = data.atcOrderId;
      id = 'atcOrderID';
      break;
  }
  //发送者连接socket服务器
  if (sendUserInfo) {
    try{
      let res = await sendMessage.sendMessage(par, sendUserInfo.token, data.coinType);
      socket.emit('getMessage', res.data);
      //接受者在线
      if (receiveUserInfo) {
        if (res.data.body[id] == receiveUserInfo.orderId) {
          const receiveSocketId = receiveUserInfo.socketId;
          const receiveSocket = io.sockets.sockets[receiveSocketId];
          receiveSocket.emit('receiveMessage', res.data);
        }
      }
      log.sendMessageLog(data, true, startTime)
    } catch (err) {
      log.sendMessageLog(data, false, startTime)
      socket.emit('getMessageError', {
        msg: '发送失败'
      });
    }
  } else {
    log.sendMessageLog(data, false, startTime)
    socket.emit('getMessageError', {
      msg: '发送失败'
    });
  }
}

/**
 * [关闭连接]
 * @param  {[type]} socket   [用户socket]
 * @param  {[type]} userList [用户连接池]
 */
const onDisconnect = (socket, userList) => {
  userList = userList.filter(e => e.socketId !== socket.id);
}

export default {
	connectNewUser,
	onMessage,
	onDisconnect
}