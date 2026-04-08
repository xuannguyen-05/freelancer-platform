const formatFreelancer = (freelancer) => {
  if (!freelancer) return null

  const id = freelancer._id ? String(freelancer._id) : undefined
  const profile = freelancer.freelancerProfile || {}
  const normalizedSkills = Array.isArray(freelancer.skills)
    ? freelancer.skills.map((skill) => {
        if (!skill) return null

        if (typeof skill === "string") {
          return { skillID: skill, id: skill, name: "" }
        }

        if (skill._id) {
          return {
            skillID: String(skill._id),
            id: String(skill._id),
            name: skill.name || "",
            categoryId: skill.categoryId?._id ? String(skill.categoryId._id) : undefined,
            categoryName: skill.categoryId?.name || ""
          }
        }

        return { skillID: String(skill), id: String(skill), name: "" }
      }).filter(Boolean)
    : []

  return {
    id,
    name: freelancer.name,
    avatar: freelancer.avatar || "",
    slogan: profile.slogan || "",
    description: profile.description || "",
    level: profile.level ?? 1,
    rating: Number(profile.rating ?? 0),
    reviewCount: profile.reviewCount ?? 0,
    skills: normalizedSkills
  }
}

module.exports = formatFreelancer