# tvbox-config

TVBox / 影视仓 / OK影视 可用的配置镜像，每天自动从上游同步，剔除实测失效的采集站。

配置内容聚合自 [Lightconer/tvbox-ysc-config](https://github.com/Lightconer/tvbox-ysc-config)，本项目只做镜像、探测与裁剪。

## 直链（填进 App 的「配置地址」）

```
https://cdn.jsdelivr.net/gh/你的用户名/tvbox-config@main/tvbox.slim.json
```

备用通道：

```
https://fastly.jsdelivr.net/gh/你的用户名/tvbox-config@main/tvbox.slim.json
https://gcore.jsdelivr.net/gh/你的用户名/tvbox-config@main/tvbox.slim.json
https://raw.githack.com/你的用户名/tvbox-config/main/tvbox.slim.json
```

| 文件 | 说明 |
| --- | --- |
| `tvbox.slim.json` | 精简版，剔除探测失败的采集站，推荐 |
| `tvbox.json` | 上游原样镜像，不裁剪 |

## 使用

1. 打开 TVBox / 影视仓 / OK影视
2. 进入「设置 → 配置地址」
3. 粘贴上面的 jsDelivr 直链
4. 确定，重启 App 或切换一次配置

## 自动更新

`.github/workflows/update.yml` 每天 UTC 21:00（北京时间 05:00）执行：

1. `scripts/fetch.mjs` —— 从 5 个上游通道依次尝试，第一个成功的写入 `tvbox.json`
2. `scripts/probe.mjs` —— 对每个可 HTTP 直连的站点发一次搜索请求，记录延迟和是否出片
3. `scripts/build.mjs` —— 剔除确认失效的站点，生成 `tvbox.slim.json` 和 `data/stats.json`

也可以在 Actions 页面点 **Run workflow** 手动触发。

## 本地运行

```bash
node scripts/fetch.mjs
node scripts/probe.mjs
node scripts/build.mjs
```

需要 Node 18+（内置 fetch）。

环境变量：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PROBE_TIMEOUT` | `8000` | 单站点超时毫秒 |
| `PROBE_CONCURRENCY` | `24` | 并发数 |
| `PROBE_KEYWORD` | `庆余年` | 探测用的搜索关键词 |

## 为什么大部分站点探不到

上游配置 554 个站点里有 514 个是 `type: 3`（`csp_` 内置解析壳），真实接口由 App 内置的 spider 在运行时解析，HTTP 直接请求拿不到结果。所以探测只对 `api` 是 http 地址的采集站有效，其余站点原样保留，不做判定。

## 缓存

jsDelivr 对 `@main` 分支引用有缓存（通常几小时）。改完想立刻生效，用 commit hash 引用：

```
https://cdn.jsdelivr.net/gh/你的用户名/tvbox-config@<commit-sha>/tvbox.slim.json
```

或者强制刷新：

```
https://purge.jsdelivr.net/gh/你的用户名/tvbox-config@main/tvbox.slim.json
```

## 许可

脚本部分 MIT。配置内容版权归各上游作者所有，本项目仅做聚合镜像。
