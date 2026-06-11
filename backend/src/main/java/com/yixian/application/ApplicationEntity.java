package com.yixian.application;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName("application")
public class ApplicationEntity {
    @TableId(type = IdType.AUTO)
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
    private String idempotencyKey;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;

    @TableField(exist = false)
    private String applicantName;
    @TableField(exist = false)
    private List<ApprovalRecord> records;
}
