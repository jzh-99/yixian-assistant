<template>
  <div class="login-wrap">
    <a-card class="login-card" title="翼线助手后台管理系统">
      <a-form :model="form" @finish="onSubmit" layout="vertical">
        <a-form-item label="账号" name="username" :rules="[{required:true,message:'请输入账号'}]">
          <a-input v-model:value="form.username" placeholder="admin" size="large" />
        </a-form-item>
        <a-form-item label="密码" name="password" :rules="[{required:true,message:'请输入密码'}]">
          <a-input-password v-model:value="form.password" placeholder="demo123" size="large" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" size="large" block :loading="loading">
            登录
          </a-button>
        </a-form-item>
        <div style="color:#999;font-size:12px;text-align:center">
          演示账号：admin / zhangsan / lisi / wangwu / dispatcher，密码均为 demo123
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'

const form    = reactive({ username: '', password: '' })
const loading = ref(false)
const router  = useRouter()
const auth    = useAuthStore()

async function onSubmit() {
  loading.value = true
  try {
    await auth.login(form.username, form.password)
    message.success('登录成功')
    router.push('/')
  } catch {
    // http.js 已弹 message.error，此处不重复
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card { width: 400px; }
</style>
