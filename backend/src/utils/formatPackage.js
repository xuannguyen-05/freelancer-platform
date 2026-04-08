const formatPackage = (pkg) => {
  if (!pkg) return null

  const id = pkg._id ? String(pkg._id) : undefined
  const gigId = pkg.gigId ? String(pkg.gigId) : (pkg.gig?._id ? String(pkg.gig._id) : undefined)

  return {
    id,
    title: pkg.title,
    description: pkg.description || "",
    price: Number(pkg.price),
    deliveryDay: pkg.deliveryDay,
    revision: pkg.revision,
    gigID: gigId
  }
}

module.exports = formatPackage