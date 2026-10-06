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

  const skillNameList = freelancer.skillNames && freelancer.skillNames.length > 0
    ? freelancer.skillNames
    : normalizedSkills.map(s => s.name).filter(Boolean)

  return {
    id,
    name: freelancer.name,
    avatar: freelancer.avatar || "",
    slogan: profile.slogan || freelancer.professionalTitle || "",
    professionalTitle: freelancer.professionalTitle || profile.slogan || "",
    description: profile.description || freelancer.bio || "",
    bio: freelancer.bio || profile.description || "",
    location: freelancer.location || "",
    level: profile.level ?? 1,
    rating: typeof freelancer.rating === 'number' ? freelancer.rating : Number(profile.rating ?? 0),
    reviewCount: typeof freelancer.reviewCount === 'number' ? freelancer.reviewCount : (profile.reviewCount ?? 0),
    ordersCompleted: typeof freelancer.ordersCompleted === 'number' ? freelancer.ordersCompleted : (profile.completedProjects ?? 0),
    completionRate: freelancer.completionRate ?? null,
    skills: normalizedSkills,
    skillNames: skillNameList,
    preferences: freelancer.preferences || {},
    createdAt: freelancer.createdAt
  }
}

module.exports = formatFreelancer