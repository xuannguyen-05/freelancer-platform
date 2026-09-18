import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (data) => {
        set({
          user: data.user || data,
          accessToken: data.accessToken,
          refreshToken: data.refreshTokenJWT || data.refreshToken,
          isAuthenticated: true,
        })
      },

      setUser: (user) => {
        set({ user })
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      },

      updateAccessToken: (accessToken) => {
        set({ accessToken })
        localStorage.setItem('accessToken', accessToken)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
