/**
 * 装维任务状态流转配置与操作逻辑
 * 来源：翼线助手APP-v1.0/src/App.jsx (第 98-235 行)
 */
import { TASK_STATUS } from '../domain/contracts'

export const taskActionMeta = {
  [TASK_STATUS.PENDING_ACCEPTANCE]: {
    label: '接单',
    next: TASK_STATUS.ACCEPTED,
    title: '确认接收该任务？',
    success: '接单成功',
  },
  [TASK_STATUS.ACCEPTED]: {
    label: '开始工作',
    next: TASK_STATUS.IN_PROGRESS,
    title: '确认现在开始执行该任务？',
    success: '任务已进入进行中',
  },
  [TASK_STATUS.IN_PROGRESS]: {
    label: '反馈完工',
    next: TASK_STATUS.COMPLETED,
  },
  [TASK_STATUS.COMPLETED]: {
    label: '查看详情',
    next: null,
  },
}

/**
 * 执行任务操作：接单 / 开始工作 / 跳转完工反馈 / 查看详情
 */
export function createTaskActionHandler({ api, updateTask, navigate, confirm, notify }) {
  return function performTaskAction(task) {
    if (task.status === TASK_STATUS.IN_PROGRESS) {
      navigate('task-feedback', { taskId: task.id })
      return
    }
    if (task.status === TASK_STATUS.COMPLETED) {
      navigate('task-detail', { taskId: task.id })
      return
    }
    const meta = taskActionMeta[task.status]
    confirm({
      title: meta.title,
      description: `${task.code} · ${task.type}`,
      confirmText: meta.label,
      onConfirm: async () => {
        try {
          const updated = task.status === TASK_STATUS.PENDING_ACCEPTANCE
            ? await api.tasks.accept(task.id, task.version)
            : await api.tasks.start(task.id, task.version)
          updateTask(task.id, { status: updated.status || meta.next, version: updated.version })
          notify(meta.success)
        } catch (error) {
          notify(error.message || '任务状态更新失败', 'error')
        }
      },
    })
  }
}
