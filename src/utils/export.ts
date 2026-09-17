export type ExportFormat = 'csv' | 'txt'
export interface ExportOptions { delimiter: string; header: boolean; encoding: 'utf-8' | 'gbk' }

export function downloadRows(filename: string, headers: string[], rows: (string | number)[][], format: ExportFormat, options: ExportOptions = { delimiter: ',', header: true, encoding: 'utf-8' }) {
  const body = rows.map(row => row.map(cell => String(cell ?? '').replaceAll('"', '""')).join(options.delimiter)).join('\r\n')
  const content = (options.header ? headers.join(options.delimiter) + '\r\n' : '') + body
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename + (format === 'csv' ? '.csv' : '.txt')
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
