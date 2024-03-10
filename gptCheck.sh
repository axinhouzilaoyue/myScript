#!/bin/bash

# 使用curl函数检查GPT访问权限
check_gpt_access() {
    local url=$1
    local status_code=$(curl -o /dev/null -s -w "%{http_code}\n" -X HEAD $url)

    # 判断状态码
    if [ "$status_code" == "400" ]; then
        echo "禁止"
    elif [ "$status_code" == "403" ]; then
        echo "解锁"
    else
        echo "状态未知"
    fi
}

# 检查网页、Android App、iOS App GPT访问权限
web_access=$(check_gpt_access "https://chat.openai.com")
android_access=$(check_gpt_access "https://android.chat.openai.com")
ios_access=$(check_gpt_access "https://ios.chat.openai.com")

# 输出结果
echo "GPT————网页:$web_access ｜ android:$android_access ｜ ios:$ios_access"
