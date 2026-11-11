import { assignedTestsApi } from '../api/assignedTests'

/**
 * Downloads a file via backend proxy with exact original filename and Content-Disposition.
 *
 * @param {string} url - The external image/CDN URL of the file.
 * @param {string} originalName - The preferred download filename.
 * @param {object} [toast] - Optional toast notifier for user error feedback.
 */
export async function downloadFileFromProxy(url, originalName, toast) {
  if (!url) {
    if (toast?.error) toast.error('No file URL available for download')
    return
  }

  try {
    const response = await assignedTestsApi.downloadProxyFile(url, originalName)
    const contentType = response.headers['content-type'] || 'application/octet-stream'
    const blob = new Blob([response.data], { type: contentType })

    // Extract filename from server Content-Disposition header if available
    const disposition = response.headers['content-disposition']
    let resolvedFilename = null
    if (disposition) {
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
      if (utf8Match) {
        resolvedFilename = decodeURIComponent(utf8Match[1])
      } else {
        const regularMatch = disposition.match(/filename="?([^";]+)"?/i)
        if (regularMatch) {
          resolvedFilename = regularMatch[1]
        }
      }
    }

    if (!resolvedFilename) {
      let ext = ''
      const cleanUrl = url.split('?')[0]
      const dotIdx = cleanUrl.lastIndexOf('.')
      if (dotIdx !== -1 && dotIdx > cleanUrl.lastIndexOf('/')) {
        ext = cleanUrl.substring(dotIdx)
      } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        ext = '.jpeg'
      } else if (contentType.includes('png')) {
        ext = '.png'
      } else if (contentType.includes('pdf')) {
        ext = '.pdf'
      }

      let base = originalName || 'document'
      if (ext && !base.toLowerCase().endsWith(ext.toLowerCase())) {
        if (base.includes('.')) {
          base = base.substring(0, base.lastIndexOf('.'))
        }
        resolvedFilename = `${base}${ext}`
      } else {
        resolvedFilename = base
      }
    }

    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = resolvedFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.error('File proxy download failed:', err)
    if (toast?.error) {
      toast.error(err.response?.data?.message || err.message || 'Failed to download file')
    }
  }
}

/**
 * Opens a file in a new browser tab safely.
 *
 * @param {string} url - The URL of the file to preview.
 */
export function viewFile(url) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}
