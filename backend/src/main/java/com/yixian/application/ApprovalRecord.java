package com.yixian.application;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("approval_record")
public class ApprovalRecord {
    @TableId
    private Long id;
    private Long applicationId;
    private Long operatorId;
    private String action;
    private String comment;
    private LocalDateTime createTime;
}
