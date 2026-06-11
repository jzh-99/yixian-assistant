package com.yixian.application;

import com.baomidou.mybatisplus.annotation.TableId;
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
    private String extraJson;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
