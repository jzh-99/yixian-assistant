package com.yixian.common;

import lombok.Data;

@Data
public class Result<T> {
    private int code;
    private String message;
    private T data;
    private String requestId;

    public static <T> Result<T> ok(T data) {
        Result<T> r = new Result<>();
        r.code = 0;
        r.message = "success";
        r.data = data;
        r.requestId = java.util.UUID.randomUUID().toString().replace("-", "");
        return r;
    }

    public static <T> Result<T> ok() {
        return ok(null);
    }

    public static <T> Result<T> fail(int code, String message) {
        Result<T> r = new Result<>();
        r.code = code;
        r.message = message;
        r.requestId = java.util.UUID.randomUUID().toString().replace("-", "");
        return r;
    }

    public static <T> Result<T> fail(String message) {
        return fail(500, message);
    }
}
