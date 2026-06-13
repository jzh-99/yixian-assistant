package com.yixian.task;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("task")
public class TaskEntity {
    @TableId
    private Long id;
    private String taskNo;
    private Long applicationId;
    private String type;
    private String title;
    private Long assigneeId;
    private Long deptId;
    private String status;
    private String customerName;
    private String contactPhone;
    private String address;
    private String materialsJson;
    private LocalDateTime expectedFinishTime;
    private LocalDateTime actualFinishTime;
    private String aiReason;
    private Integer version;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
