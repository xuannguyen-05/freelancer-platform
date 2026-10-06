const normalizeGigBase = (gig) => {
  const id = gig._id ? String(gig._id) : undefined
  const categoryId = gig.category?._id ? String(gig.category._id) : undefined
  const freelancerId = gig.freelancer?._id ? String(gig.freelancer._id) : undefined

  return { id, categoryId, freelancerId }
}

const formatGigSummary = (gig) => {
  if (!gig) return null

  const { id, categoryId, freelancerId } = normalizeGigBase(gig)

  return {
    id,
    title: gig.title,
    description: gig.description || "",
    img_url: gig.img_url || gig.image || "",
    categoryID: categoryId,
    freelancerID: freelancerId,
    category: gig.category
      ? {
          categoryID: categoryId,
          name: gig.category.name
        }
      : null,
    freelancer: gig.freelancer
      ? {
          userID: freelancerId,
          name: gig.freelancer.name,
          avatar: gig.freelancer.avatar || ""
        }
      : null,
    tags: Array.isArray(gig.tags) ? gig.tags : [],
    price: typeof gig.price === 'number' ? gig.price : 0,
    rating: typeof gig.rating === 'number' ? gig.rating : 0,
    reviewCount: typeof gig.reviewCount === 'number' ? gig.reviewCount : 0,
    createdAt: gig.createdAt,
    updatedAt: gig.updatedAt
  }
}

const formatGigDetail = (gig) => {
  if (!gig) return null

  const { id, categoryId, freelancerId } = normalizeGigBase(gig)

  const packages = Array.isArray(gig.gig_packages)
    ? gig.gig_packages.map((pkg) => ({
        packageID: pkg._id ? String(pkg._id) : undefined,
        title: pkg.title,
        description: pkg.description || "",
        price: Number(pkg.price),
        deliveryDay: pkg.deliveryDay,
        revision: pkg.revision,
        gigID: pkg.gigId ? String(pkg.gigId) : id
      }))
    : undefined

  const minPackagePrice = packages && packages.length > 0
    ? Math.min(...packages.map(p => p.price))
    : (typeof gig.price === 'number' ? gig.price : 0)

  return {
    id,
    title: gig.title,
    description: gig.description,
    img_url: gig.img_url || gig.image || "",
    tags: Array.isArray(gig.tags) ? gig.tags : [],
    price: minPackagePrice,
    rating: typeof gig.rating === 'number' ? gig.rating : 0,
    reviewCount: typeof gig.reviewCount === 'number' ? gig.reviewCount : 0,
    createdAt: gig.createdAt,
    updatedAt: gig.updatedAt,
    categoryID: categoryId,
    freelancerID: freelancerId,
    freelancer: gig.freelancerDetail || (gig.freelancer
      ? {
          userID: freelancerId,
          id: freelancerId,
          name: gig.freelancer.name,
          avatar: gig.freelancer.avatar || ""
        }
      : null),
    category: gig.category
      ? {
          categoryID: categoryId,
          name: gig.category.name
        }
      : null,
    ...(packages ? { packages } : {})
  }
}

module.exports = { formatGigSummary, formatGigDetail }