package com.zhiwei.visit;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("customer")
public class Customer {
    @TableId
    private Long id;
    private String name;
    private String industry;
    private String contactName;
    private String contactPhone;
    private Long managerId;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
