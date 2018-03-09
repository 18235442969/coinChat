import fs from "fs";
import moment from "moment";
import url from "./url";

/**
 * [身份验证失败]
 */
const tokenError = (startTime) => {
	const str = `token验证失败`;
	recordLog(url.tokenUrl, str, startTime);
}

/**
 * [连接日志]
 * @param  {[type]} userList [用户连接池]
 * @param  {[type]} user     [当前连接用户]
 */
const onConnectLog = (userList, user, startTime) => {
	const str = `${user.userName}在订单${user.orderId}连接，共${userList.length}人连接`;
	recordLog(url.connectUrl, str, startTime);
}

/**
 * [发送消息日志]
 * @param  {[type]} data [发送信息]
 */
const sendMessageLog = (data, isSendSuccess, startTime) => {
	const successStr = `发送成功    订单：${data.atcOrderId}    ${data.sendUserId}  向  ${data.receiveUserId}    发送：${data.message}`;
	const failStr = `发送失败    订单：${data.atcOrderId}    ${data.sendUserId}  向  ${data.receiveUserId}    发送：${data.message}`;
	const str = isSendSuccess ? successStr : failStr;
	recordLog(url.messageUrl, str, startTime);
}

/**
 * [recordLog 记录日志]
 * @param  {[type]} url [日志路径]
 * @param  {[type]} str [内容]
 */
function recordLog(url, str, startTime) {
	const useTime = new Date() - startTime;
	const time = moment(new Date()).format('YYYY/MM/DD HH:mm:ss');
	let logStr = `${str} 时间：${time} 耗时：${useTime}\n\r`;
	fs.stat(url, (err, stats) => {
		if (err) {
			fs.writeFile(url, logStr, function (err, data) {
			   if (err) {
		       return console.error(err);
			   }
			});
			return;
		}
		fs.appendFile(url, logStr, "utf-8", function(err) {
	    if (err) {
	      return console.log(err);
	    }
		})
	})
}

export default {
	tokenError,
	onConnectLog,
	sendMessageLog
}