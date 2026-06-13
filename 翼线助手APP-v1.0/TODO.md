# TODO

## 已完成

- [x] 前端 Mock/真实 API 双模式。
- [x] 统一响应、Bearer Token、requestId 和错误码处理。
- [x] 标准角色与业务状态枚举。
- [x] 登录、申请、任务、拜访、商机、文件、AI 接口骨架。
- [x] MyBatis Plus 实体和 Mapper。
- [x] MySQL 初始化脚本和演示数据。
- [x] 写操作幂等键和任务乐观锁。
- [x] Docker Compose 启动配置。

## 联调阶段

- [ ] 在 JDK 17 + Maven 环境执行 `mvn test` 和 `mvn package`。
- [ ] 在 Docker 环境执行 `docker compose up --build`。
- [ ] 将内存 Token 替换为 JWT + Redis 或企业统一认证。
- [ ] 将内存幂等实现替换为 `idempotency_record` 唯一键或 Redis。
- [ ] 根据真实 DeepSeek 返回完善结构化字段校验和知识库引用。
- [ ] 补充用户、字典、监控、统计等 PC 后台接口实现。
- [ ] 增加 Controller、Service、Mapper 集成测试。
