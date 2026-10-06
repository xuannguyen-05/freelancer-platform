const { CONTRACT_STATUS_LABEL } = require("../constants/contractStatus")

const calculateRemaining = (contract) => {
  if (!contract) return 0
  const budget = contract.type === "hourly"
    ? (contract.price * (contract.hours || 0))
    : contract.price

  return budget - contract.paidAmount
}

const calculateBudget = (contract) => {
  if (!contract) return 0
  return contract.type === "hourly"
    ? (contract.price * (contract.hours || 0))
    : contract.price
}

const formatContractSummary = (contract) => {
  if (!contract) return null

  const budget = calculateBudget(contract)
  const paidAmount = Number(contract.paidAmount ?? 0)
  const remaining = budget - paidAmount
  const paidPercent = budget > 0 ? Math.round((paidAmount / budget) * 100) : 0

  return {
    id: String(contract._id || contract.id),
    projectId: String(contract.projectId),
    buyerId: String(contract.buyerId),
    freelancerId: String(contract.freelancerId),
    memberIds: (contract.memberIds || []).map(String),

    type: contract.type,
    price: contract.price,
    hours: contract.hours,
    budget,
    paidAmount,
    remaining: Math.max(0, remaining),
    paidPercent,

    status: contract.status,
    statusText: CONTRACT_STATUS_LABEL[contract.status],

    startDate: contract.startDate,
    endDate: contract.endDate,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,

    buyer: contract.buyer || null,
    freelancer: contract.freelancer || null,
    members: contract.members || [],
    project: contract.project || null,
    order: contract.order || null
  }
}

const formatContractDetail = (contract) => {
  if (!contract) return null

  const budget = calculateBudget(contract)
  const paidAmount = Number(contract.paidAmount ?? 0)
  const remaining = budget - paidAmount
  const paidPercent = budget > 0 ? Math.round((paidAmount / budget) * 100) : 0

  return {
    id: String(contract._id || contract.id),
    projectId: String(contract.projectId),
    buyerId: String(contract.buyerId),
    freelancerId: String(contract.freelancerId),
    memberIds: (contract.memberIds || []).map(String),

    type: contract.type,
    price: contract.price,
    hours: contract.hours,
    budget,
    paidAmount,
    remaining: Math.max(0, remaining),
    paidPercent,

    status: contract.status,
    statusText: CONTRACT_STATUS_LABEL[contract.status],

    startDate: contract.startDate,
    endDate: contract.endDate,

    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,

    buyer: contract.buyer || null,
    freelancer: contract.freelancer || null,
    members: contract.members || [],
    project: contract.project || null,
    order: contract.order || null
  }
}

module.exports = {
  formatContractSummary,
  formatContractDetail
}