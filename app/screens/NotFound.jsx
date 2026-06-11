import { AlertTriangle } from 'lucide-react'
import { EmptyState, TopBar } from '../components/ui'

export function NotFound({ onBack }) {
  return (
    <div className="page page--plain">
      <TopBar title="内容不可用" onBack={onBack} />
      <section className="page-body centered-state">
        <EmptyState icon={AlertTriangle} title="内容已删除或不可用" description="请返回上一页刷新后重试" action="返回" onAction={onBack} />
      </section>
    </div>
  )
}
