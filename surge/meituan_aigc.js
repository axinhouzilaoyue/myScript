/*
 * Surge 脚本：美团AIGC认证
 * 作者：Gemini
 * 功能：捕获对 https://aigc.sankuai.com/v1/openai/native/chat/completions 的请求，并将其 Authorization Header 的值替换为从模块参数 ($argument) 中获取的值。
 */

// 从模块的 argument 参数中获取新的 Authorization 值
const params = new URLSearchParams($argument);

// 通过 key "token" 来获取我们需要的参数值
const newAuthValue = params.get('Authorization');

if (newAuthValue) {
    // 打印日志，方便调试（可以在 Surge 日志中看到）
    // console.log(`正在修改 Authorization Header。`);
    // console.log(`旧值: ${$request.headers['Authorization']}`);
    // console.log(`新值: ${newAuthValue}`);

    // 替换 Header
    const headers = $request.headers;
    headers["Authorization"] = newAuthValue;

    // 完成请求，应用修改后的 headers
    $done({headers});
} else {
    console.log("美团AIGC认证：模块参数 (argument) 未设置，未执行任何操作。");
    $done({});
}
