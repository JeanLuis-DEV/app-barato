import { describe, expect, it, vi } from 'vitest'
import { copyPixKey } from './copyPix'

describe('copyPixKey', () => {
  it('copia a chave com a API de clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    await expect(copyPixKey('chave-pix', { writeText })).resolves.toEqual({ status: 'copied' })
    expect(writeText).toHaveBeenCalledWith('chave-pix')
  })

  it('solicita fallback manual quando a cópia falha', async () => {
    const clipboardError = new Error('clipboard unavailable')

    await expect(copyPixKey('chave-pix', {
      writeText: vi.fn().mockRejectedValue(clipboardError),
    })).resolves.toEqual({ status: 'manual', error: clipboardError })
  })

  it('solicita fallback manual quando a API não existe', async () => {
    await expect(copyPixKey('chave-pix', {})).resolves.toEqual({ status: 'manual' })
  })
})
