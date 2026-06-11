package com.yixian.ai;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("ai_query_log")
public class AiQueryLog {
    @TableId
    private Long id;
    private Long userId;
    private String question;
    private Integer elapsedMs;
    private Integer resultRows;
    private Integer success;
    private LocalDateTime createTime;
}
