/**
 * 任务详情（含接单 / 开始工作入口）
 * 来源：翼线助手APP-v1.0/src/App.jsx TaskDetailScreen (第 1353-1414 行)
 */
import { AlertTriangle, Check, CheckCircle2, FileCheck2, Package, Phone, Play, Wrench } from 'lucide-react'
import { statusMeta } from '../data/maintainerMockData'
import { TASK_STATUS } from '../domain/contracts'
import { TopBar } from '../components/ui'
import { taskActionMeta } from '../core/taskActions'
import { FormSection } from './FormFields'
import { NotFound } from './NotFound'

export function TaskDetailScreen({ route, tasks, navigate, goBack, performTaskAction }) {
  const task = tasks.find((item) => item.id === route.params.taskId)
  if (!task) return <NotFound onBack={goBack} />
  const steps = [
    TASK_STATUS.PENDING_ACCEPTANCE,
    TASK_STATUS.ACCEPTED,
    TASK_STATUS.IN_PROGRESS,
    TASK_STATUS.COMPLETED,
  ]
  const currentIndex = steps.indexOf(task.status)
  return (
    <div className={`page page--plain ${task.status !== TASK_STATUS.COMPLETED ? 'page--with-actions' : ''}`}>
      <TopBar title="任务详情" onBack={goBack} />
      <section className="page-body detail-page task-detail-page">
        <div className="task-stepper">
          {steps.map((step, index) => (
            <div className={`${index <= currentIndex ? 'is-done' : ''} ${index === currentIndex ? 'is-current' : ''}`} key={step}>
              <span>{index < currentIndex ? <Check size={13} /> : index + 1}</span>
              <small>{statusMeta[step].label}</small>
            </div>
          ))}
        </div>
        {task.overdue ? <div className="overdue-alert"><AlertTriangle size={18} /><span>任务{task.overdueText}，请尽快处理</span></div> : null}

        <FormSection title="任务信息">
          <dl className="readonly-list">
            <div><dt>工单编号</dt><dd>{task.code}</dd></div>
            <div><dt>任务类型</dt><dd>{task.type}</dd></div>
            <div><dt>客户名称</dt><dd>{task.customer}</dd></div>
            <div><dt>联系电话</dt><dd className="link-text"><Phone size={14} />{task.phone}</dd></div>
            <div><dt>客户地址</dt><dd>{task.address}</dd></div>
            <div><dt>期望完成</dt><dd>{task.expectedAt}</dd></div>
            <div><dt>创建时间</dt><dd>{task.createdAt}</dd></div>
          </dl>
        </FormSection>

        <FormSection title="物料需求">
          <div className="material-summary">{task.materials.map((item) => <span key={item}><Package size={16} />{item}</span>)}</div>
        </FormSection>

        {task.status === TASK_STATUS.COMPLETED && task.feedback ? (
          <FormSection title="完工反馈">
            <dl className="readonly-list">
              <div><dt>实际用料</dt><dd>{task.feedback.material}</dd></div>
              <div><dt>完工备注</dt><dd>{task.feedback.note}</dd></div>
              <div><dt>完成时间</dt><dd>{task.completedAt}</dd></div>
            </dl>
            {task.feedback.signature ? <img className="signature-preview" src={task.feedback.signature} alt="客户签名" /> : null}
          </FormSection>
        ) : null}
      </section>
      {task.status !== TASK_STATUS.COMPLETED ? (
        <div className="sticky-actions sticky-actions--single">
          <button className="button button--primary button--block" onClick={() => performTaskAction(task)}>
            {task.status === TASK_STATUS.PENDING_ACCEPTANCE ? <CheckCircle2 size={18} /> : task.status === TASK_STATUS.ACCEPTED ? <Play size={18} /> : <FileCheck2 size={18} />}
            {taskActionMeta[task.status].label}
          </button>
        </div>
      ) : null}
    </div>
  )
}
