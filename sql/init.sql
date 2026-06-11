-- 翼线助手双端项目 · 数据库初始化脚本
-- 执行前确保已创建数据库：CREATE DATABASE yixian DEFAULT CHARACTER SET utf8mb4;
-- 项目组：第10组

SET NAMES utf8mb4;
USE yixian;

-- ======================== 1. 用户与组织（1号） ========================

CREATE TABLE IF NOT EXISTS sys_dept (
  id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  parent_id   BIGINT       DEFAULT 0,
  sort        INT          DEFAULT 0,
  create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_user (
  id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password      VARCHAR(100) NOT NULL COMMENT 'BCrypt加密',
  real_name     VARCHAR(50),
  phone         VARCHAR(20),
  role_code     VARCHAR(30)  NOT NULL COMMENT 'SUPER_ADMIN/DEPT_ADMIN/DISPATCHER/MAINTAINER/ACCOUNT_MANAGER/OBSERVER',
  dept_id       BIGINT,
  employee_no   VARCHAR(30)  UNIQUE,
  status        TINYINT      DEFAULT 1 COMMENT '1启用 0停用',
  max_concurrent INT         DEFAULT 3,
  create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted    TINYINT      DEFAULT 0
);

-- ======================== 2. 申请与审批（2号） ========================

CREATE TABLE IF NOT EXISTS application (
  id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
  app_no        VARCHAR(30)  NOT NULL UNIQUE,
  type          VARCHAR(30)  NOT NULL COMMENT 'MATERIAL/VISIT/SUPPORT',
  title         VARCHAR(200),
  content       TEXT,
  applicant_id  BIGINT       NOT NULL,
  dept_id       BIGINT,
  status        VARCHAR(30)  DEFAULT 'PENDING' COMMENT 'DRAFT/PENDING/APPROVED/REJECTED/CANCELLED',
  reject_reason VARCHAR(500),
  extra_json    TEXT         COMMENT '各类型扩展字段JSON',
  idempotency_key VARCHAR(64) UNIQUE,
  create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted    TINYINT      DEFAULT 0
);

CREATE TABLE IF NOT EXISTS approval_record (
  id             BIGINT      PRIMARY KEY AUTO_INCREMENT,
  application_id BIGINT      NOT NULL,
  operator_id    BIGINT      NOT NULL,
  action         VARCHAR(20) COMMENT 'APPROVE/REJECT/URGE',
  comment        VARCHAR(500),
  before_status  VARCHAR(30),
  after_status   VARCHAR(30),
  create_time    DATETIME    DEFAULT CURRENT_TIMESTAMP
);

-- ======================== 3. 任务与派单（4号） ========================

CREATE TABLE IF NOT EXISTS task (
  id                   BIGINT       PRIMARY KEY AUTO_INCREMENT,
  task_no              VARCHAR(30)  NOT NULL UNIQUE,
  application_id       BIGINT,
  type                 VARCHAR(30),
  title                VARCHAR(200),
  assignee_id          BIGINT,
  dept_id              BIGINT,
  status               VARCHAR(30)  DEFAULT 'UNASSIGNED' COMMENT 'UNASSIGNED/PENDING_ACCEPTANCE/ACCEPTED/IN_PROGRESS/COMPLETED/CANCELLED',
  expected_finish_time DATETIME,
  actual_finish_time   DATETIME,
  ai_score             DECIMAL(5,2),
  ai_reason            TEXT         COMMENT 'AI②派单推理理由',
  version              INT          DEFAULT 0,
  create_time          DATETIME     DEFAULT CURRENT_TIMESTAMP,
  update_time          DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted           TINYINT      DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dispatch_record (
  id               BIGINT      PRIMARY KEY AUTO_INCREMENT,
  task_id          BIGINT      NOT NULL,
  assignee_id      BIGINT,
  prev_assignee_id BIGINT,
  dispatch_type    VARCHAR(20) COMMENT 'AUTO/MANUAL',
  ai_score         DECIMAL(5,2),
  ai_reason        TEXT,
  operator_id      BIGINT,
  remark           VARCHAR(500),
  create_time      DATETIME    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_feedback (
  id               BIGINT  PRIMARY KEY AUTO_INCREMENT,
  task_id          BIGINT  NOT NULL,
  operator_id      BIGINT,
  actual_materials TEXT    COMMENT '实际用料JSON数组',
  result_desc      TEXT,
  signature_url    VARCHAR(500),
  create_time      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ======================== 4. 文件附件（4号） ========================

CREATE TABLE IF NOT EXISTS file_attachment (
  id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
  file_no       VARCHAR(50)  NOT NULL UNIQUE,
  original_name VARCHAR(200),
  file_url      VARCHAR(500),
  file_size     BIGINT,
  uploader_id   BIGINT,
  biz_type      VARCHAR(50),
  biz_id        BIGINT,
  create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ======================== 5. 拜访与商机（3号 / 5号） ========================

CREATE TABLE IF NOT EXISTS customer (
  id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(200) NOT NULL,
  industry      VARCHAR(50),
  contact_name  VARCHAR(50),
  contact_phone VARCHAR(20),
  manager_id    BIGINT,
  create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted    TINYINT      DEFAULT 0
);

CREATE TABLE IF NOT EXISTS visit_record (
  id             BIGINT       PRIMARY KEY AUTO_INCREMENT,
  application_id BIGINT,
  visitor_id     BIGINT       NOT NULL,
  customer_id    BIGINT,
  visit_time     DATETIME,
  location       VARCHAR(200),
  summary        TEXT,
  checkin_time   DATETIME,
  create_time    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  update_time    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunity (
  id                  BIGINT      PRIMARY KEY AUTO_INCREMENT,
  customer_id         BIGINT      NOT NULL,
  manager_id          BIGINT      NOT NULL,
  title               VARCHAR(200),
  status              VARCHAR(30) DEFAULT 'NEW' COMMENT 'NEW/FOLLOWING/HIGH_INTENT/SIGNED/CLOSED',
  intent_level        VARCHAR(20) COMMENT 'LOW/MEDIUM/HIGH',
  estimated_amount    BIGINT      COMMENT '预计金额，单位分',
  expected_close_date DATE,
  last_follow_time    DATETIME,
  create_time         DATETIME    DEFAULT CURRENT_TIMESTAMP,
  update_time         DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted          TINYINT     DEFAULT 0
);

-- ======================== 6. 系统与AI（6号） ========================

CREATE TABLE IF NOT EXISTS skill (
  id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
  is_deleted  TINYINT      DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_skill (
  id          BIGINT      PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT      NOT NULL,
  skill_code  VARCHAR(50) NOT NULL,
  level       VARCHAR(20) DEFAULT 'NORMAL' COMMENT 'NORMAL/SENIOR/EXPERT',
  create_time DATETIME    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_skill (user_id, skill_code)
);

CREATE TABLE IF NOT EXISTS sys_dict (
  id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
  dict_code   VARCHAR(50)  NOT NULL UNIQUE,
  dict_name   VARCHAR(100),
  remark      VARCHAR(200),
  create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_dict_item (
  id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
  dict_code   VARCHAR(50)  NOT NULL,
  item_value  VARCHAR(100) NOT NULL,
  item_label  VARCHAR(100) NOT NULL,
  sort        INT          DEFAULT 0,
  create_time DATETIME     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operation_log (
  id            BIGINT      PRIMARY KEY AUTO_INCREMENT,
  operator_id   BIGINT,
  operator_name VARCHAR(50),
  module        VARCHAR(50),
  action        VARCHAR(50),
  target_id     VARCHAR(50),
  before_value  TEXT,
  after_value   TEXT,
  ip            VARCHAR(50),
  create_time   DATETIME    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_query_log (
  id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT,
  question    VARCHAR(500),
  intent_id   VARCHAR(50),
  params_json TEXT,
  result_rows INT,
  elapsed_ms  INT,
  success     TINYINT,
  create_time DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ======================== 演示数据 ========================

-- 部门
INSERT INTO sys_dept (id, name, parent_id) VALUES
(1, '江苏电信', 0),
(2, '江宁装维班组', 1),
(3, '客户经理部', 1);

-- 演示账号（密码统一：demo123，BCrypt加密）
-- $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi = demo123
INSERT INTO sys_user (id, username, password, real_name, phone, role_code, dept_id, employee_no, status) VALUES
(1, 'admin',    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '超级管理员', '13800000001', 'SUPER_ADMIN',      1, 'A001', 1),
(2, 'zhangsan', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '张师傅',   '13800000002', 'MAINTAINER',       2, 'M001', 1),
(3, 'lisi',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '李工',     '13800000003', 'MAINTAINER',       2, 'M002', 1),
(4, 'wangwu',   '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '王经理',   '13800000004', 'ACCOUNT_MANAGER',  3, 'C001', 1),
(5, 'dispatcher','$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi','调度员',   '13800000005', 'DISPATCHER',       1, 'D001', 1),
(6, 'observer', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '观察员',   '13800000006', 'OBSERVER',         1, 'O001', 1);

-- 技能标签
INSERT INTO skill (code, name) VALUES
('CABLE_FUSION', '光缆熔接'),
('CABLE_INSTALL', '光缆安装'),
('DEVICE_DEBUG', '设备调试'),
('NETWORK_CONFIG', '网络配置'),
('FAULT_REPAIR', '故障抢修');

-- 人员技能
INSERT INTO user_skill (user_id, skill_code, level) VALUES
(2, 'CABLE_FUSION', 'EXPERT'),
(2, 'FAULT_REPAIR', 'SENIOR'),
(3, 'CABLE_INSTALL', 'SENIOR'),
(3, 'DEVICE_DEBUG', 'NORMAL');

-- 字典
INSERT INTO sys_dict (dict_code, dict_name) VALUES
('TASK_TYPE', '任务类型'),
('APPLY_TYPE', '申请类型'),
('INDUSTRY', '客户行业');

INSERT INTO sys_dict_item (dict_code, item_value, item_label, sort) VALUES
('TASK_TYPE', 'INSTALL',  '装机', 1),
('TASK_TYPE', 'REPAIR',   '维修', 2),
('TASK_TYPE', 'PATROL',   '巡检', 3),
('TASK_TYPE', 'SUPPORT',  '支撑', 4),
('APPLY_TYPE','MATERIAL', '领料申请', 1),
('APPLY_TYPE','VISIT',    '外出拜访', 2),
('APPLY_TYPE','SUPPORT',  '技术支撑', 3),
('INDUSTRY',  'TELECOM',  '通信', 1),
('INDUSTRY',  'FINANCE',  '金融', 2),
('INDUSTRY',  'GOVT',     '政府', 3);

-- 演示申请单
INSERT INTO application (id, app_no, type, title, content, applicant_id, dept_id, status, create_time) VALUES
(1, 'APP202606110001', 'MATERIAL', '领料申请-光缆熔接', '需要50米光缆和熔接机一台', 2, 2, 'PENDING',  NOW() - INTERVAL 5 HOUR),
(2, 'APP202606110002', 'VISIT',    '外出拜访-中电科技', '拜访中电科技集团，推进宽带升级方案', 4, 3, 'PENDING',  NOW() - INTERVAL 2 HOUR),
(3, 'APP202606110003', 'SUPPORT',  '技术支撑-设备调试', '江宁区新装OLT设备需要现场调试', 2, 2, 'APPROVED', NOW() - INTERVAL 1 DAY),
(4, 'APP202606110004', 'MATERIAL', '领料申请-网线', '需要100米超六类网线', 3, 2, 'REJECTED', NOW() - INTERVAL 2 DAY);

-- 审批记录
INSERT INTO approval_record (application_id, operator_id, action, comment, before_status, after_status) VALUES
(3, 1, 'APPROVE', '同意', 'PENDING', 'APPROVED'),
(4, 1, 'REJECT',  '数量超出本月限额，请拆分申请', 'PENDING', 'REJECTED');

-- 演示任务（含红黄绿三色）
INSERT INTO task (id, task_no, application_id, type, title, assignee_id, dept_id, status, expected_finish_time, ai_reason, create_time) VALUES
-- 红色：已超期2小时
(1, 'TSK202606110001', 3, 'REPAIR', '江宁区光缆抢修', 2, 2, 'IN_PROGRESS',
 NOW() - INTERVAL 2 HOUR,
 '推荐张师傅：具备光缆熔接技能（专家级），当前仅此1单，近30天完成率98%。',
 NOW() - INTERVAL 5 HOUR),
-- 红色：已超期4小时
(2, 'TSK202606110002', NULL, 'INSTALL', '城东小区宽带装机', 3, 2, 'ACCEPTED',
 NOW() - INTERVAL 4 HOUR,
 '推荐李工：具备光缆安装技能，当前负载较低。',
 NOW() - INTERVAL 8 HOUR),
-- 黄色：40分钟后到期
(3, 'TSK202606110003', NULL, 'PATROL', '江宁机房例行巡检', 2, 2, 'IN_PROGRESS',
 NOW() + INTERVAL 40 MINUTE,
 '推荐张师傅：熟悉该区域设备，历史巡检记录良好。',
 NOW() - INTERVAL 3 HOUR),
-- 黄色：50分钟后到期
(4, 'TSK202606110004', NULL, 'SUPPORT', '企业客户设备调试', 3, 2, 'PENDING_ACCEPTANCE',
 NOW() + INTERVAL 50 MINUTE,
 '推荐李工：具备设备调试技能，当前无冲突任务。',
 NOW() - INTERVAL 2 HOUR),
-- 绿色：正常
(5, 'TSK202606110005', NULL, 'REPAIR', '河西路光纤维修', 2, 2, 'IN_PROGRESS',
 NOW() + INTERVAL 4 HOUR, NULL, NOW() - INTERVAL 1 HOUR),
(6, 'TSK202606110006', NULL, 'INSTALL', '新街口写字楼装机', 3, 2, 'ACCEPTED',
 NOW() + INTERVAL 6 HOUR, NULL, NOW() - INTERVAL 2 HOUR);

-- 客户演示数据
INSERT INTO customer (id, name, industry, contact_name, contact_phone, manager_id) VALUES
(1, '中电科技集团', 'TELECOM', '赵总', '13900000001', 4),
(2, '南京金融控股', 'FINANCE', '钱主任', '13900000002', 4),
(3, '江宁区政务中心', 'GOVT',  '孙处长', '13900000003', 4);

-- 商机演示数据
INSERT INTO opportunity (customer_id, manager_id, title, status, intent_level, estimated_amount, last_follow_time) VALUES
(1, 4, '中电科技千兆专线升级', 'HIGH_INTENT', 'HIGH', 12000000, NOW() - INTERVAL 1 DAY),
(2, 4, '金融控股数据中心组网', 'FOLLOWING',  'MEDIUM', 5000000, NOW() - INTERVAL 3 DAY),
(3, 4, '政务中心视频会议系统', 'NEW',         'LOW',   2000000, NOW() - INTERVAL 5 DAY);

-- ======================== 补充表（从 APP zip 迁移） ========================

CREATE TABLE IF NOT EXISTS opportunity_follow_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  opportunity_id BIGINT NOT NULL,
  operator_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  next_contact_time DATETIME,
  create_time DATETIME,
  INDEX idx_follow_opportunity (opportunity_id, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS idempotency_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,
  user_id BIGINT,
  module VARCHAR(50),
  response_json LONGTEXT,
  expire_time DATETIME,
  create_time DATETIME,
  INDEX idx_idempotency_expire (expire_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='生产环境替换内存幂等实现时使用';
