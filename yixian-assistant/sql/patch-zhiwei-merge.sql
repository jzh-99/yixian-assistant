SET NAMES utf8mb4;
USE yixian;

SET @schema_name = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'task' AND COLUMN_NAME = 'customer_name') = 0,
  'ALTER TABLE task ADD COLUMN customer_name VARCHAR(200)',
  'SELECT ''task.customer_name exists'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'task' AND COLUMN_NAME = 'contact_phone') = 0,
  'ALTER TABLE task ADD COLUMN contact_phone VARCHAR(30)',
  'SELECT ''task.contact_phone exists'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'task' AND COLUMN_NAME = 'address') = 0,
  'ALTER TABLE task ADD COLUMN address VARCHAR(300)',
  'SELECT ''task.address exists'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'task' AND COLUMN_NAME = 'materials_json') = 0,
  'ALTER TABLE task ADD COLUMN materials_json TEXT',
  'SELECT ''task.materials_json exists'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'task_feedback' AND COLUMN_NAME = 'image_urls_json') = 0,
  'ALTER TABLE task_feedback ADD COLUMN image_urls_json TEXT AFTER result_desc',
  'SELECT ''task_feedback.image_urls_json exists'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'opportunity' AND COLUMN_NAME = 'opportunity_no') = 0,
  'ALTER TABLE opportunity ADD COLUMN opportunity_no VARCHAR(50) UNIQUE AFTER id',
  'SELECT ''opportunity.opportunity_no exists'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'opportunity' AND COLUMN_NAME = 'next_contact_time') = 0,
  'ALTER TABLE opportunity ADD COLUMN next_contact_time DATETIME AFTER expected_close_date',
  'SELECT ''opportunity.next_contact_time exists'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'opportunity' AND COLUMN_NAME = 'description') = 0,
  'ALTER TABLE opportunity ADD COLUMN description TEXT AFTER last_follow_time',
  'SELECT ''opportunity.description exists'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
