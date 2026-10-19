import { useState, useEffect, FormEvent } from 'react'
import { firebaseAuth } from '../lib/firebase'
import { fetchStaffPrototypeSession, getActiveStoreSlug, logoutStaffPrototype, selfSignupApi, staffReadApiEnabled } from '../lib/staffReadApi'
import { PROTOTYPE_STAFF_SESSION_STORAGE_KEY } from '../constants'
import type { StaffProfile } from '../types'

export function useAuth() {
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('last_active_login_email') || ''
    }
    return ''
  })
  const [password, setPassword] = useState('')
  const [session, setSession] = useState<any | null>(null)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authStoreSlug, setAuthStoreSlug] = useState(() => {
    if (typeof window !== 'undefined') {
      const fromUrl = new URLSearchParams(window.location.search).get('store')?.trim()
      if (fromUrl) return fromUrl
      const saved = window.localStorage.getItem('last_active_store_slug')?.trim()
      if (saved) return saved
    }
    return ''
  })

  // Initialization
  useEffect(() => {
    if (staffReadApiEnabled) {
      const saved = window.sessionStorage.getItem(PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
      if (saved) {
        setAuthBusy(true)
        const currentSlug = getActiveStoreSlug()
        fetchStaffPrototypeSession(currentSlug, saved)
          .then((res) => {
            setProfile(res.profile)
            if (res.store?.slug) {
              window.localStorage.setItem('last_active_store_slug', res.store.slug)
              const url = new URL(window.location.href)
              if (url.searchParams.get('store') !== res.store.slug) {
                url.searchParams.set('store', res.store.slug)
                window.history.replaceState({}, '', url)
              }
            }
            if (res.profile?.email) {
              window.localStorage.setItem('last_active_login_email', res.profile.email)
            }
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
    setAuthError(null)
    try {
      if (staffReadApiEnabled) {
        const res = await firebaseAuth.signInWithEmailAndPassword(email, password)
        const token = `firebase-token-${res.user.email}`
        const targetSlug = authStoreSlug?.trim() || getActiveStoreSlug()
        const sessionData = await fetchStaffPrototypeSession(targetSlug, token)
        window.sessionStorage.setItem(PROTOTYPE_STAFF_SESSION_STORAGE_KEY, token)
        window.localStorage.setItem('last_active_login_email', email.trim())
        if (sessionData.store?.slug) {
          window.localStorage.setItem('last_active_store_slug', sessionData.store.slug)
          const url = new URL(window.location.href)
          url.searchParams.set('store', sessionData.store.slug)
          window.history.replaceState({}, '', url)
        }
        setProfile(sessionData.profile)
        setSession({ access_token: token, user: { id: sessionData.profile.id, email: sessionData.profile.email } } as any)
      } else {
        throw new Error('Staff read API is not enabled.')
      }
    } catch (err) {
      window.sessionStorage.removeItem(PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
      setAuthError(err instanceof Error ? err.message : String(err))
      throw err
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSignUp(storeName: string, slug: string, signupEmail: string, signupPassword: string) {
    setAuthBusy(true)
    try {
      if (staffReadApiEnabled) {
        // 1. Firebase Authentication で新規ユーザー登録
        const res = await (firebaseAuth as any).signUpWithEmailAndPassword(signupEmail, signupPassword)
        const token = `firebase-token-${res.user.email}`

        // 2. D1 側に店舗とサンプルデータをセットアップ
        const signupResult = await selfSignupApi({
          storeSlug: slug,
          storeName,
          authUserId: res.user.uid,
          email: res.user.email,
        })

        // 3. セッショントークン保存とログイン
        window.sessionStorage.setItem(PROTOTYPE_STAFF_SESSION_STORAGE_KEY, token)
        window.localStorage.setItem('last_active_login_email', signupEmail.trim())
        window.localStorage.setItem('last_active_store_slug', signupResult.store.slug)
        setAuthStoreSlug(signupResult.store.slug)
        if (signupResult.firstTable?.qr_token) {
          window.localStorage.setItem('last_active_qr_token', signupResult.firstTable.qr_token)
        }
        const url = new URL(window.location.href)
        url.searchParams.set('store', signupResult.store.slug)
        window.history.replaceState({}, '', url)

        const sessionData = await fetchStaffPrototypeSession(signupResult.store.slug, token)
        setProfile(sessionData.profile)
        setSession({ access_token: token, user: { id: sessionData.profile.id, email: sessionData.profile.email } } as any)

        return signupResult
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
        if (token && !token.startsWith('firebase-token-')) {
          await logoutStaffPrototype(getActiveStoreSlug(), token)
        }
        await firebaseAuth.signOut()
        window.sessionStorage.removeItem(PROTOTYPE_STAFF_SESSION_STORAGE_KEY)
        window.localStorage.removeItem('last_active_store_slug')
        window.localStorage.removeItem('last_active_qr_token')
        const url = new URL(window.location.href)
        url.searchParams.delete('store')
        url.searchParams.delete('qr')
        url.searchParams.delete('ticket')
        window.history.replaceState({}, '', url)
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
    authStoreSlug, setAuthStoreSlug,
    authError, setAuthError,
    session, setSession,
    profile, setProfile,
    authBusy,
    handleSignIn,
    handleSignUp,
    handleSignOut
  }
}
