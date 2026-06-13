package com.yixian.visit;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("visit_record")
public class VisitRecord {
    @TableId
    private Long id;
    private Long applicationId;
    private Long visitorId;
    private Long customerId;
    private LocalDateTime visitTime;
    private String location;
    private String summary;
    private LocalDateTime checkinTime;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
