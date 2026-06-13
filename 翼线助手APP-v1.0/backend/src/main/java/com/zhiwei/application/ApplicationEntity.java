package com.zhiwei.application;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("application")
public class ApplicationEntity {
    @TableId
    private Long id;
    private String appNo;
    private String type;
    private String title;
    private String content;
    private Long applicantId;
    private Long deptId;
    private String status;
    private String rejectReason;
    private Long approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private String extraJson;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
    @TableField(exist = false)
    private String applicantName;
}
