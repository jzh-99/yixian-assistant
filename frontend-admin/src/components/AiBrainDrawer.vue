<template>
  <a-drawer
    title="AI④ 管理智脑"
    placement="right"
    :width="480"
    :open="open"
    @close="$emit('update:open', false)"
  >
    <!-- 消息列表 -->
    <div class="msg-list" ref="msgListRef">
      <div v-for="(msg, i) in messages" :key="i" :class="['msg-item', msg.role]">
        <div class="bubble">
          <!-- 用户消息 -->
          <template v-if="msg.role === 'user'">{{ msg.content }}</template>

          <!-- AI 回复 -->
          <template v-else>
            <div v-if="msg.loading" style="color:#999">思考中...</div>
            <template v-else-if="msg.result">
              <!-- 指标卡 -->
              <div v-if="msg.result.type === 'METRIC'" class="result-metric">
                <span class="metric-value">{{ msg.result.value }}</span>
                <span class="metric-label">{{ msg.result.label }}</span>
              </div>
              <!-- 表格 -->
              <template v-else-if="msg.result.type === 'TABLE'">
                <a-table
                  :columns="msg.result.columns.map(c => ({title:c, dataIndex:c, key:c}))"
                  :data-source="msg.result.rows.map((r,i) => Object.fromEntries(msg.result.columns.map((c,j)=>[c,r[j]])))"
                  :pagination="false"
                  size="small"
                />
              </template>
              <!-- 纯文本 -->
              <div v-else>{{ msg.result.text }}</div>
              <!-- 数据口径说明 -->
              <div v-if="msg.scope" class="scope-tip">
                📅 {{ msg.scope.timeRange }} · {{ msg.scope.dataScope }} · 更新于 {{ msg.scope.updatedAt }}
              </div>
            </template>
            <!-- 无法匹配 -->
            <div v-else-if="msg.suggestion" style="color:#999">
              暂不支持该查询。试试：<br/>{{ msg.suggestion }}
            </div>
            <div v-else>{{ msg.content }}</div>
          </template>
        </div>
      </div>
    </div>

    <!-- 快捷问题 -->
    <div class="quick-questions">
      <a-tag
        v-for="q in quickQuestions" :key="q"
        style="cursor:pointer; margin:4px"
        @click="sendMessage(q)"
      >{{ q }}</a-tag>
    </div>

    <!-- 输入区 -->
    <div class="input-area">
      <a-input
        v-model:value="inputText"
        placeholder="输入问题，如：本周超时任务最多的是哪个团队？"
        :disabled="loading"
        @pressEnter="sendMessage()"
      />
      <a-button type="primary" :loading="loading" @click="sendMessage()">发送</a-button>
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import http from '@/utils/http'

defineProps({ open: Boolean })
defineEmits(['update:open'])

const inputText  = ref('')
const loading    = ref(false)
const messages   = ref([
  { role: 'assistant', content: '您好！我是管理智脑，可以回答运营相关问题。', result: null }
])
const msgListRef = ref(null)

const quickQuestions = [
  '本周装维任务完成率',
  '超时任务最多的团队',
  '今日待处理任务数',
  '高意向商机列表',
]

async function sendMessage(text) {
  const q = (text || inputText.value).trim()
  if (!q) return

  messages.value.push({ role: 'user', content: q })
  inputText.value = ''
  loading.value = true

  // AI 回复占位
  const aiMsg = { role: 'assistant', loading: true, result: null, suggestion: null, scope: null }
  messages.value.push(aiMsg)
  await scrollBottom()

  try {
    const data = await http.post('/ai/query', { question: q })
    aiMsg.loading = false
    if (data.intentId) {
      aiMsg.result = data.result
      aiMsg.scope  = {
        timeRange: data.timeRange,
        dataScope: data.dataScope,
        updatedAt: data.updatedAt,
      }
    } else {
      aiMsg.suggestion = data.suggestion
    }
  } catch {
    aiMsg.loading  = false
    aiMsg.content  = '服务暂时不可用，请稍后重试'
  } finally {
    loading.value = false
    await scrollBottom()
  }
}

async function scrollBottom() {
  await nextTick()
  if (msgListRef.value) {
    msgListRef.value.scrollTop = msgListRef.value.scrollHeight
  }
}
</script>

<style scoped>
.msg-list {
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 280px);
  padding-bottom: 12px;
}
.msg-item { display: flex; margin-bottom: 12px; }
.msg-item.user  { justify-content: flex-end; }
.msg-item.assistant { justify-content: flex-start; }
.bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}
.msg-item.user .bubble      { background: #1677ff; color: #fff; }
.msg-item.assistant .bubble { background: #f5f5f5; color: #333; }
.result-metric { text-align: center; padding: 8px 0; }
.metric-value  { font-size: 32px; font-weight: 700; color: #1677ff; }
.metric-label  { font-size: 13px; color: #999; margin-left: 8px; }
.scope-tip     { font-size: 11px; color: #aaa; margin-top: 8px; }
.quick-questions { padding: 8px 0; border-top: 1px solid #f0f0f0; margin-top: 8px; }
.input-area {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.input-area .ant-input { flex: 1; }
</style>
