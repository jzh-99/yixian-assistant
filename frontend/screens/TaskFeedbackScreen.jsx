/**
 * 完工反馈
 * 来源：翼线助手APP-v1.0/src/App.jsx TaskFeedbackScreen (第 1416-1494 行)
 *
 * 功能：
 * - 填写实际用料、完工备注
 * - 上传最多 3 张现场图片
 * - 客户手写签名
 * - 提交后任务状态变为 COMPLETED
 */
import { useState } from 'react'
import { Wrench } from 'lucide-react'
import { api } from '../services/maintainerApi'
import { TASK_STATUS } from '../domain/contracts'
import { ImageUploader, LoadingButton, SignaturePad, StatusBadge, TopBar } from '../components/ui'
import { FormSection, TextAreaField } from './FormFields'
import { NotFound } from './NotFound'

export function TaskFeedbackScreen({ route, tasks, updateTask, navigate, goBack, notify }) {
  const task = tasks.find((item) => item.id === route.params.taskId)
  const [material, setMaterial] = useState('')
  const [note, setNote] = useState('')
  const [images, setImages] = useState([])
  const [signature, setSignature] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  if (!task) return <NotFound onBack={goBack} />

  const submit = async () => {
    const nextErrors = {}
    if (!material.trim()) nextErrors.material = '请填写实际用料'
    if (!note.trim()) nextErrors.note = '请填写完工备注'
    if (!signature) nextErrors.signature = '请客户完成签名'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      notify('请完善完工反馈', 'error')
      return
    }
    setLoading(true)
    try {
      const imageUrls = await Promise.all(images.map(async (image) => {
        if (!image.file) return image.url
        const uploaded = await api.files.upload(image.file, { bizType: 'TASK_FEEDBACK', bizId: task.id })
        return uploaded.fileUrl
      }))
      const signatureBlob = await fetch(signature).then((response) => response.blob())
      const signatureFile = new File([signatureBlob], `signature-${task.id}.png`, { type: 'image/png' })
      const signatureResult = await api.files.upload(signatureFile, { bizType: 'TASK_SIGNATURE', bizId: task.id })
      const result = await api.tasks.complete(task.id, {
        version: task.version,
        actualMaterials: [{ description: material }],
        resultDesc: note,
        imageUrls,
        signatureUrl: signatureResult.fileUrl,
      })
      updateTask(task.id, {
        status: result.status || TASK_STATUS.COMPLETED,
        version: result.version,
        completedAt: '刚刚',
        feedback: { material, note, images: imageUrls, signature: signatureResult.fileUrl },
      })
      notify('完工反馈提交成功')
      navigate('task-detail', { taskId: task.id }, { replace: true })
    } catch (error) {
      notify(error.message || '完工反馈提交失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page--plain page--with-actions">
      <TopBar title="反馈完工" onBack={goBack} />
      <section className="page-body form-page">
        <div className="task-mini-card">
          <span><Wrench size={19} /></span>
          <div><strong>{task.type}</strong><small>{task.code} · {task.address}</small></div>
          <StatusBadge status={TASK_STATUS.IN_PROGRESS} />
        </div>
        <FormSection title="完工信息">
          <TextAreaField label="实际用料" required value={material} onChange={setMaterial} error={errors.material} placeholder="例如：更换光纤 1 根、光猫 1 台" />
          <TextAreaField label="完工备注" required value={note} onChange={setNote} error={errors.note} placeholder="请说明处理结果和现场情况" />
        </FormSection>
        <FormSection title="现场图片">
          <ImageUploader images={images} onChange={setImages} max={3} />
        </FormSection>
        <FormSection title="客户签名">
          <SignaturePad value={signature} onChange={setSignature} />
          {errors.signature ? <span className="field-error">{errors.signature}</span> : null}
        </FormSection>
      </section>
      <div className="sticky-actions sticky-actions--single">
        <LoadingButton className="button button--primary button--block" loading={loading} loadingText="正在提交…" onClick={submit}>提交完工反馈</LoadingButton>
      </div>
    </div>
  )
}
