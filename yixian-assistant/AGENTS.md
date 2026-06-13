# AGENTS.md — 翼线助手 AI 模块说明

本项目使用 DeepSeek API 实现 APP 与 PC 后台的 AI 能力。所有 AI 调用都经过 Java 后端，前端不保存、不暴露真实 API Key。

## 通用原则

- DeepSeek Key 通过环境变量 `DEEPSEEK_API_KEY` 注入。
- 前端只调用本项目后端 `/api/v1/ai/*`。
- 后端负责 Prompt、安全边界、兜底策略和审计日志。
- DeepSeek 不直接访问数据库，不执行审批、派单、删除、修改等写操作。
- DeepSeek 调用失败时返回本地兜底结果，保证页面可用。

## AI① 智能填单

接口：

```text
POST /api/v1/ai/extract
```

作用：

- 将 APP 用户自然语言转换为结构化申请字段。
- 支持领料申请、拜访申请等表单预填。
- 返回字段包括 `fields`、`missingFields`、`warnings`、`confidence`。

示例：

```json
{
  "input": "明天去鼓楼区修宽带，领一台光猫和一根光纤",
  "applicationType": "MATERIAL"
}
```

输出约定：

```json
{
  "fields": {
    "title": "现场维修领料",
    "content": "...",
    "location": "南京市鼓楼区",
    "expectedTime": "2026-06-12 09:00:00",
    "urgency": "NORMAL",
    "materials": []
  },
  "missingFields": [],
  "warnings": [],
  "confidence": 0.8
}
```

## AI② 智能派单理由

接口：

```text
POST /api/v1/ai/dispatch-reason
```

作用：

- 派单算法负责选择候选人。
- AI 负责生成自然语言推荐理由。
- 模型不直接决定派单结果。

## AI③ APP 智能助手

接口：

```text
POST /api/v1/ai/chat
```

作用：

- 为 APP 一线人员提供业务流程、领料、审批、拜访、支撑等问答。
- 可返回 `suggestedAction`，前端据此跳转到申请或列表页面。

返回字段：

```json
{
  "answer": "领料申请建议从智能填单进入...",
  "source": "翼线助手知识库与 DeepSeek",
  "confidence": 0.82,
  "suggestedAction": {
    "label": "去提领料申请",
    "route": "/apply/material"
  }
}
```

## AI④ PC 管理智脑

接口：

```text
POST /api/v1/ai/query
```

作用：

- 为 PC 后台管理员提供管理指标分析。
- 支持完成率、超时排行、拜访次数、商机转化、高意向客户等管理问题。
- 前端把当前用户已授权的数据快照传给后端，后端再调用 DeepSeek 生成管理分析。

安全边界：

- 模型不直接访问数据库。
- 模型只能基于后端/前端提供的授权指标快照回答。
- 模型不能执行审批、删除、改派等写操作。
- 问题超出管理范围时，应提示可查询范围。

请求示例：

```json
{
  "question": "本周工单完成率是多少？",
  "sessionId": "pc-ai-test",
  "context": {
    "metrics": {
      "weeklyCompletionRate": 88.6,
      "weeklyCompleted": 74,
      "weeklyExpected": 84
    }
  }
}
```

返回示例：

```json
{
  "text": "本周完成率88.6%，低于90%警戒线，存在交付风险。建议优先排查未完成任务卡点。",
  "metric": "88.6%",
  "rows": [],
  "columns": [],
  "source": "DeepSeek 管理智脑 · 仅基于授权指标快照",
  "confidence": 1.0
}
```

## 验证 DeepSeek 是否真实接入

直接测试 DeepSeek Key：

```bash
curl -s https://api.deepseek.com/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model":"deepseek-chat",
    "messages":[{"role":"user","content":"只回复四个字：连通成功"}],
    "temperature":0
  }'
```

测试 PC 管理智脑：

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/ai/query \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question":"请基于本周完成率88.6%，用管理者口吻给出一句风险判断和一句改进建议",
    "sessionId":"pc-deepseek-test",
    "context":{"metrics":{"weeklyCompletionRate":88.6,"weeklyCompleted":74,"weeklyExpected":84}}
  }'
```

如果后端日志出现下面内容，说明 DeepSeek 调用失败并走了本地兜底：

```text
DeepSeek management query failed, fallback to local snapshot
```

正常接入时不应新增上述错误日志。

