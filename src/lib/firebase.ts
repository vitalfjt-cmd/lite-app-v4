import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

export interface FirebaseUser {
  uid: string
  email: string
  displayName?: string
}

class MockAuth {
  private listeners: ((user: FirebaseUser | null) => void)[] = []
  private currentUser: FirebaseUser | null = null

  constructor() {
    const saved = window.sessionStorage.getItem('firebase_user')
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved)
      } catch (e) {
        this.currentUser = null
      }
    }
  }

  onAuthStateChanged(callback: (user: any | null) => void) {
    this.listeners.push(callback)
    callback(this.currentUser)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback)
    }
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<{ user: FirebaseUser }> {
    const normalizedEmail = email.trim().toLowerCase()

    let user: FirebaseUser
    if (normalizedEmail === 'vtl.ucd@aroma.ocn.ne.jp') {
      user = {
        email: 'vtl.ucd@aroma.ocn.ne.jp',
        uid: 'fyLKZypPN1fhzyLA3a3nTGW8bgf1',
        displayName: 'Aroma Owner',
      }
    } else if (normalizedEmail === 'owner@example.com') {
      user = {
        email: 'owner@example.com',
        uid: 'staff-user-demo-admin',
        displayName: 'Owner Admin',
      }
    } else if (normalizedEmail === 'staff@example.com') {
      user = {
        email: 'staff@example.com',
        uid: 'staff-user-demo-staff',
        displayName: 'Floor Staff',
      }
    } else if (normalizedEmail === 'kds@example.com') {
      user = {
        email: 'kds@example.com',
        uid: 'staff-user-demo-kds',
        displayName: 'Kitchen Display',
      }
    } else {
      // ローカル保存されているモック登録ユーザーを検索
      let registeredUser: FirebaseUser | null = null
      try {
        const saved = window.localStorage.getItem('mock_registered_users')
        if (saved) {
          const list: (FirebaseUser & { password?: string })[] = JSON.parse(saved)
          const found = list.find((u) => u.email.toLowerCase() === normalizedEmail)
          if (found) {
            registeredUser = {
              email: found.email,
              uid: found.uid,
              displayName: found.displayName || 'オーナー',
            }
          }
        }
      } catch (e) {
        // ignore
      }

      if (registeredUser) {
        user = registeredUser
      } else {
        // 未登録の場合でもモック環境では自動でUIDを安定生成してログイン可能に
        user = {
          email: normalizedEmail,
          uid: `mock-uid-${btoa(normalizedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`,
          displayName: 'オーナー',
        }
      }
    }

    this.currentUser = user
    window.sessionStorage.setItem('firebase_user', JSON.stringify(user))
    this.listeners.forEach((l) => l(user))
    return { user }
  }

  async signUpWithEmailAndPassword(email: string, password: string): Promise<{ user: FirebaseUser }> {
    const normalizedEmail = email.trim().toLowerCase()
    const user: FirebaseUser = {
      email: normalizedEmail,
      uid: `mock-uid-${btoa(normalizedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`,
      displayName: 'オーナー',
    }

    // localStorage にモックユーザーを保存
    try {
      const saved = window.localStorage.getItem('mock_registered_users')
      const list = saved ? JSON.parse(saved) : []
      list.push({ ...user, password })
      window.localStorage.setItem('mock_registered_users', JSON.stringify(list))
    } catch (e) {
      // ignore
    }

    this.currentUser = user
    window.sessionStorage.setItem('firebase_user', JSON.stringify(user))
    this.listeners.forEach((l) => l(user))
    return { user }
  }

  async signOut() {
    this.currentUser = null
    window.sessionStorage.removeItem('firebase_user')
    this.listeners.forEach((l) => l(null))
  }
}

class FirebaseAuthWrapper {
  private auth: any

  constructor(auth: any) {
    this.auth = auth
  }

  async signInWithEmailAndPassword(email: string, password: string) {
    const { signInWithEmailAndPassword: fbSignIn } = await import('firebase/auth')
    const credential = await fbSignIn(this.auth, email, password)
    return {
      user: {
        uid: credential.user.uid,
        email: credential.user.email || '',
        displayName: credential.user.displayName || undefined,
      },
    }
  }

  async signUpWithEmailAndPassword(email: string, password: string) {
    const { createUserWithEmailAndPassword: fbCreateUser } = await import('firebase/auth')
    const credential = await fbCreateUser(this.auth, email, password)
    return {
      user: {
        uid: credential.user.uid,
        email: credential.user.email || '',
        displayName: credential.user.displayName || undefined,
      },
    }
  }

  async signOut() {
    const { signOut: fbSignOut } = await import('firebase/auth')
    await fbSignOut(this.auth)
  }
}

const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY

export const firebaseAuth = firebaseApiKey
  ? new FirebaseAuthWrapper(
      getAuth(
        initializeApp({
          apiKey: firebaseApiKey,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        })
      )
    )
  : (new MockAuth() as any)

