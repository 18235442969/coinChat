const axios = require('axios');

/**
 * [sendMessage 发送信息]
 * @param  {[type]} par   [发送参数]
 * @param  {[type]} token [验证信息]
 * @param  {[type]} coinType [货币类型]
 */
const sendMessage = function(par, token, coinType) {
	const coinUrlParams = {
		atc: 'api',
		vrh: 'vrh'
	}
	// 网上测试
	// const baseURL = 'http://app.aabcoin.com/' + coinUrlParams[coinType];
	// 本地发布
	const baseURL = 'http://192.168.1.11:9000/' + coinUrlParams[coinType]
	const service = axios.create({
	  baseURL: baseURL,
	  timeout: 30000
	})

	service.defaults.headers.post['Content-Type'] = 'application/json';

	service.interceptors.request.use(config => {
	  if (token) {
	    config.headers['Authorization'] = token
	  }
	  return config
	}, error => {
	  console.log('Request Error' + error)
	  return Promise.reject(error)
	})

	service.interceptors.response.use(response => {
	  if (!response.data.success && response.data.eCode == 'Unauthorized') {
	  	return Promise.reject('身份验证失败')
	  } else {
	    return response
	  }
	}, error => {
	  console.log('Response Error' + error)
	  return Promise.reject(error)
	})

	return new Promise((resolve, reject) => {
		service.post('/order/SendMsg', par).then(function(res) {
			resolve(res);
		}).catch(function(err) {
			reject(err);
		});
	});
}

export default {
	sendMessage
}