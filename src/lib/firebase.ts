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
      throw new Error('auth/user-not-found')
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

const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY

export const firebaseAuth = firebaseApiKey
  ? getAuth(
      initializeApp({
        apiKey: firebaseApiKey,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      })
    )
  : (new MockAuth() as any)
