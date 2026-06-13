# 架构契约接入说明

本项目已按《架构契约文档》增加前后端契约层。现有 React PWA 继续负责 V1.0 界面演示；后端按 Spring Boot 3、MyBatis Plus、MySQL 8 提供可替换的数据服务。

## 请求链路

```text
React 页面
  -> src/services/api.js
  -> Mock API 或 HTTP API
  -> src/services/httpClient.js
  -> /api/v1
  -> Controller
  -> Service
  -> MyBatis Plus Mapper
  -> MySQL 8
```

前端通过 `VITE_API_MODE` 切换数据源：

- `mock`：使用本地模拟服务，不要求启动后端。
- `remote`：登录后调用 `/auth/me`，并从任务、申请、拜访、商机接口加载数据库数据。

## 已对齐的契约

- 统一响应：`code`、`message`、`data`、`requestId`。
- 业务错误码：`401`、`403`、`404`、`409`、`1001`、`1002`、`2001`、`500`。
- 认证：除登录外携带 `Authorization: Bearer <token>`。
- 当前用户：前端只调用 `/auth/me`，不解析 Token。
- 分页：`pageNo`、`pageSize`、`list`、`total`。
- 写操作：请求体自动增加 `idempotencyKey`。
- 任务更新：提交 `version`，后端使用条件更新实现乐观锁。
- 时间：后端使用 `yyyy-MM-dd HH:mm:ss`。
- 金额：商机接口按分传输，界面按元展示。
- 状态：角色、申请、任务、商机全部使用契约标准枚举。

## 前端服务分层

| 文件 | 作用 |
|---|---|
| `src/config/runtime.js` | API 模式、地址和超时配置 |
| `src/services/authStore.js` | Token 与用户会话存储 |
| `src/services/httpClient.js` | Bearer Token、统一响应、错误码、超时、幂等 |
| `src/services/api.js` | 认证、申请、任务、拜访、商机、AI、文件接口 |
| `src/domain/contracts.js` | 标准角色和状态枚举 |
| `src/domain/apiAdapters.js` | 后端 DTO 到界面模型的转换 |

## 后端模块

| 模块 | 已预留能力 |
|---|---|
| `auth` | 登录、登出、当前用户、Token 拦截 |
| `application` | 我的申请、详情、提交、撤回、审批记录 |
| `task` | 列表、详情、接单、开始、完工、乐观锁 |
| `visit` | 拜访列表、签到、商机新增和更新、跟进记录 |
| `file` | 本地 `/uploads` 存储和附件表记录 |
| `ai` | DeepSeek 字段抽取、智能问答、管理查询与派单理由入口 |
| `common` | 统一响应、requestId、异常、分页、鉴权和幂等 |

## APP 申请与 PC 审批契约

申请状态统一使用 `src/domain/contracts.js` 和后端 `application.status` 字段中的枚举：

| 状态 | 含义 |
|---|---|
| `PENDING` | 待审批 |
| `APPROVED` | 已通过 |
| `REJECTED` | 已驳回 |
| `CANCELLED` | 已撤回 |

APP 端接口：

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/v1/applications` | 提交申请，写入 `PENDING` 状态 |
| `GET` | `/api/v1/applications/my` | 查询当前用户提交的申请 |
| `GET` | `/api/v1/applications/{id}` | 查询当前用户的申请详情 |
| `POST` | `/api/v1/applications/{id}/cancel` | 当前用户撤回待审批申请 |

PC 端审批接口：

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/v1/admin/applications?status=PENDING` | 查询待审批申请列表 |
| `GET` | `/api/v1/admin/applications/{id}` | 查询审批详情 |
| `PATCH` | `/api/v1/admin/applications/{id}/approve` | 审批通过，可传 `comment` |
| `PATCH` | `/api/v1/admin/applications/{id}/reject` | 审批驳回，必须传 `rejectReason` |

统一返回的申请对象核心字段：

```json
{
  "id": "1",
  "appNo": "APP20260611103000123",
  "type": "MATERIAL",
  "title": "鼓楼区宽带维修领料",
  "content": "现场维修领料",
  "applicantId": 101,
  "applicantName": "李明",
  "status": "PENDING",
  "rejectReason": "",
  "approverId": 201,
  "approverName": "王敏",
  "approvedAt": "2026-06-11 10:40:00",
  "extraJson": "{\"materials\":[]}",
  "createTime": "2026-06-11 10:30:00",
  "updateTime": "2026-06-11 10:40:00"
}
```

## 数据库

初始化脚本位于 `backend/src/main/resources/db/init.sql`，包括契约中的全部核心表，并增加以下业务必需扩展：

- `task.customer_name/contact_phone/address/materials_json`
- `task_feedback.image_urls_json`
- `opportunity.opportunity_no/next_contact_time/description`
- `opportunity_follow_record`
- `application.approver_id/approver_name/approved_at`
- `idempotency_record`

这些扩展用于支撑 APP 当前页面字段和后续生产级幂等持久化。

## 当前边界

- Token 当前为后端内存会话，接口边界已固定；生产环境应替换为 JWT + Redis 或统一认证中心。
- 幂等当前使用单机内存实现，并已预留 `idempotency_record` 表；多实例部署时应替换为数据库唯一键或 Redis。
- DeepSeek 未配置 Key 时使用本地降级结果；配置后会调用 `/chat/completions`。
- 当前开发机未安装 Java、Maven、Docker，前端已完成实际构建验证，后端需在具备 JDK 17/Maven 或 Docker 的环境执行编译启动验证。
