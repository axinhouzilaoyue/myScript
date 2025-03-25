// 美团AIGC认证插件
// 作者: Claude

// 获取用户配置的Bearer令牌
var bearerToken = $persistentStore.read("meituan_aigc_token");

// 检查令牌是否已配置
if (!bearerToken) {
    // 如果未配置令牌，则通知用户
    $notification.post("美团AIGC认证插件", "错误", "请先配置令牌！在Loon->配置->插件->美团AIGC认证插件中设置");
    
    // 终止请求或返回错误状态
    $done({
        response: {
            status: 400,
            headers: {"Content-Type": "text/plain"},
            body: "请先在Loon配置中设置美团AIGC令牌"
        }
    });
} else {
    // 令牌已配置，添加Authorization头
    $done({
        headers: {
            ...$request.headers,
            "Authorization": "Bearer " + bearerToken
        }
    });
}
