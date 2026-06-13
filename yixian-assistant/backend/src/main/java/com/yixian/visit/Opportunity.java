package com.yixian.visit;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("opportunity")
public class Opportunity {
    @TableId
    private Long id;
    private String opportunityNo;
    private Long customerId;
    private Long managerId;
    private String title;
    private String status;
    private String intentLevel;
    private Long estimatedAmount;
    private LocalDate expectedCloseDate;
    private LocalDateTime nextContactTime;
    private LocalDateTime lastFollowTime;
    private String description;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
