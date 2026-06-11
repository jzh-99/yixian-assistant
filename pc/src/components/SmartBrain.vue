<template>
  <button class="brain-fab" title="打开管理智脑" @click="visible = true">
    <MagicStick />
    <span>智脑</span>
  </button>

  <el-drawer v-model="visible" size="470px" class="brain-drawer" :with-header="false">
    <div class="brain-header">
      <div class="brain-logo"><MagicStick /></div>
      <div>
        <h3>AI④ 管理智脑</h3>
        <p>受控指标查询 · 当前范围：{{ session.user?.dataScope }}</p>
      </div>
      <el-button circle text @click="visible = false"><Close /></el-button>
    </div>

    <div class="brain-scope">
      <Lock /> 仅查询已授权数据，模型不会直接访问数据库或执行写操作
    </div>

    <div ref="messagesEl" class="brain-messages">
      <div class="brain-message assistant">
        <div class="message-avatar"><MagicStick /></div>
        <div class="message-bubble">
          你好，{{ session.user?.realName }}。我可以查询完成率、超时排行、拜访次数、商机转化和高意向客户。
        </div>
      </div>
      <div v-for="item in messages" :key="item.id" class="brain-message" :class="item.role">
        <div v-if="item.role === 'assistant'" class="message-avatar"><MagicStick /></div>
        <div class="message-bubble">
          <div v-if="item.loading" class="typing"><i /><i /><i /></div>
          <template v-else>
            <div>{{ item.text }}</div>
            <div v-if="item.metric" class="brain-metric">{{ item.metric }}</div>
            <el-table v-if="item.rows" :data="item.rows" size="small" class="brain-table">
              <el-table-column v-for="column in item.columns" :key="column.key" :prop="column.key" :label="column.label" />
            </el-table>
            <div v-if="item.source" class="answer-source">
              口径：{{ item.source }}<br />
              更新时间：2026-06-11 10:35 · 数据范围：{{ session.user?.dataScope }}
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="brain-suggestions">
      <button v-for="suggestion in suggestions" :key="suggestion" @click="ask(suggestion)">{{ suggestion }}</button>
    </div>
    <div class="brain-input">
      <el-input v-model="question" type="textarea" :rows="2" resize="none" placeholder="例如：本周装维工单完成率是多少？" @keydown.ctrl.enter="ask()" />
      <el-button type="primary" :icon="Promotion" :disabled="!question.trim()" @click="ask()">发送</el-button>
    </div>
  </el-drawer>
</template>

<script setup>
import { Close, Lock, MagicStick, Promotion } from '@element-plus/icons-vue'
import { nextTick, ref } from 'vue'
import { metricSnapshot, state } from '../services/mockStore'
import { session } from '../services/session'

const visible = ref(false)
const question = ref('')
const messages = ref([])
const messagesEl = ref()
const suggestions = ['本周工单完成率', '超时工单最多的人员', '本周拜访次数', '高意向未签约客户']

function buildAnswer(text) {
  if (text.includes('完成率')) {
    return { text: '本周装维工单完成率如下：', metric: `${metricSnapshot.weeklyCompletionRate}%`, source: `已完成 ${metricSnapshot.weeklyCompleted} 单 ÷ 应完成 ${metricSnapshot.weeklyExpected} 单，排除已取消任务` }
  }
  if (text.includes('超时')) {
    return {
      text: '按当前未完成任务统计，超时较多的人员如下：',
      columns: [{ key: 'name', label: '人员' }, { key: 'count', label: '超时数' }],
      rows: [{ name: '李明', count: 1 }, { name: '孙强', count: 1 }],
      source: '期望完成时间早于当前时间且任务未完成',
    }
  }
  if (text.includes('拜访')) {
    return { text: '本周共记录有效拜访 5 次，其中今日 2 次。', metric: '5 次', source: '计划时间在本周且申请已通过的有效拜访' }
  }
  if (text.includes('高意向') || text.includes('客户')) {
    return {
      text: '当前高意向且未签约客户如下：',
      columns: [{ key: 'customer', label: '客户' }, { key: 'amount', label: '预计金额' }],
      rows: state.opportunities.filter((item) => item.level === '高' && item.status !== 'SIGNED').map((item) => ({ customer: item.customer, amount: `¥${(item.amount / 10000).toFixed(0)}万` })),
      source: '意向等级=高，商机状态不等于已签约',
    }
  }
  if (text.includes('转化')) {
    const signed = state.opportunities.filter((item) => item.status === 'SIGNED').length
    return { text: '本周商机转化率如下：', metric: `${Math.round((signed / state.opportunities.length) * 100)}%`, source: '已签约商机数 ÷ 有效商机总数' }
  }
  return { text: '这个问题暂未命中受控查询模板。你可以询问完成率、超时排行、拜访次数、商机转化或高意向客户。', source: '未执行数据查询' }
}

async function ask(preset) {
  const text = (preset || question.value).trim()
  if (!text) return
  messages.value.push({ id: Date.now(), role: 'user', text })
  question.value = ''
  const loadingIndex = messages.value.length
  messages.value.push({ id: Date.now() + 1, role: 'assistant', loading: true })
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  messages.value[loadingIndex] = {
    ...messages.value[loadingIndex],
    ...buildAnswer(text),
    loading: false,
  }
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}
</script>
