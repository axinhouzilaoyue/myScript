// 美团AIGC认证插件
// 作者: Claude

// 从插件设置中获取Bearer令牌
const bearerToken = $persistentStore.read("bearerToken");

if (!bearerToken) {
  $notification.post("美团AIGC认证插件", "错误", "请先在插件设置中配置Bearer令牌");
  $done();
} else {
  // 修改请求头部，加入 Authorization 信息
  $request.headers['Authorization'] = `Bearer ${bearerToken}`;
  $done({headers: $request.headers});
}
