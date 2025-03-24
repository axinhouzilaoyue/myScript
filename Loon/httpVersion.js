// 名称: 强制HTTP1.1
// 功能: 将指定请求强制使用HTTP/1.1

function main($request) {
  // 获取当前请求的头部信息
  let headers = $request.headers;
  
  // 添加连接相关的头部，尝试强制使用HTTP/1.1
  headers['Connection'] = 'close';  // 禁用HTTP/2的连接复用
  headers['Upgrade-Insecure-Requests'] = '0';  // 禁止自动升级到HTTP/2
  headers['Accept-Encoding'] = 'gzip, deflate';  // 不包括HTTP/2特有的br压缩
  
  // 应用修改后的头部
  $request.headers = headers;
  
  // 输出日志
  console.log("[HTTP1.1] 已添加HTTP/1.1相关请求头");
  
  // 返回修改后的请求
  return $request;
}

// 导出主函数
$done(main($request));
