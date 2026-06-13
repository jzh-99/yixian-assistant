package com.yixian.system;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yixian.common.BizException;
import com.yixian.common.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SystemService {

    private final SysDictMapper dictMapper;
    private final SysDictItemMapper dictItemMapper;
    private final SkillMapper skillMapper;
    private final OperationLogMapper logMapper;

    // ── 字典 ──

    public List<SysDict> listDicts() {
        return dictMapper.selectList(new LambdaQueryWrapper<SysDict>()
                .orderByAsc(SysDict::getDictCode));
    }

    @Transactional
    public void addDict(SysDict dict) {
        if (dictMapper.selectOne(new LambdaQueryWrapper<SysDict>()
                .eq(SysDict::getDictCode, dict.getDictCode())) != null) {
            throw new BizException("字典编码已存在：" + dict.getDictCode());
        }
        dictMapper.insert(dict);
    }

    @Transactional
    public void deleteDict(String dictCode) {
        dictMapper.delete(new LambdaQueryWrapper<SysDict>()
                .eq(SysDict::getDictCode, dictCode));
        dictItemMapper.delete(new LambdaQueryWrapper<SysDictItem>()
                .eq(SysDictItem::getDictCode, dictCode));
    }

    // ── 字典条目 ──

    public List<SysDictItem> listDictItems(String dictCode) {
        return dictItemMapper.selectList(new LambdaQueryWrapper<SysDictItem>()
                .eq(SysDictItem::getDictCode, dictCode)
                .orderByAsc(SysDictItem::getSort));
    }

    public void addDictItem(String dictCode, SysDictItem item) {
        if (dictMapper.selectOne(new LambdaQueryWrapper<SysDict>()
                .eq(SysDict::getDictCode, dictCode)) == null) {
            throw new BizException("字典不存在：" + dictCode);
        }
        item.setDictCode(dictCode);
        dictItemMapper.insert(item);
    }

    public void deleteDictItem(String dictCode, Long id) {
        SysDictItem item = dictItemMapper.selectById(id);
        if (item == null || !dictCode.equals(item.getDictCode())) {
            throw new BizException("条目不存在");
        }
        dictItemMapper.deleteById(id);
    }

    // ── 技能 ──

    public List<Skill> listSkills() {
        return skillMapper.selectList(new LambdaQueryWrapper<Skill>()
                .eq(Skill::getIsDeleted, 0)
                .orderByAsc(Skill::getCode));
    }

    public void addSkill(Skill skill) {
        if (skillMapper.selectOne(new LambdaQueryWrapper<Skill>()
                .eq(Skill::getCode, skill.getCode())
                .eq(Skill::getIsDeleted, 0)) != null) {
            throw new BizException("技能编码已存在：" + skill.getCode());
        }
        skillMapper.insert(skill);
    }

    public void deleteSkill(Long id) {
        Skill skill = skillMapper.selectById(id);
        if (skill == null) throw new BizException("技能不存在");
        skill.setIsDeleted(1);
        skillMapper.updateById(skill);
    }

    // ── 操作日志 ──

    public PageResult<OperationLog> listLogs(int pageNo, int pageSize,
                                              String operatorName, String module, String action) {
        Page<OperationLog> page = new Page<>(pageNo, pageSize);
        LambdaQueryWrapper<OperationLog> q = new LambdaQueryWrapper<OperationLog>()
                .orderByDesc(OperationLog::getCreateTime);
        if (operatorName != null && !operatorName.isBlank())
            q.like(OperationLog::getOperatorName, operatorName);
        if (module != null && !module.isBlank())
            q.eq(OperationLog::getModule, module);
        if (action != null && !action.isBlank())
            q.eq(OperationLog::getAction, action);
        Page<OperationLog> result = logMapper.selectPage(page, q);
        return PageResult.of(result.getRecords(), result.getTotal(), pageNo, pageSize);
    }
}
