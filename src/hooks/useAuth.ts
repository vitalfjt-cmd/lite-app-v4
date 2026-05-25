import { useState, useEffect, FormEvent } from 'react'
import { fetchStaffPrototypeSession, loginStaffPrototype, logoutStaffPrototype, staffReadApiEnabled, staffReadStoreSlugOverride } from '../lib/staffReadApi'
import { PROTOTYPE_STAFF_SESSION_STORAGE_KEY } from '../constants'
import type { StaffProfile } from '../types'

export function useAuth() {
  const [email, setEmail] = useState('owner@example.com')
  const [password, setPassword] = useState('')
  const [session, setSession] = useState<any | null>(null)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [authBusy, setAuthBusy] = useState(false)

  // Initialization
  useEffect(() => {
    if (staffReadApiEnabled) {
      const saved = window.sessionStorage.getItem(PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
      if (saved) {
        setAuthBusy(true)
        fetchStaffPrototypeSession(staffReadStoreSlugOverride || 'demo-bbq', saved)
          .then((res) => {
            setProfile(res.profile)
            setSession({ access_token: saved, user: { id: res.profile.id, email: res.profile.email } } as any)
          })
          .catch(() => {
            window.sessionStorage.removeItem(PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
          })
          .finally(() => setAuthBusy(false))
      }
    }
  }, [])

  async function handleSignIn(event?: FormEvent) {
    if (event) event.preventDefault()
    setAuthBusy(true)
    try {
      if (staffReadApiEnabled) {
        const res = await loginStaffPrototype(staffReadStoreSlugOverride || 'demo-bbq', email, password)
        window.sessionStorage.setItem(PROTOTYPE_STAFF_SESSION_STORAGE_KEY, res.access_token)
        setProfile(res.profile)
        setSession({ access_token: res.access_token, user: { id: res.profile.id, email: res.profile.email } } as any)
      }
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSignOut() {
    setAuthBusy(true)
    try {
      if (staffReadApiEnabled) {
        const token = window.sessionStorage.getItem(PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
        if (token) await logoutStaffPrototype(staffReadStoreSlugOverride || 'demo-bbq', token)
        window.sessionStorage.removeItem(PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
      }
      setProfile(null)
      setSession(null)
    } finally {
      setAuthBusy(false)
    }
  }

  return {
    email, setEmail,
    password, setPassword,
    session, setSession,
    profile, setProfile,
    authBusy,
    handleSignIn,
    handleSignOut
  }
}
