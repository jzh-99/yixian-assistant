package com.zhiwei.auth;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("sys_dept")
public class SysDept {
    @TableId
    private Long id;
    private String name;
    private Long parentId;
    private Integer sort;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
