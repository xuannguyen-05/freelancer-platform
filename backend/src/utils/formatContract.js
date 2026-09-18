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

  return {
    id: String(contract._id),
    projectId: String(contract.projectId),
    freelancerId: String(contract.freelancerId),
    memberIds: (contract.memberIds || []).map(String),

    type: contract.type,
    price: contract.price,
    hours: contract.hours,
    budget: calculateBudget(contract),

    remaining: calculateRemaining(contract),

    status: contract.status,
    statusText: CONTRACT_STATUS_LABEL[contract.status],

    createdAt: contract.createdAt
  }
}

const formatContractDetail = (contract) => {
  if (!contract) return null

  return {
    id: String(contract._id),
    projectId: String(contract.projectId),
    buyerId: String(contract.buyerId),
    freelancerId: String(contract.freelancerId),
    memberIds: (contract.memberIds || []).map(String),

    type: contract.type,
    price: contract.price,
    hours: contract.hours,
    budget: calculateBudget(contract),
    paidAmount: contract.paidAmount,

    remaining: calculateRemaining(contract),

    status: contract.status,
    statusText: CONTRACT_STATUS_LABEL[contract.status],

    startDate: contract.startDate,
    endDate: contract.endDate,

    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt
  }
}

module.exports = {
  formatContractSummary,
  formatContractDetail
}