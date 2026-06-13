package com.zhiwei.auth;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("sys_user")
public class SysUser {
    @TableId
    private Long id;
    private String username;
    private String password;
    private String realName;
    private String phone;
    private String roleCode;
    private Long deptId;
    private String employeeNo;
    private Integer status;
    private Integer maxConcurrent;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
