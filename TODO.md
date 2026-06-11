# TODO.md — 翼线助手双端项目

> 更新规则：完成一项划掉，发现新问题直接加到对应分类。

---

## ✅ 已完成（D1 骨架）

- [x] 项目目录结构初始化
- [x] docker-compose.yml（MySQL + 后端 + 前端）
- [x] 数据库初始化 SQL（含演示数据）
- [x] 后端 Spring Boot 骨架（pom.xml、启动类、公共层）
- [x] JWT 工具类 + 认证过滤器
- [x] 统一响应格式 Result + 全局异常处理
- [x] 登录接口 POST /api/v1/auth/login
- [x] 当前用户接口 GET /api/v1/auth/me
- [x] 前端 Vue3 + Ant Design Vue 项目骨架
- [x] 路由配置（含各模块占位页面）
- [x] 登录页面（含演示账号提示）
- [x] 主布局（左侧菜单 + 顶部栏 + AI④ 悬浮按钮）
- [x] HTTP 请求封装（自动携带 Token，统一错误处理）
- [x] AI④ 管理智脑对话抽屉（前端完整实现）
- [x] 字典管理页面（6号）
- [x] 技能标签管理页面（6号）
- [x] 操作日志页面（6号）
- [x] 架构契约文档（接口规范、数据库表、状态枚举）
- [x] AGENTS.md（AI 模块说明）

---

## 🔲 待完成

### 后端接口（各人负责自己模块）

**2号（程言欣）**
- [ ] POST /api/v1/applications — 提交申请
- [ ] GET  /api/v1/applications — 我的申请列表
- [ ] GET  /api/v1/approvals/pending — 待审批列表
- [ ] POST /api/v1/approvals/{id}/approve — 审批通过
- [ ] POST /api/v1/approvals/{id}/reject  — 驳回
- [ ] POST /api/v1/ai/extract — AI① 智能填单

**4号（戈世奇）**
- [ ] GET  /api/v1/tasks — 任务列表
- [ ] POST /api/v1/tasks/{id}/dispatch — 手动派单
- [ ] POST /api/v1/tasks/{id}/accept — 接单
- [ ] POST /api/v1/tasks/{id}/start   — 开始工作
- [ ] GET  /api/v1/dispatch/candidates/{taskId} — AI② 候选人
- [ ] POST /api/v1/ai/dispatch-reason — AI② 派单理由
- [ ] GET  /api/v1/users — 人员列表
- [ ] PUT  /api/v1/users/{id}/skills  — 更新技能

**5号（王默涵）**
- [ ] GET /api/v1/monitor/three-color — 三色看板
- [ ] GET /api/v1/monitor/summary    — 摘要数字
- [ ] GET /api/v1/stats/maintenance  — 装维统计
- [ ] GET /api/v1/stats/visit        — 拜访统计
- [ ] GET /api/v1/stats/opportunity  — 商机统计

**6号（蒋子涵）**
- [ ] GET/POST/DELETE /api/v1/dicts            — 字典管理
- [ ] GET/POST/DELETE /api/v1/dicts/{code}/items — 字典条目
- [ ] GET/POST/DELETE /api/v1/skills           — 技能标签
- [ ] GET             /api/v1/logs             — 操作日志
- [ ] POST            /api/v1/ai/query         — AI④ 管理智脑

**7号（闫焕文）**
- [ ] POST /api/v1/files/upload — 文件上传
- [ ] POST /api/v1/ai/chat     — AI③ 智能助手（后端）
- [ ] Docker 构建验证
- [ ] APK 打包流程

### 前端页面（各人负责自己模块）

- [ ] 审批列表 + 详情 + 通过/驳回（2号）
- [ ] 派单中心 + AI推荐候选人展示（4号）
- [ ] 人员管理 + 技能分配（4号）
- [ ] 三色看板（真实数据接入）（5号）
- [ ] 装维统计指标卡（5号）
- [ ] 拜访商机统计（5号）
- [ ] AI④ 后端接口实现（6号）

### 演示准备
- [ ] 验证演示数据：看板必须有红黄绿三色任务
- [ ] 准备5条 AI① 演示语句（含触发异常提示的用例）
- [ ] 全流程演练：装维闭环 + 客经闭环 + 管理查询

---

## 🐛 已知问题

> 发现 Bug 记录在这里，格式：[模块] 问题描述

- 暂无

---

## 📌 待确认事项

- [ ] APK 签名方式（7号确认）
- [ ] DeepSeek API Key（发到群私聊，不提交 git）
- [ ] 语音识别是否在目标 Android 机型上可用
