package com.zhiwei.file;

import com.zhiwei.auth.AuthContext;
import com.zhiwei.common.exception.BusinessException;
import com.zhiwei.common.idempotency.IdempotencyService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class FileService {
    private final FileAttachmentMapper fileMapper;
    private final IdempotencyService idempotencyService;

    @Value("${zhiwei.upload-dir}")
    private String uploadDir;

    @Value("${zhiwei.public-upload-prefix}")
    private String publicPrefix;

    public FileResult upload(
            MultipartFile file,
            String bizType,
            Long bizId,
            String idempotencyKey
    ) {
        return idempotencyService.execute(idempotencyKey, () -> {
            if (file == null || file.isEmpty()) {
                throw new BusinessException(1001, "上传文件不能为空");
            }
            String extension = extensionOf(file.getOriginalFilename());
            String fileNo = UUID.randomUUID().toString().replace("-", "");
            String month = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
            Path folder = Path.of(uploadDir, month).toAbsolutePath().normalize();
            Path target = folder.resolve(fileNo + extension).normalize();
            if (!target.startsWith(folder)) {
                throw new BusinessException(1001, "文件路径不合法");
            }
            try {
                Files.createDirectories(folder);
                file.transferTo(target);
            } catch (IOException exception) {
                throw new BusinessException(500, "文件保存失败");
            }

            String fileUrl = publicPrefix + "/" + month + "/" + target.getFileName();
            FileAttachment attachment = new FileAttachment();
            attachment.setFileNo(fileNo);
            attachment.setOriginalName(file.getOriginalFilename());
            attachment.setFileUrl(fileUrl);
            attachment.setFileSize(file.getSize());
            attachment.setUploaderId(AuthContext.required().userId());
            attachment.setBizType(bizType);
            attachment.setBizId(bizId);
            attachment.setCreateTime(LocalDateTime.now());
            fileMapper.insert(attachment);
            return new FileResult(attachment.getId(), fileNo, fileUrl, file.getOriginalFilename());
        });
    }

    private String extensionOf(String name) {
        if (name == null) return "";
        int index = name.lastIndexOf('.');
        return index < 0 ? "" : name.substring(index).replaceAll("[^a-zA-Z0-9.]", "");
    }

    public record FileResult(Long id, String fileNo, String fileUrl, String originalName) {
    }
}
