<template>
  <div class="login-page">
    <div class="login-visual">
      <div class="login-brand"><span>翼</span><strong>翼线助手</strong></div>
      <div class="login-message">
        <p class="eyebrow">运营管理与决策智脑</p>
        <h1>让每一次申请<br />都有清晰的去向</h1>
        <p>统一审批、智能派单、过程预警与经营分析，让一线 APP 数据真正成为管理决策的依据。</p>
      </div>
      <div class="flow-preview">
        <div><span>01</span><strong>APP 申请汇聚</strong><small>领料 · 拜访 · 支撑</small></div>
        <i />
        <div><span>02</span><strong>智能审批派单</strong><small>规则匹配 · 人工确认</small></div>
        <i />
        <div><span>03</span><strong>执行反馈分析</strong><small>三色预警 · 指标复盘</small></div>
      </div>
      <div class="visual-orb orb-one" />
      <div class="visual-orb orb-two" />
    </div>

    <div class="login-panel">
      <div class="login-form-wrap">
        <div class="mobile-brand"><span>翼</span><strong>翼线助手</strong></div>
        <p class="eyebrow">欢迎回来</p>
        <h2>登录管理后台</h2>
        <p class="login-subtitle">请输入账号密码进入您的运营工作台</p>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
          <el-form-item label="账号" prop="username">
            <el-input v-model="form.username" size="large" placeholder="请输入账号" :prefix-icon="User" @keyup.enter="submit" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" size="large" type="password" show-password placeholder="请输入密码" :prefix-icon="Lock" @keyup.enter="submit" />
          </el-form-item>
          <div class="login-options"><el-checkbox v-model="remember">记住账号</el-checkbox><span>演示密码：123456</span></div>
          <el-button type="primary" size="large" native-type="submit" :loading="loading" class="login-submit" @click="submit">登录</el-button>
        </el-form>

        <div class="demo-accounts">
          <div class="demo-title"><span />快速体验不同角色<span /></div>
          <button v-for="account in accounts" :key="account.username" @click="selectAccount(account.username)">
            <span class="demo-avatar" :class="account.theme">{{ account.name.slice(0, 1) }}</span>
            <span><strong>{{ account.name }}</strong><small>{{ account.role }}</small></span>
          </button>
        </div>
        <div class="login-footnote"><CircleCheck /> 当前为本地演示环境，业务操作会保存在本机浏览器</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CircleCheck, Lock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../services/session'

const router = useRouter()
const route = useRoute()
const formRef = ref()
const loading = ref(false)
const remember = ref(true)
const form = reactive({ username: localStorage.getItem('yixian-admin-account') || 'admin', password: '123456' })
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}
const accounts = [
  { username: 'admin', name: '林总监', role: '超级管理员 · 全局数据', theme: 'blue' },
  { username: 'dept', name: '赵主任', role: '部门管理员 · 本部门', theme: 'violet' },
  { username: 'observer', name: '周分析师', role: '只读观察员', theme: 'green' },
]

function selectAccount(username) {
  form.username = username
  form.password = '123456'
}

async function submit() {
  if (loading.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await login(form.username, form.password)
    if (remember.value) localStorage.setItem('yixian-admin-account', form.username)
    ElMessage.success('登录成功')
    router.replace(route.query.redirect || '/workbench')
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}
</script>
