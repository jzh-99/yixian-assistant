package com.zhiwei.visit;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("opportunity_follow_record")
public class OpportunityFollowRecord {
    @TableId
    private Long id;
    private Long opportunityId;
    private Long operatorId;
    private String content;
    private LocalDateTime nextContactTime;
    private LocalDateTime createTime;
}
