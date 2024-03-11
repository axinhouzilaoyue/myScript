/**
 * GPT 检测(适配 Surge/Loon 版)
 *
 * 适配 Sub-Store Node.js 版 请查看: https://t.me/zhetengsha/1209
 *
 * 欢迎加入 Telegram 群组 https://t.me/zhetengsha
 * 检测方法: https://zset.cc/archives/34/
 * 需求来源: @underHZLY
 * 讨论贴: https://www.nodeseek.com/post-78153-1
 *
 * 参数
 * - [timeout] 请求超时(单位: 毫秒) 默认 5000
 * - [retries] 重试次数 默认 1
 * - [retry_delay] 重试延时(单位: 毫秒) 默认 1000
 * - [concurrency] 并发数 默认 10
 * - [client] GPT 检测的客户端类型. 默认 iOS
 * - [method] 请求方法. 默认 head, 如果不支持, 可设为 get
 */

async function operator(proxies = [], targetPlatform, context) {
  const $ = $substore
  const { isLoon, isSurge } = $.env
  if (!isLoon && !isSurge) throw new Error('仅支持 Loon 和 Surge(ability=http-client-policy)')

  const method = $arguments.method || 'head'
  const url = $arguments.client === 'Android' ? `https://android.chat.openai.com` : `https://ios.chat.openai.com`
  const target = isLoon ? 'Loon' : isSurge ? 'Surge' : undefined

  const batches = []
  const concurrency = parseInt($arguments.concurrency || 30) // 一组并发数
  for (let i = 0; i < proxies.length; i += concurrency) {
    const batch = proxies.slice(i, i + concurrency)
    batches.push(batch)
  }

  for (const batch of batches) {
    await Promise.all(batch.map(check))
  }

  return proxies

  async function check(proxy) {
    try {
      const node = ProxyUtils.produce([proxy], target)
      if (node) {
        // 请求
        const res = await http({
          method,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1',
          },
          url,
          'policy-descriptor': node,
          node,
        })
        const status = parseInt(res.status || res.statusCode || 200)
        // $.info(status)
        // 判断响应
        // https://zset.cc/archives/34/
        if (status == 403) {
          proxy.name = `[GPT👌] ${proxy.name}`
        }
      }
    } catch (e) {
      $.error(e)
    }
  }
  // 请求
  async function http(opt = {}) {
    const METHOD = opt.method || 'get'
    const TIMEOUT = parseFloat(opt.timeout || $arguments.timeout || 1000)
    const RETRIES = parseFloat(opt.retries || $arguments.retries || 1)
    const RETRY_DELAY = parseFloat(opt.retry_delay || $arguments.retry_delay || 1000)

    let count = 0
    const fn = async () => {
      try {
        return await $.http[METHOD]({ ...opt, timeout: TIMEOUT })
      } catch (e) {
        $.error(e)
        if (count < RETRIES) {
          count++
          const delay = RETRY_DELAY * count
          $.log(`第 ${count} 次请求失败: ${e.message || e}, 等待 ${delay / 1000}s 后重试`)
          await $.wait(delay)
          return await fn()
        }
      }
    }
    return await fn()
  }
}
