# GroupTI Google Sheets 数据收集方案

当前项目通过 Google Apps Script Web App 把测试结果写入 Google Sheet。前端仍然是纯静态页面，部署到 GitHub Pages 也可以直接提交数据。

## 数据流

1. 用户完成测试。
2. `index.html` 调用 `saveResult()`。
3. 前端用 `fetch(..., { mode: 'no-cors' })` POST 到 Apps Script `/exec` URL。
4. Apps Script 的 `doPost(e)` 把 JSON 追加到 Google Sheet 的 `results` 表。

## 前端调试入口

这些入口不会写入 Google Sheet：

```text
index.html?debug=1
index.html?test=1
index.html#debug
```

这个入口会写入 Google Sheet，但会标记为调试数据：

```text
index.html?debug=collect
```

统计页会默认把 `debug=true` 或 `collectionMode=debug-collect` 的记录排除在有效统计之外。

## Google Sheet 字段

| 字段 | 含义 |
|------|------|
| receivedAt | Apps Script 收到数据的时间 |
| schemaVersion | 数据结构版本 |
| questionVersion | 题库/计分版本 |
| type | 最终人格类型 |
| role | 组长或组员 |
| answers | 15 道题的字母答案 |
| answerDetails | 每道题的文字、字母和权重 |
| scores | 四个维度的详细得分 |
| pageUrl | 提交来源 URL |
| userAgent | 浏览器信息 |
| createdAtClient | 用户浏览器侧完成时间 |
| debug | 是否为调试数据 |
| collectionMode | `normal` 或 `debug-collect` |

## 本地统计

1. 在 Google Sheet 中选择 `文件` -> `下载` -> `逗号分隔值 (.csv)`。
2. 打开 `stats.html`。
3. 上传 CSV 或粘贴 CSV 内容。
4. 页面会展示人格排行、角色比例、维度分布和最近记录。

## 题库分布模拟

运行：

```bash
node tools/simulate-distribution.js 5000
```

脚本会读取当前 `index.html` 的题库和计分逻辑，随机模拟组长/组员测试结果，用于检查 16 类型和 4 个维度是否过度偏斜。
