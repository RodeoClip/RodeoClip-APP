'use client'

import { useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  return { user, loading, setUser, setLoading }
}
