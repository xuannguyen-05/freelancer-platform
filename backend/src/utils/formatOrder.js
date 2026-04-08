const { ORDER_STATUS_LABEL } = require("../constants/orderStatus")

const normalizeOrderBase = (order) => {
  const id = order._id ? String(order._id) : undefined
  const buyerID = order.buyer?._id ? String(order.buyer._id) : undefined
  const freelancerID = order.freelancer?._id ? String(order.freelancer._id) : undefined
  const gigID = order.gig?._id ? String(order.gig._id) : undefined
  const packageID = order.package?._id ? String(order.package._id) : undefined

  return { id, buyerID, freelancerID, gigID, packageID }
}

const formatOrderSummary = (order) => {
  if (!order) return null

  const { id, buyerID, freelancerID, gigID, packageID } = normalizeOrderBase(order)

  return {
    id,
    buyerID,
    freelancerID,
    gigID,
    packageID,
    price: Number(order.price),
    serviceFee: Number(order.serviceFee),
    totalAmount: Number(order.totalAmount),
    status: order.status,
    statusText: ORDER_STATUS_LABEL[order.status],
    createdAt: order.createdAt,
    deliveredAt: order.deliveredAt,
    updatedAt: order.updatedAt
  }
}

const formatOrderDetail = (order) => {
  if (!order) return null

  const { id, buyerID, freelancerID, gigID, packageID } = normalizeOrderBase(order)
  const gigData = order.gig
  const packageData = order.package

  return {
    id,
    buyerID,
    freelancerID,
    gigID,
    packageID,

    price: Number(order.price),
    serviceFee: Number(order.serviceFee),
    totalAmount: Number(order.totalAmount),

    status: order.status,
    statusText: ORDER_STATUS_LABEL[order.status],

    createdAt: order.createdAt,
    deliveredAt: order.deliveredAt,
    updatedAt: order.updatedAt,

    buyer: order.buyer,
    freelancer: order.freelancer,
    gig: gigData
      ? {
          ...gigData,
          _id: gigData._id ? String(gigData._id) : undefined
        }
      : null,
    package: packageData
      ? {
          ...packageData,
          _id: packageData._id ? String(packageData._id) : undefined,
          price: Number(packageData.price)
        }
      : null
  }
}

module.exports = { formatOrderSummary, formatOrderDetail }