const formatUser = (user) => {
  if (!user) return null

  const id = user._id ? String(user._id) : undefined

  return {
    id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || "/default-avatar.png",
    bio: user.bio || ""
  }
}

module.exports = formatUser