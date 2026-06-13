package com.yixian.task;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("task_feedback")
public class TaskFeedback {
    @TableId
    private Long id;
    private Long taskId;
    private Long operatorId;
    private String actualMaterials;
    private String resultDesc;
    private String imageUrlsJson;
    private String signatureUrl;
    private LocalDateTime createTime;
}
