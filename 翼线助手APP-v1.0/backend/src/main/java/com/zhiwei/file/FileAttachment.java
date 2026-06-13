package com.zhiwei.file;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("file_attachment")
public class FileAttachment {
    @TableId
    private Long id;
    private String fileNo;
    private String originalName;
    private String fileUrl;
    private Long fileSize;
    private Long uploaderId;
    private String bizType;
    private Long bizId;
    private LocalDateTime createTime;
}
