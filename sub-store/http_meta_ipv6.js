/**
 *
 * ipv6 检测(适配 Sub-Store Node.js 版)
 *
 * 欢迎加入 Telegram 群组 https://t.me/zhetengsha
 *
 * HTTP META(https://github.com/xream/http-meta) 参数
 * - [ipv6_test_url] 测试网址 默认：http://test6.ustc.edu.cn
 * - [http_meta_protocol] 协议 默认: http
 * - [http_meta_host] 服务地址 默认: 127.0.0.1
 * - [http_meta_port] 端口号 默认: 9876
 * - [http_meta_authorization] Authorization 默认无
 * - [http_meta_start_delay] 初始启动延时(单位: 毫秒) 默认: 3000
 * - [http_meta_proxy_timeout] 每个节点耗时(单位: 毫秒). 此参数是为了防止脚本异常退出未关闭核心. 设置过小将导致核心过早退出. 目前逻辑: 启动初始的延时 + 每个节点耗时. 默认: 10000
 *
 * 其它参数
 * - [timeout] 请求超时(单位: 毫秒) 默认 3000
 * - [retries] 重试次数 默认 1
 * - [retry_delay] 重试延时(单位: 毫秒) 默认 1000
 * - [concurrency] 并发数 默认 20
 */

async function operator(proxies = []) {
    const $ = $substore
    const ipv6_test_url = $arguments.ipv6_test_url || 'http://test6.ustc.edu.cn'
    const http_meta_host = $arguments.http_meta_host || '127.0.0.1'
    const http_meta_port = $arguments.http_meta_port || 9876
    const http_meta_protocol = $arguments.http_meta_protocol || 'http'
    const http_meta_authorization = $arguments.http_meta_authorization || ''
    const http_meta_api = `${http_meta_protocol}://${http_meta_host}:${http_meta_port}`
    const http_meta_start_delay = parseFloat($arguments.http_meta_start_delay || 3000)
    const http_meta_proxy_timeout = parseFloat($arguments.http_meta_proxy_timeout || 10000)

    const internalProxies = []
    const underscoreRegex = /^_/i

    for (let index = 0; index < proxies.length; index++) {
        const proxy = proxies[index]
        try {
            const result = ProxyUtils.produce([{ ...proxy }], 'ClashMeta', 'internal')
            const node = result && result[0]
            if (node) {
                for (const key in proxy) {
                    if (underscoreRegex.test(key)) {
                        node[key] = proxy[key]
                    }
                }
                internalProxies.push({ ...node, _proxies_index: index })
            }
        } catch (e) {
            $.error(e)
        }
    }

    $.info(`核心支持节点数: ${internalProxies.length}/${proxies.length}`)
    if (!internalProxies.length) return proxies

    const http_meta_timeout = http_meta_start_delay + internalProxies.length * http_meta_proxy_timeout

    const res = await http({
        retries: 0,
        method: 'post',
        url: `${http_meta_api}/start`,
        headers: {
            'Content-type': 'application/json',
            Authorization: http_meta_authorization,
        },
        body: JSON.stringify({
            proxies: internalProxies,
            timeout: http_meta_timeout,
        }),
    })

    const body = (() => {
        try { return JSON.parse(res.body) } catch { return res.body }
    })()
    const { ports: http_meta_ports, pid: http_meta_pid } = body
    if (!http_meta_pid || !http_meta_ports) {
        throw new Error(`HTTP META 启动失败: ${body}`)
    }

    $.info(
        `\n====== HTTP META 启动 ====\n[端口] ${http_meta_ports}\n[PID] ${http_meta_pid}\n[超时] ${Math.round(http_meta_timeout / 60 / 10) / 100
        } 分钟后自动关闭\n`
    )
    $.info(`等待 ${http_meta_start_delay / 1000} 秒后开始检测`)
    await $.wait(http_meta_start_delay)

    await executeAsyncTasks(
        internalProxies.map((proxy, index) => () => check(proxy, index)), { concurrency: parseInt($arguments.concurrency || 20) }
    )

    try {
        const res = await http({
            method: 'post',
            url: `${http_meta_api}/stop`,
            headers: {
                'Content-type': 'application/json',
                Authorization: http_meta_authorization,
            },
            body: JSON.stringify({
                pid: [http_meta_pid],
            }),
        })
        $.info(`\n====== HTTP META 关闭 ====\n${JSON.stringify(res, null, 2)}`)
    } catch (e) {
        $.error(e)
    }

    return proxies

    async function check(proxy, index) {
        try {
            const res = await http({
                proxy: `http://${http_meta_host}:${http_meta_ports[index]}`,
                url: ipv6_test_url,
            })
            const status = parseInt(res.status || res.statusCode || 200)

            if (status >= 200 && status < 400) {
                proxies[proxy._proxies_index].name = `${proxies[proxy._proxies_index].name}₄₆`
            }
        } catch (e) {
            $.error(`[${proxy.name}] ${e.message}`)
        }
    }

    async function http(opt = {}) {
        const METHOD = opt.method || 'get'
        const TIMEOUT = opt.timeout || $arguments.timeout || 5000
        const RETRIES = opt.retries || $arguments.retries || 1
        const RETRY_DELAY = opt.retry_delay || $arguments.retry_delay || 1000

        for (let count = 0; count <= RETRIES; count++) {
            try {
                return await $.http[METHOD]({ ...opt, timeout: TIMEOUT })
            } catch (e) {
                if (count < RETRIES) {
                    await $.wait(RETRY_DELAY * (count + 1))
                } else {
                    throw e
                }
            }
        }
    }

    function executeAsyncTasks(tasks, { concurrency = 1 } = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                let running = 0
                let index = 0

                function executeNextTask() {
                    while (index < tasks.length && running < concurrency) {
                        const currentTask = tasks[index++]
                        running++

                        currentTask()
                            .catch(() => { }) // 错误已在check函数中处理
                            .finally(() => {
                                running--
                                executeNextTask()
                            })
                    }

                    if (running === 0) {
                        resolve()
                    }
                }

                executeNextTask()
            } catch (e) {
                reject(e)
            }
        })
    }
}
