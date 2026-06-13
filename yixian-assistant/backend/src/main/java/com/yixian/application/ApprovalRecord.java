package com.yixian.application;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("approval_record")
public class ApprovalRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long applicationId;
    private Long operatorId;
    private String operatorName;
    private String action;
    private String comment;
    private String beforeStatus;
    private String afterStatus;
    private LocalDateTime createTime;
}
