/**
 * 商机管理列表页（底部 Tab）
 */
import { useState } from 'react'
import { ChevronRight, Plus, Sparkles, Target, TrendingUp } from 'lucide-react'
import { OPPORTUNITY_STATUS } from '../domain/contracts'
import { EmptyState, SectionTitle, StatusBadge } from '../components/ui'

const levelBadge = { A: 'danger', B: 'warning', C: 'muted' }
const levelLabel = { A: 'A类 · 高意向', B: 'B类 · 中等', C: 'C类 · 低意向' }
const statusLabel = {
  NEW: '新商机',
  FOLLOWING: '跟进中',
  HIGH_INTENT: '高意向',
  SIGNED: '已签约',
  CLOSED: '已关闭',
}

// 演示用商机数据
const demoOpportunities = [
  {
    id: 'OPP-001',
    code: 'SJ20260610001',
    customer: '南京远景科技有限公司',
    name: '园区网络升级项目',
    level: 'A',
    amount: 12,
    status: 'NEW',
    nextContact: '2026-06-18',
    createdAt: '2026-06-10',
  },
  {
    id: 'OPP-002',
    code: 'SJ20260609003',
    customer: '金陵智造产业园',
    name: '5G专网部署',
    level: 'A',
    amount: 35,
    status: 'FOLLOWING',
    nextContact: '2026-06-16',
    createdAt: '2026-06-09',
  },
  {
    id: 'OPP-003',
    code: 'SJ20260608007',
    customer: '张先生',
    name: '家庭全屋WiFi升级',
    level: 'B',
    amount: 0.3,
    status: 'HIGH_INTENT',
    nextContact: '2026-06-15',
    createdAt: '2026-06-08',
  },
]

export function OpportunityListScreen({ navigate, notify }) {
  const [opportunities] = useState(demoOpportunities)

  return (
    <div className="page">
      <section className="home-hero home-hero--compact">
        <div className="home-hero__top">
          <div>
            <h1>商机管理</h1>
            <p>{opportunities.length} 个商机 · 预计 {opportunities.reduce((sum, o) => sum + o.amount, 0)} 万元</p>
          </div>
        </div>
        <div className="stats-grid stats-grid--3">
          <div>
            <strong>{opportunities.filter((o) => o.level === 'A').length}</strong>
            <span>A类商机</span>
          </div>
          <div>
            <strong>{opportunities.filter((o) => o.status === 'NEW' || o.status === 'FOLLOWING').length}</strong>
            <span>进行中</span>
          </div>
          <div>
            <strong>{opportunities.reduce((sum, o) => sum + o.amount, 0)}万</strong>
            <span>预计金额</span>
          </div>
        </div>
      </section>

      <section className="page-body page-body--raised">
        <button className="quick-action-card" onClick={() => navigate('opportunity-smart')}>
          <span className="quick-action-card__icon"><Sparkles size={23} /></span>
          <span className="quick-action-card__text">
            <strong>智能创建商机</strong>
            <small>描述客户意向，AI自动生成商机</small>
          </span>
          <span className="quick-action-card__badge">AI</span>
          <ChevronRight size={19} />
        </button>

        <SectionTitle title="商机列表" action={`共 ${opportunities.length} 条`} />
        <div className="card-list">
          {opportunities.length ? opportunities.map((opp) => (
            <article
              key={opp.id}
              className="business-card opportunity-card"
              onClick={() => navigate('opportunity-detail', { opportunityId: opp.id, opportunity: opp })}
            >
              <div className="business-card__top">
                <div>
                  <span className="card-kicker">{opp.code}</span>
                  <h3>{opp.name}</h3>
                </div>
                <StatusBadge status={opp.status} label={statusLabel[opp.status] || opp.status} />
              </div>
              <div className="detail-line"><Target size={15} /><span>{opp.customer}</span></div>
              <div className="detail-line"><TrendingUp size={15} /><span>{levelLabel[opp.level]} · 预计 {opp.amount} 万元</span></div>
              <div className="business-card__footer">
                <span>下次联系：{opp.nextContact}</span>
                <span className={`level-tag level-tag--${levelBadge[opp.level]}`}>{levelLabel[opp.level]}</span>
              </div>
            </article>
          )) : (
            <EmptyState
              icon={Target}
              title="暂无商机"
              description="点击上方按钮创建第一个商机"
              action="智能创建商机"
              onAction={() => navigate('opportunity-smart')}
            />
          )}
        </div>
      </section>

      {/* 浮动创建按钮 */}
      <button
        className="fab-button"
        onClick={() => navigate('opportunity-smart')}
        aria-label="创建商机"
        style={{ position: 'fixed', bottom: 80, right: 20, width: 52, height: 52, borderRadius: '50%', background: 'var(--primary, #2563eb)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(37,99,235,0.4)', cursor: 'pointer', zIndex: 50 }}
      >
        <Plus size={26} />
      </button>
    </div>
  )
}
