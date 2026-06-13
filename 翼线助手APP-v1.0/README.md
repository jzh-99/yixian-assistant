# 翼线助手 APP V1.0

翼线助手是面向装维人员和客户经理的一线业务移动应用。本版本依据《产品需求文档》和《Stitch 界面生成需求》实现，可直接运行、构建并安装为 PWA。

## 版本定位

- 版本：`1.0.0`
- 形态：移动端 PWA，可在 Android Chrome 中添加到主屏幕
- UI：360–430px 移动端优先，同时提供桌面手机画布预览
- 数据：支持本地 Mock 与 Spring Boot + MySQL 真实接口切换
- 状态：MVP 核心演示流程可用

当前环境无法连接外部 UniApp 依赖源，因此 V1.0 使用本机可验证的 React + Vite 实现。页面、状态模型与业务服务层均按原 PRD 设计；后续迁移到 UniApp 时可复用数据模型、接口协议、文案与视觉规范。

## 已实现功能

### 通用能力

- 工号密码登录与角色识别
- 登录态刷新保持
- 三个底部 Tab：工作台、智能填单、我的
- 智能助手全局悬浮球，可拖动和贴边停靠
- 智能助手全屏问答、知识来源、低置信度提示和业务动作跳转
- 我的申请列表、类型/状态筛选、详情、审批时间线、撤回和重新发起
- 个人资料与退出登录
- Toast、确认弹窗、表单校验、空状态和加载状态

### 装维人员

- 待接单、已接单、进行中、已完成任务分类
- 超时任务高亮
- 接单、开始工作和反馈完工状态流转
- AI 领料申请解析、低置信度提示、物料增删改和提交
- 完工反馈：实际用料、备注、最多 3 张图片和手写签名

### 客户经理

- 今日拜访、模拟签到和待跟进商机
- AI 外出拜访申请解析与提交
- 商机列表、筛选、详情、新建、编辑和新增跟进
- 快速技术/方案支撑申请

## 演示账号

| 角色 | 工号 | 密码 |
|---|---|---|
| 装维人员 | `ZW10086` | `123456` |
| 客户经理 | `AM10028` | `123456` |

登录页可以直接点击角色卡片切换演示账号。

## 本地运行

项目要求 Node.js `22.12.0` 或更高版本，目录内提供 `.nvmrc`。

```bash
cd "/Users/zhengziyin/Documents/AI特训营/10-1翼线助手APP端/翼线助手APP-v1.0"
nvm use
npm install
npm run dev
```

默认访问地址：

```text
http://localhost:4173
```

## 生产构建

```bash
nvm use
npm run build
npm run preview
```

构建结果输出到 `dist/`。

## Android 安装方式

1. 将生产构建部署到 HTTPS 地址。
2. 使用 Android Chrome 打开应用。
3. 在浏览器菜单中选择“添加到主屏幕”或“安装应用”。
4. 安装后以独立窗口运行，显示名称为“翼线助手”。

如需生成原生 APK，可在下一阶段选择以下路径：

- 将当前 PWA 接入 Capacitor 生成 Android 工程。
- 按 PRD 技术要求，将页面组件和服务层迁移到 UniApp + Vue3 后使用 HBuilderX 云打包。

## 项目结构

```text
翼线助手APP-v1.0/
├── public/
│   ├── app-icon.svg
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── components/
│   │   └── ui.jsx
│   ├── data/
│   │   └── mockData.js
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
└── vite.config.js
```

## 后端与数据库

项目已按《架构契约文档》增加后端骨架：

```text
backend/
├── pom.xml
├── Dockerfile
└── src/main/
    ├── java/com/zhiwei/
    └── resources/db/init.sql
```

技术栈：

- Spring Boot 3.3
- MyBatis Plus
- MySQL 8
- DeepSeek API
- 本地 `/uploads` 文件存储
- Docker Compose

接口、数据库和前端服务层的对应关系见：

```text
ARCHITECTURE_INTEGRATION.md
```

### Mock 模式

`.env` 中配置：

```dotenv
VITE_API_MODE=mock
```

只需运行前端，即可继续使用演示数据。

### 真实后端模式

复制环境变量模板：

```bash
cp .env.example .env
```

将 `.env` 调整为：

```dotenv
VITE_API_MODE=remote
VITE_API_BASE_URL=/api/v1
```

具备 Docker 环境时启动数据库和后端：

```bash
docker compose up --build
```

然后启动前端：

```bash
nvm use
npm run dev
```

前端开发服务会把 `/api` 和 `/uploads` 转发到 `http://127.0.0.1:8080`。

也可以使用本机 JDK 17 + Maven 启动后端：

```bash
cd backend
mvn spring-boot:run
```

数据库初始化脚本：

```text
backend/src/main/resources/db/init.sql
```

演示账号仍为：

| 角色 | 工号 | 密码 |
|---|---|---|
| 装维人员 | `ZW10086` | `123456` |
| 客户经理 | `AM10028` | `123456` |

前端不会自行解析 Token，登录后统一调用 `GET /api/v1/auth/me`。

## 已验证路径

- 装维账号登录
- 智能助手悬浮球打开、FAQ 回答、动作跳转和返回
- 装维任务接单状态更新
- AI 领料解析并提交申请
- 进行中任务填写完工反馈和手写签名后完成
- 客户经理工作台与模拟签到
- 快速支撑申请提交
- 商机列表、新建商机和商机详情
- 生产构建

## 已知边界

- 默认仍为 Mock 模式；设置 `VITE_API_MODE=remote` 后调用真实后端。
- 图片选择使用浏览器文件选择器；原生相机能力需在 APK 壳层中接入。
- 语音输入当前用模拟识别结果展示完整交互，原生语音权限和识别能力需在目标 Android 设备接入。
- 后端 Token 与幂等当前是单机实现，生产环境应切换为 JWT/Redis 或统一认证服务。
- 当前开发机没有 Java、Maven、Docker，因此后端源码和容器配置已完成静态校验，但尚未在本机实际编译启动。
