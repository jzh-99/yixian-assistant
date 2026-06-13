package com.zhiwei.common.exception;

import com.zhiwei.common.api.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public ApiResponse<Object> handleBusiness(BusinessException exception) {
        return ApiResponse.error(exception.getCode(), exception.getMessage(), exception.getDetails());
    }

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            BindException.class,
            ConstraintViolationException.class
    })
    public ApiResponse<Object> handleValidation(Exception exception) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("reason", exception.getMessage());
        return ApiResponse.error(1001, "参数校验失败", details);
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleUnknown(Exception exception) {
        return ApiResponse.error(500, "服务器内部错误", null);
    }
}
