package com.yixian.common;

public class BizException extends RuntimeException {
    private final int code;

    public BizException(String message) {
        super(message);
        this.code = 1002;
    }

    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
