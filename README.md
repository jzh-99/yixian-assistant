# README.md — 翼线助手双端项目

> 第10组 | 课程 AI Coding 项目 | 2026年6月

---

## 项目简介

翼线助手是为江苏电信装维人员和客户经理设计的智能移动作业平台，包含：
- **Android APP**：AI① 智能填单、AI③ 智能助手、我的申请、任务执行反馈
- **PC 后台**：审批中心、AI② 智能派单、三色看板、统计看板、AI④ 管理智脑

---

## 演示账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | demo123 | 超级管理员 |
| dispatcher | demo123 | 调度员 |
| zhangsan | demo123 | 装维人员 |
| lisi | demo123 | 装维人员 |
| wangwu | demo123 | 客户经理 |
| observer | demo123 | 只读观察员 |

---

## 一键启动（推荐）

### 前置要求
- Docker 和 Docker Compose 已安装
- 复制并填写环境变量文件

```bash
cp .env.example .env
# 编辑 .env，填入真实的 DEEPSEEK_API_KEY
```

### 启动所有服务

```bash
docker compose up -d
```

启动后访问：
- **后台管理系统**：http://localhost（或 http://服务器IP）
- **后端 API**：http://localhost:8080
- **Swagger 文档**：http://localhost:8080/swagger-ui/index.html

### 查看日志

```bash
docker compose logs -f backend   # 后端日志
docker compose logs -f mysql     # 数据库日志
```

### 停止服务

```bash
docker compose down
```

---

## 本地开发启动

### 后端（需要 Java 17 + Maven）

```bash
cd backend
# 确保本地 MySQL 已启动并执行了 sql/init.sql
mvn spring-boot:run
# 后端运行在 http://localhost:8080
```

### 前端后台

```bash
cd frontend-admin
npm install
npm run dev
# 前端运行在 http://localhost:5173
# 自动代理 /api 到 localhost:8080
```

---

## 核心接口测试

### 1. 登录获取 Token

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"demo123"}'
```

返回示例：
```json
{"code":0,"data":{"token":"eyJ...","roleCode":"SUPER_ADMIN",...}}
```

### 2. 获取当前用户

```bash
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer <上一步的token>"
```

### 3. AI① 智能填单

```bash
curl -X POST http://localhost:8080/api/v1/ai/extract \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"input":"明天上午去江宁修光缆，带50米光缆和熔接机","applicationType":"MATERIAL"}'
```

### 4. AI④ 管理智脑查询

```bash
curl -X POST http://localhost:8080/api/v1/ai/query \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question":"本周超时任务最多的是哪个团队？"}'
```

### 5. 三色看板摘要

```bash
curl http://localhost:8080/api/v1/monitor/summary \
  -H "Authorization: Bearer <token>"
```

---

## 项目结构

```
zhiwei/
├── backend/               # Spring Boot 后端
│   ├── src/main/java/com/yixian/
│   │   ├── auth/          # 登录认证（1号）
│   │   ├── application/   # 申请审批（2号）
│   │   ├── task/          # 任务派单（4号）
│   │   ├── monitor/       # 看板统计（5号）
│   │   ├── system/        # 字典日志（6号）
│   │   ├── ai/            # AI接口（6号）
│   │   └── common/        # 公共工具
│   └── Dockerfile
├── frontend-admin/        # Vue3 PC 后台
│   ├── src/
│   │   ├── views/         # 页面组件（各人负责各模块）
│   │   ├── components/    # 公共组件（含 AiBrainDrawer）
│   │   ├── stores/        # Pinia 状态管理
│   │   ├── utils/http.js  # 请求封装
│   │   └── router/        # 路由配置
│   └── Dockerfile
├── sql/
│   └── init.sql           # 建表 + 演示数据
├── docs/                  # 产品需求文档
├── docker-compose.yml
├── .env.example           # 环境变量模板（不含真实密钥）
├── AGENTS.md              # AI 模块说明
├── TODO.md                # 待办事项
└── README.md
```

---

## 技术栈

| 层 | 技术 |
|----|------|
| Android APP | UniApp + Vue3 |
| PC 后台 | Vue3 + Ant Design Vue 4 |
| 后端 | Spring Boot 3 + MyBatis Plus |
| 数据库 | MySQL 8.0 |
| AI | DeepSeek API |
| 部署 | Docker Compose |

---

## 常见问题

**Q：启动后访问页面空白？**
A：检查 `docker compose logs frontend`，确认构建成功。

**Q：登录提示账号密码错误？**
A：确认数据库已执行 `sql/init.sql`，检查 `docker compose logs mysql`。

**Q：AI 功能返回"服务不可用"？**
A：检查 `.env` 中 `DEEPSEEK_API_KEY` 是否填写正确。

**Q：看板全是绿色任务？**
A：演示数据已预置红黄任务，确认 `init.sql` 执行完整。
