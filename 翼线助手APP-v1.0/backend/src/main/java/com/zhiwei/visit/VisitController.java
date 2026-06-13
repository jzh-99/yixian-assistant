package com.zhiwei.visit;

import com.zhiwei.common.api.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class VisitController {
    private final VisitService visitService;
    private final OpportunityService opportunityService;

    @GetMapping("/visits")
    public ApiResponse<List<VisitRecord>> visits() {
        return ApiResponse.success(visitService.list());
    }

    @PostMapping("/visits/{id}/checkin")
    public ApiResponse<VisitRecord> checkin(
            @PathVariable Long id,
            @RequestBody VisitService.WriteRequest request
    ) {
        return ApiResponse.success(visitService.checkin(id, request));
    }

    @GetMapping("/opportunities")
    public ApiResponse<List<Opportunity>> opportunities(
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.success(opportunityService.list(status));
    }

    @PostMapping("/opportunities")
    public ApiResponse<Opportunity> createOpportunity(
            @RequestBody OpportunityService.WriteRequest request
    ) {
        return ApiResponse.success(opportunityService.create(request));
    }

    @PutMapping("/opportunities/{id}")
    public ApiResponse<Opportunity> updateOpportunity(
            @PathVariable Long id,
            @RequestBody OpportunityService.WriteRequest request
    ) {
        return ApiResponse.success(opportunityService.update(id, request));
    }
}
