package com.yixian.visit;

import com.yixian.common.Result;
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
    public Result<List<VisitRecord>> visits() {
        return Result.ok(visitService.list());
    }

    @PostMapping("/visits/{id}/checkin")
    public Result<VisitRecord> checkin(
            @PathVariable Long id,
            @RequestBody VisitService.WriteRequest request
    ) {
        return Result.ok(visitService.checkin(id, request));
    }

    @GetMapping("/opportunities")
    public Result<List<Opportunity>> opportunities(
            @RequestParam(required = false) String status
    ) {
        return Result.ok(opportunityService.list(status));
    }

    @PostMapping("/opportunities")
    public Result<Opportunity> createOpportunity(
            @RequestBody OpportunityService.WriteRequest request
    ) {
        return Result.ok(opportunityService.create(request));
    }

    @PutMapping("/opportunities/{id}")
    public Result<Opportunity> updateOpportunity(
            @PathVariable Long id,
            @RequestBody OpportunityService.WriteRequest request
    ) {
        return Result.ok(opportunityService.update(id, request));
    }
}
