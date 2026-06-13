package com.yixian.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    public Result<?> handleBiz(BizException e) {
        log.warn("业务异常: {}", e.getMessage());
        return Result.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<?> handleValidation(MethodArgumentNotValidException e) {
        FieldError fe = e.getBindingResult().getFieldErrors().stream().findFirst().orElse(null);
        String msg = fe != null ? fe.getField() + ": " + fe.getDefaultMessage() : "参数校验失败";
        return Result.fail(1001, msg);
    }

    @ExceptionHandler(Exception.class)
    public Result<?> handleGeneral(Exception e) {
        log.error("系统异常", e);
        return Result.fail(500, "服务器内部错误");
    }
}
