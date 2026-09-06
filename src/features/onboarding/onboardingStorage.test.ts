import { describe, expect, it, vi } from 'vitest'
import {
  markWelcomeSeen,
  shouldShowWelcome,
  WELCOME_STORAGE_KEY,
} from './onboardingStorage'

describe('onboardingStorage', () => {
  it('exibe as boas-vindas na primeira utilização', () => {
    const storage = { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() }

    expect(shouldShowWelcome(storage)).toBe(true)
    expect(storage.getItem).toHaveBeenCalledWith(WELCOME_STORAGE_KEY)
  })

  it('não exibe as boas-vindas quando elas já foram vistas', () => {
    const storage = { getItem: vi.fn().mockReturnValue('true'), setItem: vi.fn() }

    expect(shouldShowWelcome(storage)).toBe(false)
  })

  it('grava que as boas-vindas foram vistas', () => {
    const storage = { getItem: vi.fn(), setItem: vi.fn() }

    expect(markWelcomeSeen(storage)).toBe(true)
    expect(storage.setItem).toHaveBeenCalledWith(WELCOME_STORAGE_KEY, 'true')
  })

  it('libera o app quando a leitura ou a gravação falham', () => {
    const readFailure = {
      getItem: vi.fn(() => { throw new Error('storage unavailable') }),
      setItem: vi.fn(),
    }
    const writeFailure = {
      getItem: vi.fn(),
      setItem: vi.fn(() => { throw new Error('storage unavailable') }),
    }

    expect(shouldShowWelcome(readFailure)).toBe(false)
    expect(markWelcomeSeen(writeFailure)).toBe(false)
  })
})
