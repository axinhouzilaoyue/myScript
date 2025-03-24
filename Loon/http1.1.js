// 名称: 强制HTTP1.1
// 功能: 将指定请求强制使用HTTP/1.1

function main($config, $request) {
  // 获取当前请求的头部信息
  let headers = $request.headers;
  
  // HTTP版本是通过连接参数控制的,不能直接设置
  // 但可以在请求头中添加相关标记告诉服务器使用HTTP/1.1
  
  // 添加头部,明确表示使用HTTP/1.1
  headers["Connection"] = "close";  // 这会禁用HTTP/2的连接复用
  
  // 如果已有Version头,可以尝试设置(虽然不是标准头,但有些代理识别)
  headers["X-Version"] = "HTTP/1.1";
  
  // 应用修改后的头部
  $request.headers = headers;
  
  // 输出日志
  console.log("[HTTP1.1] 已添加HTTP/1.1相关请求头");
  
  // 返回修改后的请求配置
  return $request;
}

// 导出主函数
$done(main($config, $request));
