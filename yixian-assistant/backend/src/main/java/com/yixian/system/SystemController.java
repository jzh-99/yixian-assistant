package com.yixian.system;

import com.yixian.common.PageResult;
import com.yixian.common.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SystemController {

    private final SystemService service;

    // ── 字典类型 ──

    @GetMapping("/dicts")
    public Result<List<SysDict>> listDicts() {
        return Result.ok(service.listDicts());
    }

    @PostMapping("/dicts")
    public Result<Void> addDict(@RequestBody SysDict dict) {
        service.addDict(dict);
        return Result.ok();
    }

    @DeleteMapping("/dicts/{dictCode}")
    public Result<Void> deleteDict(@PathVariable String dictCode) {
        service.deleteDict(dictCode);
        return Result.ok();
    }

    // ── 字典条目 ──

    @GetMapping("/dicts/{dictCode}/items")
    public Result<List<SysDictItem>> listItems(@PathVariable String dictCode) {
        return Result.ok(service.listDictItems(dictCode));
    }

    @PostMapping("/dicts/{dictCode}/items")
    public Result<Void> addItem(@PathVariable String dictCode, @RequestBody SysDictItem item) {
        service.addDictItem(dictCode, item);
        return Result.ok();
    }

    @DeleteMapping("/dicts/{dictCode}/items/{id}")
    public Result<Void> deleteItem(@PathVariable String dictCode, @PathVariable Long id) {
        service.deleteDictItem(dictCode, id);
        return Result.ok();
    }

    // ── 技能标签 ──

    @GetMapping("/skills")
    public Result<List<Skill>> listSkills() {
        return Result.ok(service.listSkills());
    }

    @PostMapping("/skills")
    public Result<Void> addSkill(@RequestBody Skill skill) {
        service.addSkill(skill);
        return Result.ok();
    }

    @DeleteMapping("/skills/{id}")
    public Result<Void> deleteSkill(@PathVariable Long id) {
        service.deleteSkill(id);
        return Result.ok();
    }

    // ── 操作日志 ──

    @GetMapping("/logs")
    public Result<PageResult<OperationLog>> listLogs(
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String operatorName,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action) {
        return Result.ok(service.listLogs(pageNo, pageSize, operatorName, module, action));
    }
}
