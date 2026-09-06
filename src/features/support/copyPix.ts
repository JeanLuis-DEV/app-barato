type ClipboardEnvironment = {
  writeText?: (text: string) => Promise<void>
}

export type CopyPixResult =
  | { status: 'copied' }
  | { status: 'manual'; error?: unknown }

function getBrowserEnvironment(): ClipboardEnvironment {
  if (typeof navigator === 'undefined') return {}

  return {
    writeText: typeof navigator.clipboard?.writeText === 'function'
      ? navigator.clipboard.writeText.bind(navigator.clipboard)
      : undefined,
  }
}

export async function copyPixKey(
  pixKey: string,
  environment = getBrowserEnvironment(),
): Promise<CopyPixResult> {
  if (!environment.writeText) return { status: 'manual' }

  try {
    await environment.writeText(pixKey)
    return { status: 'copied' }
  } catch (error) {
    return { status: 'manual', error }
  }
}
