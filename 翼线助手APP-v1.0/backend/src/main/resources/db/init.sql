SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS sys_dept (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  parent_id BIGINT DEFAULT 0,
  sort INT DEFAULT 0,
  create_time DATETIME,
  update_time DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sys_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL COMMENT 'BCrypt加密',
  real_name VARCHAR(50),
  phone VARCHAR(20),
  role_code VARCHAR(30) NOT NULL,
  dept_id BIGINT,
  employee_no VARCHAR(30) UNIQUE,
  status TINYINT DEFAULT 1 COMMENT '1启用 0停用',
  max_concurrent INT DEFAULT 3,
  create_time DATETIME,
  update_time DATETIME,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_user_dept (dept_id),
  INDEX idx_user_role (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS application (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  app_no VARCHAR(30) NOT NULL UNIQUE,
  type VARCHAR(30) NOT NULL,
  title VARCHAR(200),
  content TEXT,
  applicant_id BIGINT NOT NULL,
  dept_id BIGINT,
  status VARCHAR(30) DEFAULT 'PENDING',
  reject_reason VARCHAR(500),
  approver_id BIGINT,
  approver_name VARCHAR(50),
  approved_at DATETIME,
  extra_json TEXT,
  create_time DATETIME,
  update_time DATETIME,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_application_applicant (applicant_id, create_time),
  INDEX idx_application_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS approval_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  application_id BIGINT NOT NULL,
  operator_id BIGINT NOT NULL,
  action VARCHAR(20),
  comment VARCHAR(500),
  before_status VARCHAR(30),
  after_status VARCHAR(30),
  create_time DATETIME,
  INDEX idx_approval_application (application_id, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_no VARCHAR(30) NOT NULL UNIQUE,
  application_id BIGINT,
  type VARCHAR(30),
  title VARCHAR(200),
  assignee_id BIGINT,
  dept_id BIGINT,
  status VARCHAR(30) DEFAULT 'UNASSIGNED',
  customer_name VARCHAR(200),
  contact_phone VARCHAR(30),
  address VARCHAR(500),
  materials_json TEXT,
  expected_finish_time DATETIME,
  actual_finish_time DATETIME,
  ai_reason TEXT,
  version INT DEFAULT 0,
  create_time DATETIME,
  update_time DATETIME,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_task_assignee (assignee_id, status),
  INDEX idx_task_dept (dept_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dispatch_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT NOT NULL,
  assignee_id BIGINT,
  prev_assignee_id BIGINT,
  dispatch_type VARCHAR(20),
  ai_score DECIMAL(5,2),
  ai_reason TEXT,
  operator_id BIGINT,
  remark VARCHAR(500),
  create_time DATETIME,
  INDEX idx_dispatch_task (task_id, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task_feedback (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT NOT NULL,
  operator_id BIGINT,
  actual_materials TEXT,
  result_desc TEXT,
  image_urls_json TEXT,
  signature_url VARCHAR(500),
  create_time DATETIME,
  INDEX idx_feedback_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS file_attachment (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  file_no VARCHAR(50) NOT NULL UNIQUE,
  original_name VARCHAR(200),
  file_url VARCHAR(500),
  file_size BIGINT,
  uploader_id BIGINT,
  biz_type VARCHAR(50),
  biz_id BIGINT,
  create_time DATETIME,
  INDEX idx_file_business (biz_type, biz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customer (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  industry VARCHAR(50),
  contact_name VARCHAR(50),
  contact_phone VARCHAR(20),
  manager_id BIGINT,
  create_time DATETIME,
  update_time DATETIME,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_customer_manager (manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS visit_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  application_id BIGINT,
  visitor_id BIGINT NOT NULL,
  customer_id BIGINT,
  visit_time DATETIME,
  location VARCHAR(200),
  summary TEXT,
  checkin_time DATETIME,
  create_time DATETIME,
  update_time DATETIME,
  INDEX idx_visit_visitor (visitor_id, visit_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS opportunity (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  opportunity_no VARCHAR(30) NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL,
  manager_id BIGINT NOT NULL,
  title VARCHAR(200),
  status VARCHAR(30) DEFAULT 'NEW',
  intent_level VARCHAR(20),
  estimated_amount BIGINT,
  expected_close_date DATE,
  next_contact_time DATETIME,
  last_follow_time DATETIME,
  description TEXT,
  create_time DATETIME,
  update_time DATETIME,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_opportunity_manager (manager_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS opportunity_follow_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  opportunity_id BIGINT NOT NULL,
  operator_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  next_contact_time DATETIME,
  create_time DATETIME,
  INDEX idx_follow_opportunity (opportunity_id, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sys_dict (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dict_code VARCHAR(50) NOT NULL UNIQUE,
  dict_name VARCHAR(100),
  remark VARCHAR(200),
  create_time DATETIME,
  update_time DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sys_dict_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dict_code VARCHAR(50) NOT NULL,
  item_value VARCHAR(100) NOT NULL,
  item_label VARCHAR(100) NOT NULL,
  sort INT DEFAULT 0,
  create_time DATETIME,
  INDEX idx_dict_item_code (dict_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS skill (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  create_time DATETIME,
  is_deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_skill (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  skill_code VARCHAR(50) NOT NULL,
  level VARCHAR(20) DEFAULT 'NORMAL',
  create_time DATETIME,
  UNIQUE KEY uk_user_skill (user_id, skill_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS operation_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  operator_id BIGINT,
  operator_name VARCHAR(50),
  module VARCHAR(50),
  action VARCHAR(50),
  target_id VARCHAR(50),
  before_value TEXT,
  after_value TEXT,
  ip VARCHAR(50),
  create_time DATETIME,
  INDEX idx_operation_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_query_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  question VARCHAR(500),
  intent_id VARCHAR(50),
  params_json TEXT,
  result_rows INT,
  elapsed_ms INT,
  success TINYINT,
  create_time DATETIME,
  INDEX idx_ai_query_user (user_id, create_time)
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

INSERT IGNORE INTO sys_dept (id, name, parent_id, sort, create_time, update_time) VALUES
  (10, '南京鼓楼分局', 0, 10, NOW(), NOW()),
  (20, '政企客户部', 0, 20, NOW(), NOW());

INSERT IGNORE INTO sys_user
  (id, username, password, real_name, role_code, dept_id, employee_no, status, max_concurrent, create_time, update_time, is_deleted)
VALUES
  (101, 'ZW10086', '$2y$10$XWo5K1IBrh5xC0XokzDth.qix7cPzfAv6DbC8xqf/lvPZATxqDK..', '李明', 'MAINTAINER', 10, 'ZW10086', 1, 3, NOW(), NOW(), 0),
  (201, 'AM10028', '$2y$10$XWo5K1IBrh5xC0XokzDth.qix7cPzfAv6DbC8xqf/lvPZATxqDK..', '王敏', 'ACCOUNT_MANAGER', 20, 'AM10028', 1, 3, NOW(), NOW(), 0);

INSERT IGNORE INTO customer
  (id, name, industry, contact_name, contact_phone, manager_id, create_time, update_time, is_deleted)
VALUES
  (301, '南京远景科技有限公司', '科技', '张经理', '025-80000001', 201, NOW(), NOW(), 0),
  (302, '金陵智造产业园', '制造', '陈经理', '025-80000002', 201, NOW(), NOW(), 0);

INSERT IGNORE INTO task
  (id, task_no, type, title, assignee_id, dept_id, status, customer_name, contact_phone, address, materials_json, expected_finish_time, version, create_time, update_time, is_deleted)
VALUES
  (1001, 'GD202606110001', 'REPAIR', '宽带故障维修', 101, 10, 'PENDING_ACCEPTANCE', '张先生', '13800002038', '南京市鼓楼区中央路168号', '[{"name":"光猫","quantity":1,"unit":"台"},{"name":"光纤","quantity":2,"unit":"根"}]', '2026-06-11 14:30:00', 1, NOW(), NOW(), 0),
  (1002, 'GD202606110002', 'INSTALL', '企业专线开通', 101, 10, 'ACCEPTED', '南京远景科技有限公司', '025-80000210', '南京市雨花台区软件大道168号', '[{"name":"企业网关","quantity":1,"unit":"台"}]', '2026-06-11 16:00:00', 2, NOW(), NOW(), 0);

INSERT IGNORE INTO visit_record
  (id, visitor_id, customer_id, visit_time, location, summary, create_time, update_time)
VALUES
  (2001, 201, 301, '2026-06-11 10:30:00', '软件大道168号', '专线方案沟通', NOW(), NOW()),
  (2002, 201, 302, '2026-06-11 15:00:00', '秣周东路12号', '园区云网升级需求确认', NOW(), NOW());

INSERT IGNORE INTO opportunity
  (id, opportunity_no, customer_id, manager_id, title, status, intent_level, estimated_amount, next_contact_time, description, create_time, update_time, is_deleted)
VALUES
  (3001, 'SJ202606110001', 301, 201, '园区云网升级项目', 'FOLLOWING', 'HIGH', 12000000, '2026-06-11 16:00:00', '客户计划升级园区网络并增加双线路由能力。', NOW(), NOW(), 0),
  (3002, 'SJ202606110002', 302, 201, '5G专网扩容', 'HIGH_INTENT', 'MEDIUM', 28000000, '2026-06-12 10:00:00', '二期厂区新增5G专网覆盖。', NOW(), NOW(), 0);

SET FOREIGN_KEY_CHECKS = 1;
