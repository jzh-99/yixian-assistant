package com.zhiwei.common.api;

public record ApiResponse<T>(int code, String message, T data, String requestId) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(0, "success", data, RequestIdHolder.get());
    }

    public static ApiResponse<Void> success() {
        return success(null);
    }

    public static <T> ApiResponse<T> error(int code, String message, T data) {
        return new ApiResponse<>(code, message, data, RequestIdHolder.get());
    }
}
