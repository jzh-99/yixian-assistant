package com.zhiwei.ai;

import java.util.List;
import java.util.Map;

public interface AiGateway {
    Map<String, Object> extract(String input, String applicationType);

    Map<String, Object> chat(String message, List<Map<String, String>> history);
}
