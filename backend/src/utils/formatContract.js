const calculateRemaining = (contract) => {
  if (!contract) return 0
  return contract.price - contract.paidAmount
}

const formatContractSummary = (contract) => {
  if (!contract) return null

  return {
    id: String(contract._id),
    projectId: String(contract.projectId),
    freelancerId: String(contract.freelancerId),

    type: contract.type,
    price: contract.price,

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

    type: contract.type,
    price: contract.price,
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