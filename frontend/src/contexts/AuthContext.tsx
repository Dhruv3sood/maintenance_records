import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

interface User {
  role: 'maintenance' | 'sales'
  token: string
}

interface AuthContextType {
  user: User | null
  login: (passcode: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedToken = localStorage.getItem('token')
    const storedRole = localStorage.getItem('role') as 'maintenance' | 'sales' | null

    if (storedToken && storedRole) {
      setUser({ token: storedToken, role: storedRole })
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setIsLoading(false)
  }, [])

  const login = async (passcode: string) => {
    try {
      const response = await api.post('/auth/login', { passcode })
      const { access_token, role } = response.data

      const userData: User = {
        token: access_token,
        role,
      }

      setUser(userData)
      localStorage.setItem('token', access_token)
      localStorage.setItem('role', role)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Request timed out. The backend may be waking up (this can take 30-60 seconds on the free tier). Please try again.')
      }
      if (error.message?.includes('Network Error') || !error.response) {
        throw new Error('Cannot reach the backend server. Please check if the backend is running and VITE_API_URL is set correctly.')
      }
      throw new Error(error.response?.data?.detail || 'Invalid passcode')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
