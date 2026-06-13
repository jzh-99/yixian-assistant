package com.zhiwei.common.exception;

public class BusinessException extends RuntimeException {
    private final int code;
    private final Object details;

    public BusinessException(int code, String message) {
        this(code, message, null);
    }

    public BusinessException(int code, String message, Object details) {
        super(message);
        this.code = code;
        this.details = details;
    }

    public int getCode() {
        return code;
    }

    public Object getDetails() {
        return details;
    }
}
