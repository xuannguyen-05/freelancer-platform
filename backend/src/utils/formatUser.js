const formatUser = (user) => {
  if (!user) return null

  const id = user._id ? String(user._id) : undefined

  return {
    id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || "",
    bio: user.bio || "",
    location: user.location || "",
    professionalTitle: user.professionalTitle || user.freelancerProfile?.slogan || "",
    skills: user.skills || [],
    skillNames: user.skillNames || (Array.isArray(user.skills) ? user.skills.map(s => s.name || s).filter(Boolean) : []),
    role: user.role || "buyer",
    freelancerProfile: user.freelancerProfile || {},
    preferences: user.preferences || {
      allowDirectContact: true,
      showPublicProfile: true,
      acceptOrders: true
    },
    createdAt: user.createdAt
  }
}

module.exports = formatUser