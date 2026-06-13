# TODO.md — 翼线助手联调版状态

## 已完成

- [x] APP 前端基础页面搭建。
- [x] PC 后台 Vue 3 + Vite + Element Plus 项目搭建。
- [x] Spring Boot 后端基础工程搭建。
- [x] MySQL 初始化脚本和演示账号。
- [x] 登录接口：`POST /api/v1/auth/login`。
- [x] 当前用户接口：`GET /api/v1/auth/me`。
- [x] APP 提交申请：`POST /api/v1/applications`。
- [x] APP 我的申请：`GET /api/v1/applications/my`。
- [x] APP 申请详情：`GET /api/v1/applications/{id}`。
- [x] APP 撤回申请：`POST /api/v1/applications/{id}/cancel`。
- [x] PC 审批列表：`GET /api/v1/admin/applications?status=PENDING`。
- [x] PC 审批详情：`GET /api/v1/admin/applications/{id}`。
- [x] PC 审批通过：`PATCH /api/v1/admin/applications/{id}/approve`。
- [x] PC 审批驳回：`PATCH /api/v1/admin/applications/{id}/reject`。
- [x] 申请状态统一：`PENDING`、`APPROVED`、`REJECTED`、`CANCELLED`。
- [x] APP 提交申请后 PC 后台可见。
- [x] PC 审批后 APP 可查看审批状态、审批人、审批时间和驳回原因。
- [x] APP 智能助手接入 DeepSeek：`POST /api/v1/ai/chat`。
- [x] APP 智能填单接入 DeepSeek：`POST /api/v1/ai/extract`。
- [x] PC 管理智脑接入 DeepSeek：`POST /api/v1/ai/query`。
- [x] DeepSeek 未配置或不可用时提供本地兜底回答，避免页面直接崩溃。
- [x] 前端 remote/mock 模式边界保留。
- [x] GitHub 交付包清理规则：不提交 `.env`、`.env.local`、`node_modules`、`dist`、`target`、日志和真实 Key。

## 待完善

- [ ] 后端补充 Swagger/OpenAPI 文档。
- [ ] 后端补充单元测试和接口集成测试。
- [ ] PC 后台统计看板切换为真实统计接口。
- [ ] PC 后台人员、任务、商机等模块继续补齐真实 CRUD 接口。
- [ ] APP 端更多页面字段与后端 DTO 做细粒度对齐。
- [ ] 文件上传、任务反馈、签名等流程补充端到端验证。
- [ ] AI 问答增加更完整的企业知识库内容。
- [ ] AI 管理智脑增加更多白名单指标和审计展示。
- [ ] 增加生产环境部署说明和 Nginx 配置。

## 已知限制

- 当前 PC 管理智脑不会让模型直接访问数据库，而是把已授权指标快照传给后端 AI。
- 当前 DeepSeek Key 只通过环境变量配置，不放入仓库。
- APP 页面登录字段显示为“工号”，联调版真实后端使用 `username` 登录，演示账号为 `zhangsan / demo123`。
- PC 后台演示账号为 `admin / demo123`。

## 演示检查清单

- [ ] 后端 8080 正常启动。
- [ ] PC 后台 6006 正常启动。
- [ ] APP 前端 6008 正常启动。
- [ ] APP 可提交申请。
- [ ] PC 审批中心能看到 APP 申请。
- [ ] PC 通过申请后 APP 可看到 `APPROVED`。
- [ ] PC 驳回申请后 APP 可看到 `REJECTED` 和驳回原因。
- [ ] APP 智能助手可返回 DeepSeek 回答。
- [ ] PC 管理智脑可返回 DeepSeek 管理分析。

