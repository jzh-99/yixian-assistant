# 装维功能代码提取

从 **翼线助手 APP V1.0** 项目中提取的装维人员核心功能代码，包含工作台、AI 领料填单、接单、开始工作、完工反馈的完整前后端实现。

> 源项目路径：`Desktop/翼线助手APP-v1.0/APP-v1.0`

## 功能模块

| 功能 | 说明 | 前端文件 | 后端接口 |
|------|------|----------|----------|
| 装维工作台 | 四态任务筛选、超时高亮、快速领料入口 | `frontend/screens/OpsHomeScreen.jsx` | `GET /api/v1/tasks` |
| 接单 | 待接单 → 已接单 | `frontend/core/taskActions.js` | `POST /api/v1/tasks/{id}/accept` |
| 开始工作 | 已接单 → 进行中 | `frontend/core/taskActions.js` | `POST /api/v1/tasks/{id}/start` |
| AI 领料填单 | 自然语言描述 → AI 解析 → 确认提交 | `SmartFormScreen.jsx` + `MaterialPreviewScreen.jsx` | `POST /api/v1/ai/extract` |
| 完工反馈 | 用料、备注、图片、签名 | `frontend/screens/TaskFeedbackScreen.jsx` | `POST /api/v1/tasks/{id}/complete` |

## 目录结构

```
装维功能代码提取/
├── README.md                          # 本文件
├── docs/
│   ├── 功能说明.md                    # 业务流程与状态机
│   └── 原项目代码行号对照.md          # App.jsx 源码行号索引
├── frontend/
│   ├── screens/                       # 页面组件（从 App.jsx 拆分）
│   │   ├── OpsHomeScreen.jsx          # 装维工作台
│   │   ├── TaskCard.jsx               # 任务卡片
│   │   ├── TaskDetailScreen.jsx       # 任务详情（接单/开始入口）
│   │   ├── TaskFeedbackScreen.jsx     # 完工反馈
│   │   ├── SmartFormScreen.jsx        # AI 领料智能填单
│   │   ├── MaterialPreviewScreen.jsx  # 领料申请确认
│   │   └── FormFields.jsx             # 共享表单组件
│   ├── core/
│   │   └── taskActions.js             # 任务状态流转逻辑
│   ├── services/
│   │   ├── maintainerApi.js           # 装维相关 API
│   │   ├── httpClient.js
│   │   └── authStore.js
│   ├── domain/
│   │   ├── contracts.js               # 枚举与数据模型
│   │   └── apiAdapters.js             # 后端数据适配
│   ├── data/
│   │   └── maintainerMockData.js      # 演示数据
│   ├── components/
│   │   └── ui.jsx                     # UI 基础组件
│   └── config/
│       └── runtime.js
├── backend/
│   ├── task/                          # 任务模块（接单/开始/完工）
│   └── ai/                            # AI 解析接口
└── styles/
    └── styles.css                     # 完整样式表
```

## 任务状态流转

```
PENDING_ACCEPTANCE (待接单)
        │ 接单 accept
        ▼
    ACCEPTED (已接单)
        │ 开始 start
        ▼
   IN_PROGRESS (进行中)
        │ 完工反馈 complete
        ▼
    COMPLETED (已完成)
```

## 演示账号

| 工号 | 密码 | 角色 |
|------|------|------|
| ZW10086 | 123456 | 装维人员 |

## 接入说明

本文件夹为**代码提取包**，非独立可运行项目。如需运行完整应用，请回到源项目：

```bash
cd "Desktop/翼线助手APP-v1.0/APP-v1.0"
npm install
npm run dev
# 访问 http://localhost:4173，使用装维账号登录
```

提取的模块可按以下方式复用到新项目：

1. 复制 `frontend/screens/` 与 `frontend/core/` 到目标项目
2. 引入 `maintainerApi.js` 或对接真实后端接口
3. 引入 `styles/styles.css` 或按需抽取相关样式类

## 后端 API 契约

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/tasks` | 任务列表（装维人员仅看自己的） |
| POST | `/api/v1/tasks/{id}/accept` | 接单，需传 `version` |
| POST | `/api/v1/tasks/{id}/start` | 开始工作，需传 `version` |
| POST | `/api/v1/tasks/{id}/complete` | 完工反馈 |
| POST | `/api/v1/ai/extract` | AI 领料解析 |
| POST | `/api/v1/applications` | 提交领料申请 |
| POST | `/api/v1/files/upload` | 上传现场图片/签名 |

所有写操作支持 `idempotencyKey` 幂等键，任务更新使用乐观锁 `version` 字段。
