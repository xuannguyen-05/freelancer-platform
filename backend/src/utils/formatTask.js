const { TASK_STATUS_LABEL } = require("../constants/taskStatus")

const normalizeTaskBase = (task) => {
  return {
    id: String(task._id),
    projectId: task.projectId ? String(task.projectId) : null,
    parentTaskId: task.parentTaskId ? String(task.parentTaskId) : null,
    assigneeId: task.assigneeId ? String(task.assigneeId) : null
  }
}

const formatTaskSummary = (task) => {
  if (!task) return null

  const base = normalizeTaskBase(task)

  return {
    ...base,
    title: task.title,
    status: task.status,
    statusText: TASK_STATUS_LABEL[task.status],
    createdAt: task.createdAt
  }
}

const formatTaskDetail = (task) => {
  if (!task) return null

  const base = normalizeTaskBase(task)

  return {
    ...base,
    title: task.title,
    description: task.description,
    status: task.status,
    statusText: TASK_STATUS_LABEL[task.status],
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  }
}

module.exports = {
  formatTaskSummary,
  formatTaskDetail
}