# 翼线助手 APP + PC 后台 + 后端联调版

本仓库是翼线助手第一版联调交付代码，包含 APP 前端、PC 管理后台前端、Java 后端、MySQL 初始化脚本和 DeepSeek AI 接入说明。

## 已打通能力

- APP 登录后提交申请。
- 后端保存申请，状态为 `PENDING`。
- PC 后台审批中心查看 APP 提交的申请。
- PC 后台审批通过或驳回，并写入审批人、审批时间和驳回原因。
- APP 再次查看申请详情时同步展示 `APPROVED` / `REJECTED`。
- APP 智能助手接入 DeepSeek：`POST /api/v1/ai/chat`。
- APP 智能填单接入 DeepSeek：`POST /api/v1/ai/extract`。
- PC 管理智脑接入 DeepSeek：`POST /api/v1/ai/query`。

## 目录结构

```text
.
├── yixian-assistant/
│   ├── backend/                 # Spring Boot 后端
│   ├── frontend-admin/          # Vue 3 + Vite + Element Plus PC 后台
│   ├── sql/init.sql             # MySQL 建表和演示数据
│   ├── README.md
│   ├── TODO.md
│   └── AGENTS.md
├── 翼线助手APP-v1.0/             # React + Vite APP/PWA 前端
├── screenshots/                 # 运行截图
├── README.md                    # 本说明
├── TODO.md                      # 当前状态和后续事项
└── AGENTS.md                    # AI 模块说明
```

如果你只拿到了 `yixian-assistant` 和 `翼线助手APP-v1.0` 两个项目目录，也可以按本文档分别启动。

## 本地环境要求

- JDK 17
- Maven 3.8+
- Node.js 20 或 22
- MySQL 8.x
- DeepSeek API Key

注意：真实 `DEEPSEEK_API_KEY` 不要提交到 GitHub，只能通过环境变量或私聊方式给组员。

## 数据库初始化

创建数据库：

```sql
CREATE DATABASE yixian DEFAULT CHARACTER SET utf8mb4;
```

导入初始化脚本：

```bash
mysql -uroot -p yixian < yixian-assistant/sql/init.sql
```

如果演示账号密码不正确，可以统一重置为 `demo123`：

```sql
UPDATE sys_user
SET password = '$2b$10$ex2rNa4.P6HDT8uh7jxhr.0blnK3M1sFg6iuKUtseB.ALB68lfYe2'
WHERE username IN ('admin','dispatcher','zhangsan','lisi','wangwu','observer');
```

## 启动后端

进入后端目录：

```bash
cd yixian-assistant/backend
```

Windows PowerShell 示例：

```powershell
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
$env:DB_NAME="yixian"
$env:DB_USER="root"
$env:DB_PASSWORD="你的MySQL密码"
$env:DEEPSEEK_API_KEY="你的DeepSeek Key"
$env:DEEPSEEK_BASE_URL="https://api.deepseek.com"
$env:DEEPSEEK_MODEL="deepseek-chat"

mvn spring-boot:run
```

Linux / macOS 示例：

```bash
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_NAME=yixian
export DB_USER=root
export DB_PASSWORD=你的MySQL密码
export DEEPSEEK_API_KEY=你的DeepSeek Key
export DEEPSEEK_BASE_URL=https://api.deepseek.com
export DEEPSEEK_MODEL=deepseek-chat

mvn spring-boot:run
```

后端默认地址：

```text
http://127.0.0.1:8080
```

## 启动 PC 后台

进入 PC 后台目录：

```bash
cd yixian-assistant/frontend-admin
```

创建 `.env.local`：

```env
VITE_API_MODE=remote
VITE_API_BASE_URL=/api/v1
VITE_API_TARGET=http://127.0.0.1:8080
VITE_API_TOKEN=
```

安装依赖并启动：

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 6006
```

访问：

```text
http://127.0.0.1:6006
```

PC 登录账号：

```text
admin / demo123
```

## 启动 APP 前端

进入 APP 目录：

```bash
cd 翼线助手APP-v1.0
```

创建 `.env.local`：

```env
VITE_API_MODE=remote
VITE_API_BASE_URL=/api/v1
VITE_API_TARGET=http://127.0.0.1:8080
VITE_API_TIMEOUT=15000
```

安装依赖并启动：

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 6008
```

访问：

```text
http://127.0.0.1:6008
```

APP 登录账号：

```text
zhangsan / demo123
```

说明：APP 页面上写的是“工号”，但当前真实后端登录字段使用 `username`，所以演示时填写 `zhangsan`。

## 核心接口测试

### 1. 登录获取管理员 Token

```bash
ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"demo123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
```

### 2. 登录获取 APP 用户 Token

```bash
APP_TOKEN=$(curl -s -X POST http://127.0.0.1:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"demo123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
```

### 3. APP 提交申请

```bash
curl -X POST http://127.0.0.1:8080/api/v1/applications \
  -H "Authorization: Bearer $APP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"MATERIAL",
    "title":"GitHub交付测试申请",
    "content":"测试APP提交后PC后台审批中心是否可见",
    "extra":{"urgency":"NORMAL","location":"南京市鼓楼区"},
    "idempotencyKey":"github-release-test-001"
  }'
```

### 4. PC 查询待审批申请

```bash
curl -s "http://127.0.0.1:8080/api/v1/admin/applications?status=PENDING" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 5. PC 审批通过

把 `{id}` 替换为申请 ID：

```bash
curl -X PATCH http://127.0.0.1:8080/api/v1/admin/applications/{id}/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment":"同意申请","idempotencyKey":"approve-github-release-test-001"}'
```

### 6. PC 审批驳回

```bash
curl -X PATCH http://127.0.0.1:8080/api/v1/admin/applications/{id}/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rejectReason":"请补充物料数量和使用地点","idempotencyKey":"reject-github-release-test-001"}'
```

### 7. APP 查看我的申请

```bash
curl -s http://127.0.0.1:8080/api/v1/applications/my \
  -H "Authorization: Bearer $APP_TOKEN"
```

### 8. APP 智能助手

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/ai/chat \
  -H "Authorization: Bearer $APP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"领料怎么申请","sessionId":"app-ai-test","history":[]}'
```

### 9. APP 智能填单

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/ai/extract \
  -H "Authorization: Bearer $APP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input":"明天去鼓楼区修宽带，领一台光猫和一根光纤","applicationType":"MATERIAL"}'
```

### 10. PC 管理智脑

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/ai/query \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question":"请基于本周完成率88.6%，用管理者口吻给出一句风险判断和一句改进建议",
    "sessionId":"pc-ai-test",
    "context":{
      "metrics":{
        "weeklyCompletionRate":88.6,
        "weeklyCompleted":74,
        "weeklyExpected":84
      }
    }
  }'
```

## 页面验证流程

1. 启动 MySQL、后端、PC 后台、APP 前端。
2. APP 登录 `zhangsan / demo123`。
3. APP 提交一条申请。
4. PC 登录 `admin / demo123`。
5. 进入审批中心，确认能看到 `PENDING` 申请。
6. PC 审批通过或驳回。
7. APP “我的申请/申请详情”查看审批状态、审批人、审批时间和驳回原因。
8. APP 智能助手提问“领料怎么申请”。
9. PC 右下角“智脑”提问“本周工单完成率是多少？”。

## 运行截图

运行截图放在：

```text
screenshots/
```

建议至少保留：

- APP 登录或申请提交页面。
- PC 审批中心页面。
- APP 查看审批结果页面。
- APP 智能助手 DeepSeek 回复。
- PC 管理智脑 DeepSeek 回复。

## 安全注意

- 不要提交 `.env`、`.env.local`。
- 不要提交真实 `DEEPSEEK_API_KEY`。
- 不要提交 `node_modules`、`dist`、`target`、日志文件。
- 如果 Key 曾经出现在截图或聊天记录里，建议在 DeepSeek 平台重新生成新 Key。

