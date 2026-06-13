package com.yixian.common;

import lombok.Data;

@Data
public class PageResult<T> {
    private java.util.List<T> list;
    private long total;
    private int pageNo;
    private int pageSize;

    public static <T> PageResult<T> of(java.util.List<T> list, long total, int pageNo, int pageSize) {
        PageResult<T> p = new PageResult<>();
        p.list = list;
        p.total = total;
        p.pageNo = pageNo;
        p.pageSize = pageSize;
        return p;
    }
}
