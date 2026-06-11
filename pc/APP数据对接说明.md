# APP 数据对接说明

## 对接目标

后台与翼线助手 APP 共用申请、任务、拜访、商机和人员身份数据。APP 负责提交申请、接单、开始工作和完工反馈；后台负责审批、派单、监控、统计和审计。

所有接口沿用工作区《架构契约文档》的统一响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "requestId": "uuid"
}
```

认证头：

```text
Authorization: Bearer <token>
```

写操作必须携带 `idempotencyKey`。

## 已有 APP 接口

| 用途 | 方法与路径 | 后台使用位置 |
| --- | --- | --- |
| 申请列表 | `GET /api/v1/applications` | 审批中心、工作台 |
| 申请详情 | `GET /api/v1/applications/{id}` | 申请详情抽屉 |
| 审批记录 | `GET /api/v1/approvals/{id}/records` | 审批轨迹 |
| 任务列表 | `GET /api/v1/tasks` | 派单中心、三色监控、装维统计 |
| 任务详情 | `GET /api/v1/tasks/{id}` | 任务详情抽屉 |
| 拜访列表 | `GET /api/v1/visits` | 拜访统计 |
| 商机列表 | `GET /api/v1/opportunities` | 商机统计与管理智脑 |
| 当前用户 | `GET /api/v1/auth/me` | 登录身份与组织范围 |

APP 对任务执行状态的写入沿用：

- `POST /api/v1/tasks/{id}/accept`
- `POST /api/v1/tasks/{id}/start`
- `POST /api/v1/tasks/{id}/complete`

后台定时刷新或通过 WebSocket/SSE 接收这些状态后，更新三色监控和统计指标。

## 后台需补充的写接口

现有 APP Spring Boot 工程尚未暴露管理员审批和派单接口。生产联调需补充：

### 审批通过

`POST /api/v1/admin/applications/{id}/approve`

```json
{
  "comment": "同意，请按客户预约时间处理",
  "idempotencyKey": "approve-uuid"
}
```

后端事务内完成：状态校验、权限与组织范围校验、审批记录写入、申请置为 `APPROVED`、需要执行的申请创建 `UNASSIGNED` 任务、操作日志写入。

### 审批驳回

`POST /api/v1/admin/applications/{id}/reject`

```json
{
  "reason": "物料数量与工单需求不一致，请核对后重新提交",
  "idempotencyKey": "reject-uuid"
}
```

驳回原因长度为 5-500 字，并同步给申请人 APP。

### 确认派单

`POST /api/v1/admin/tasks/{id}/dispatch`

```json
{
  "assigneeId": 101,
  "remark": "技能完全匹配，当前负载较低",
  "candidateSnapshot": [
    { "userId": 101, "score": 88 }
  ],
  "idempotencyKey": "dispatch-uuid"
}
```

后端必须再次校验人员启用状态、人员类型、组织范围、并发上限和必需技能，不得只信任前端候选结果。

### 任务改派

`POST /api/v1/admin/tasks/{id}/reassign`

```json
{
  "assigneeId": 103,
  "reason": "原执行人临时无法到场",
  "version": 2,
  "idempotencyKey": "reassign-uuid"
}
```

改派必须使用任务 `version` 做并发控制，并记录原执行人、新执行人、原因、操作者、时间和候选快照。

## 状态约定

申请状态沿用 `DRAFT / PENDING / APPROVED / REJECTED / CANCELLED`。

任务状态沿用：

```text
UNASSIGNED
→ PENDING_ACCEPTANCE
→ ACCEPTED
→ IN_PROGRESS
→ COMPLETED
```

管理员改派可以将 `PENDING_ACCEPTANCE / ACCEPTED / IN_PROGRESS` 重新置为 `UNASSIGNED` 或直接生成新的 `PENDING_ACCEPTANCE` 派单版本，具体由后端统一实现。

## AI②边界

候选计算先执行确定性硬约束：

1. 人员启用且可接单。
2. 人员类型符合任务要求。
3. 人员位于任务组织或允许支援范围。
4. 当前未完成任务数小于最大并发数。
5. 人员具备任务全部必需技能。

通过硬约束后，再按技能匹配、当前负载、同组织优先和历史表现评分。大模型只可参与文本技能归一化或解释文案，不直接决定最终候选。

## AI④边界

管理智脑只接收受控 `intentId + parameters`，后端注入当前用户组织范围并路由到预定义指标服务。禁止将模型生成内容直接拼接为 SQL，禁止通过问答扩大数据权限。
