async function operator(proxies = [], targetPlatform, context) {
  const $ = $substore
  const { isLoon, isSurge } = $.env
  if (!isLoon && !isSurge) throw new Error('仅支持 Loon 和 Surge(ability=http-client-policy)')
  const target = isLoon ? 'Loon' : isSurge ? 'Surge' : undefined

  const batches = []
  const concurrency = parseInt($arguments.concurrency || 40) // 一组并发数
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

      // 请求
      const res = await http({
        method: 'get',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1',
        },
        url: 'https://chat.openai.com',
        'policy-descriptor': node,
        node,
      })
      const res1 = await http({
        method: 'get',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1',
        },
        url: 'https://ios.chat.openai.com',
        'policy-descriptor': node,
        node,
      })
      const res2 = await http({
        method: 'get',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1',
        },
        url: 'https://android.chat.openai.com',
        'policy-descriptor': node,
        node,
      })
      const status = parseInt(res.status || res.statusCode || 200)
      const status1 = parseInt(res1.status || res1.statusCode || 200)
      const status2 = parseInt(res2.status || res2.statusCode || 200)
      $.info(status)
      // 判断响应
      if (status == 403 && status1 == 403 && status2 == 403) {
        proxy.name = `[GPT👌] ${proxy.name}`
      }
    } catch (e) {
      $.error(e)
    }
  }
  // 请求
  async function http(opt = {}) {
    const METHOD = opt.method || $arguments.method || 'get'
    const TIMEOUT = parseFloat(opt.timeout || $arguments.timeout || 600)
    const RETRIES = parseFloat(opt.retries || $arguments.retries || 1)
    const RETRY_DELAY = parseFloat(opt.retry_delay || $arguments.retries || 800)

    let count = 0
    const fn = async () => {
      try {
        return await $.http[METHOD]({ ...opt, timeout: TIMEOUT })
      } catch (e) {
        $.error(e)
        if (count < RETRIES) {
          count++
          const delay = RETRY_DELAY * count
          $.log(`第 ${count} 次请求失败: ${e.message || e}, 等待 ${delay / 800}s 后重试`)
          await $.wait(delay)
          return await fn()
        }
      }
    }
    return await fn()
  }
}
