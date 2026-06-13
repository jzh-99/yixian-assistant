package com.zhiwei.ai;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("ai_query_log")
public class AiQueryLog {
    @TableId
    private Long id;
    private Long userId;
    private String question;
    private String intentId;
    private String paramsJson;
    private Integer resultRows;
    private Integer elapsedMs;
    private Integer success;
    private LocalDateTime createTime;
}
