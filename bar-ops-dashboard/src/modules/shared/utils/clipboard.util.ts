// Copy text to the clipboard, with a textarea fallback for browsers that block
// the async API (insecure context, older mobile Safari)
export async function copyToClipboard(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Blocked or denied — try the legacy path below
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }

  document.body.removeChild(textarea)
  return copied
}

// Absolute link to a public route, on whatever domain the dashboard runs from
export function toPublicUrl(path: string): string {
  return new URL(path, window.location.origin).href
}
