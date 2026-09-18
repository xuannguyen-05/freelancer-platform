const { PROJECT_STATUS_LABEL } = require("../constants/projectStatus")

const normalizeProjectBase = (project) => {
  const id = project._id ? String(project._id) : undefined
  const orderId = project.orderId ? String(project.orderId) : undefined
  const buyerId = project.buyerId ? String(project.buyerId) : undefined
  

  return { id, orderId, buyerId }
}

const formatProjectSummary = (project) => {
  if (!project) return null

  const { id, orderId, buyerId } = normalizeProjectBase(project)

  return {
    id,
    orderId,
    buyerId,
    title: project.title,
    status: project.status,
    statusText: PROJECT_STATUS_LABEL[project.status],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  }
}

const formatProjectDetail = (project) => {
  if (!project) return null

  const { id, orderId, buyerId } = normalizeProjectBase(project)

  return {
    id,
    orderId,
    buyerId,
    title: project.title,
    description: project.description,
    status: project.status,
    statusText: PROJECT_STATUS_LABEL[project.status],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  }
}

module.exports = {
  formatProjectSummary,
  formatProjectDetail
}