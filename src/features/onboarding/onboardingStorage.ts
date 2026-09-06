export const WELCOME_STORAGE_KEY = 'app-barato-welcome-seen'

type WelcomeStorage = Pick<Storage, 'getItem' | 'setItem'>

function getLocalStorage(): WelcomeStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function shouldShowWelcome(storage: WelcomeStorage | null = getLocalStorage()) {
  if (storage == null) return false

  try {
    return storage.getItem(WELCOME_STORAGE_KEY) !== 'true'
  } catch {
    return false
  }
}

export function markWelcomeSeen(storage: WelcomeStorage | null = getLocalStorage()) {
  if (storage == null) return false

  try {
    storage.setItem(WELCOME_STORAGE_KEY, 'true')
    return true
  } catch {
    return false
  }
}
