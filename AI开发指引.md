# 翼线助手 · AI 辅助开发指引

> 本文档供没有 AI 编程经验的队友使用。  
> 把这份文档的内容贴给 AI（Claude / Cursor / Copilot 均可），再说"我负责 X 号模块，帮我开始"，AI 就能正确理解整个项目背景。

---

## 第一步：给 AI 的开场白（直接复制）

```
我在开发一个叫"翼线助手"的项目，这是我们团队的 AI 课程作品。
项目已有骨架代码，我需要你帮我实现我负责的模块。

项目仓库：https://github.com/jzh-99/yixian-assistant
本地路径：/root/autodl-tmp/zhiwei/

请先读以下文件了解全貌：
1. README.md          — 启动方式和演示账号
2. AGENTS.md          — 4 个 AI 模块说明
3. TODO.md            — 各人待完成任务清单
4. sql/init.sql       — 数据库表结构和演示数据
5. backend/src/main/java/com/yixian/common/Result.java  — 统一响应格式
6. backend/src/main/java/com/yixian/auth/UserContext.java — 当前用户获取

读完之后告诉我你理解了哪些内容，然后我告诉你我是几号，一起开始。
```

---

## 项目概览（AI 背景知识）

| 项 | 内容 |
|---|---|
| 后端 | Spring Boot 3.2 + MyBatis Plus，包名 `com.yixian` |
| PC 前端 | Vue 3 + Element Plus，路径 `pc/` |
| 数据库 | MySQL 8，建表脚本 `sql/init.sql` |
| AI 接口 | DeepSeek API，全部由后端调用，前端不持有 key |
| 统一响应 | `{ code, message, data, requestId }`，code=0 为成功 |
| 认证 | JWT Bearer Token，从 `UserContext.get()` 取当前用户 |
| 接口前缀 | 所有接口以 `/api/v1/` 开头 |

---

## 各人模块速查

### 2号 — 审批模块

**后端接口（新建文件 `backend/src/main/java/com/yixian/approval/`）**
- `POST /api/v1/applications` — 提交申请
- `GET  /api/v1/applications` — 我的申请列表（分页）
- `GET  /api/v1/approvals/pending` — 待审批列表
- `POST /api/v1/approvals/{id}/approve` — 审批通过
- `POST /api/v1/approvals/{id}/reject` — 驳回
- `POST /api/v1/ai/extract` — AI① 智能填单（调 DeepSeek，返回结构化字段）

**前端**：`pc/src/views/ApprovalsView.vue` 已有完整骨架，对接 `remoteApi.js` 里的 `adminWriteApi.approve/reject`

**给 AI 说**：`我是2号，负责审批模块，请读 sql/init.sql 中的 application 和 approval_record 表，帮我写后端 Controller + Service + Mapper`

---

### 3号 — APP 智能助手（AI③）

**负责内容**
- `POST /api/v1/ai/chat` — 接收用户问题，注入业务 FAQ，调 DeepSeek 返回答案
- APP 端 AI 助手悬浮球已在 `翼线助手APP-v1.0.zip` 里实现，需要对接这个接口

**Prompt 设计要点**
- System prompt 注入 20 条业务 FAQ（审批流程、物料标准、常见故障）
- 返回字段：`{ answer, confidence, suggestedAction, source }`
- 低置信度时（< 0.7）回复"建议联系主管确认"

**给 AI 说**：`我是3号，负责 AI③ 智能助手后端接口，请读 AGENTS.md 中 AI③ 的说明，帮我在 backend 里新建 AiChatController，调用 DeepSeek API`

---

### 4号 — 派单 + 人员模块

**后端接口（新建 `backend/src/main/java/com/yixian/task/` 和 `com/yixian/user/`）**
- `GET  /api/v1/tasks` — 任务列表（支持状态筛选）
- `POST /api/v1/tasks/{id}/dispatch` — 手动派单
- `POST /api/v1/tasks/{id}/accept` — 接单
- `POST /api/v1/tasks/{id}/start` — 开始工作
- `GET  /api/v1/dispatch/candidates/{taskId}` — AI② 候选人列表（算法选人）
- `POST /api/v1/ai/dispatch-reason` — AI② 派单理由（调 DeepSeek 生成一句话）
- `GET  /api/v1/users` — 人员列表
- `PUT  /api/v1/users/{id}/skills` — 更新技能

**前端**：`DispatchView.vue` 和 `PeopleView.vue` 已有骨架

**给 AI 说**：`我是4号，负责派单和人员模块，请读 sql/init.sql 中的 task、dispatch_record、user_skill 表结构，帮我写任务派单相关的后端接口`

---

### 5号 — 监控 + 统计模块

**后端接口（新建 `backend/src/main/java/com/yixian/monitor/`）**
- `GET /api/v1/monitor/three-color` — 三色看板数据（红=超期，黄=48h内到期，绿=正常）
- `GET /api/v1/monitor/summary` — 摘要数字（今日完成数、待处理数等）
- `GET /api/v1/stats/maintenance` — 装维效率统计（人均完成数、平均用时）
- `GET /api/v1/stats/visit` — 拜访统计
- `GET /api/v1/stats/opportunity` — 商机统计

**三色判断逻辑**
```
红：expected_finish_time < NOW() 且 status != COMPLETED
黄：expected_finish_time BETWEEN NOW() AND NOW() + 48h
绿：其余进行中任务
```

**前端**：`MonitorView.vue` 和 `EfficiencyView.vue` 已有骨架

**给 AI 说**：`我是5号，负责监控统计模块，请读 sql/init.sql 中的 task 表，帮我写三色看板和统计接口，三色判断逻辑是：红色=已超期，黄色=48小时内到期，绿色=正常`

---

### 6号 — 系统配置 + AI④ 管理智脑

**后端接口（新建 `backend/src/main/java/com/yixian/system/`）**
- `GET/POST/DELETE /api/v1/dicts` — 字典类型管理
- `GET/POST/DELETE /api/v1/dicts/{code}/items` — 字典条目
- `GET/POST/DELETE /api/v1/skills` — 技能标签
- `GET /api/v1/logs` — 操作日志（分页）
- `POST /api/v1/ai/query` — AI④ 管理智脑（意图识别 + 参数化 SQL 模板）

**AI④ 设计原则**（重要）
- 禁止 LLM 直接写 SQL
- 流程：用户问题 → DeepSeek 识别意图 → 匹配白名单模板 → 参数化查询 → 返回结构化结果
- 支持意图：任务统计、人员排行、超期分析、商机汇总、申请趋势

**前端**：`SettingsView.vue` 已完整实现字典/技能/日志三个 tab，`SmartBrain.vue` 是 AI④ 的聊天组件

**给 AI 说**：`我是6号，负责系统配置和 AI④ 管理智脑，请读 AGENTS.md 中 AI④ 的说明和 sql/init.sql 中的 sys_dict、sys_dict_item、skill、operation_log 表，帮我实现后端接口`

---

### 7号 — 文件上传 + APP 后端 + 部署

**负责内容**
- `POST /api/v1/files/upload` — 文件上传（本地存储或 MinIO）
- APP 后端 Spring Boot 骨架（参考 `翼线助手APP-v1.0.zip/backend/`）
- `docker compose up --build` 验证整体可运行
- APK 打包（PWA 转 APK 用 Bubblewrap 或直接用 Chrome "添加到主屏幕"）

**给 AI 说**：`我是7号，负责文件上传接口和 Docker 部署验证，请读 docker-compose.yml 和 backend/src/main/resources/application.yml，帮我实现文件上传接口并验证 docker compose 能正常启动`

---

## 写后端接口的标准模式

每个模块的文件结构如下，参考已有的 `auth` 模块：

```
com/yixian/
  auth/              ← 已有，参考这个
    AuthController.java
    AuthService.java
    UserContext.java
  your_module/       ← 你新建的
    XxxController.java   — @RestController，@RequestMapping("/api/v1/xxx")
    XxxService.java      — 业务逻辑
    XxxMapper.java       — MyBatis Plus，继承 BaseMapper<T>
    XxxEntity.java       — 对应数据库表，@TableName("xxx")
```

**Controller 模板**
```java
@RestController
@RequestMapping("/api/v1/your-path")
@RequiredArgsConstructor
public class XxxController {
    private final XxxService service;

    @GetMapping
    public Result<List<XxxVO>> list(...) {
        return Result.ok(service.list(...));
    }
}
```

**获取当前用户**
```java
UserInfo user = UserContext.get();
Long userId = user.getUserId();
String roleCode = user.getRoleCode();
```

**返回格式**
```java
return Result.ok(data);        // 成功
return Result.fail("错误信息"); // 失败
```

---

## 常见问题

**Q：不知道接口入参/出参怎么定义？**  
读 `sql/init.sql` 对应的表结构，字段名转驼峰就是 VO 字段名。

**Q：怎么调 DeepSeek？**  
读 `AGENTS.md` 对应模块的 Prompt 策略，用 Spring 的 `RestTemplate` 或 `WebClient` 调 `https://api.deepseek.com/v1/chat/completions`，Key 从环境变量 `DEEPSEEK_API_KEY` 取。

**Q：前端怎么切换真实接口？**  
在 `pc/` 目录新建 `.env.local`：
```
VITE_API_MODE=remote
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

**Q：本地怎么启动后端？**  
```bash
cd /root/autodl-tmp/zhiwei
docker compose up -d mysql   # 先启动数据库
cd backend
mvn spring-boot:run           # 启动后端，端口 8080
```

**Q：演示账号是什么？**  
用户名 `admin`，密码 `demo123`（见 README.md）
