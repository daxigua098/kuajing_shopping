export interface ParsedOwnerField {
  key: 'name' | 'icNumber' | 'email' | 'phone' | 'bankCardNumber' | 'bankCvv' | 'bankExpiry' | 'bankAccount' | 'bankName'
  label: string
  value: string
}

export interface ParsedOwnerIntake {
  name: string
  icNumber: string
  email: string
  phone: string
  bankCardNumber: string
  bankCvv: string
  bankExpiry: string
  bankAccount: string
  bankName: string
  matched: ParsedOwnerField[]
  unparsed: string[]
}

const knownBanks = [
  'Hong Leong Bank', 'Maybank', 'CIMB Bank', 'Public Bank', 'RHB Bank', 'Bank Islam',
  'AmBank', 'Bank Rakyat', 'Affin Bank', 'Alliance Bank', 'OCBC Bank', 'HSBC Bank',
]

const labels = /^(ic|email|e-mail|bank|kad|card|acc|account|cctv|cvv|cvc|valid|vaild|thru|expiry|phone|tel|mobile|hp|no\.?|name)/i

const clean = (value: string) => value
  .replace(/\\@/g, '@')
  .replace(/\@/g, '@')
  .replace(/[：]/g, ':')
  .trim()

const onlyDigits = (value: string) => value.replace(/\D/g, '')

const formatCard = (value: string) => onlyDigits(value).replace(/(\d{4})(?=\d)/g, '$1 ').trim()

const titleBank = (value: string) => {
  const normalized = value.replace(/[^a-z ]/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  const known = knownBanks.find(bank => normalized.includes(bank.toLowerCase()))
  if (known) return known
  return value.replace(/[^a-z ]/gi, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, char => char.toUpperCase())
}

export function parseOwnerIntake(rawText: string): ParsedOwnerIntake {
  const rawLines = clean(rawText).split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const text = rawLines.join('\n')
  const result: ParsedOwnerIntake = {
    name: '', icNumber: '', email: '', phone: '', bankCardNumber: '', bankCvv: '', bankExpiry: '', bankAccount: '', bankName: '',
    matched: [], unparsed: [],
  }

  const add = (key: ParsedOwnerField['key'], label: string, value: string) => {
    if (!value) return
    ;(result as unknown as Record<string, string>)[key] = value
    result.matched.push({ key, label, value })
  }

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.replace(/^email[.]/i, '')
  add('email', '邮箱', email || '')

  const ic = text.match(/\b(\d{6})[\s-]?(\d{2})[\s-]?(\d{4})\b/)?.[0]
    || text.match(/\b(?:ic|mykad)\s*:?\s*(\d{6}[\s-]?\d{2}[\s-]?\d{4})/i)?.[1]
  if (ic) add('icNumber', 'IC 卡号', ic.replace(/\s/g, '').replace(/^(\d{6})(\d{2})(\d{4})$/, '$1-$2-$3'))

  const bankCard = text.match(/bank\s*(?:kad|card)\s*:?\s*((?:\d[\s-]?){15,19})/i)?.[1]
    || text.match(/(?:^|\n)[^\n]*?(\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4})(?:\n|$)/)?.[1]
  if (bankCard) add('bankCardNumber', '银行卡号', formatCard(bankCard))

  const cvv = text.match(/(?:cctv|cvv|cvc)\s*:?\s*(\d{3,4})/i)?.[1]
  add('bankCvv', 'CVV', cvv || '')

  const expiry = text.match(/(?:valid|vaild|thru|expiry|exp\s*date)\s*:?\s*(\d{2})\s*[\/.]\s*(\d{2,4})/i)
  if (expiry) add('bankExpiry', '有效期', expiry[1] + '/' + expiry[2].slice(-2))

  const accountLine = rawLines.find(line => /^(acc|account|bank account)\b/i.test(line))
  const account = accountLine?.match(/(\d[\d\s-]{7,19})/)?.[1]
  if (account) add('bankAccount', '银行账号 ACC', onlyDigits(account))

  const bankFromLine = accountLine?.replace(/^(acc|account|bank account)\s*:?/i, '').replace(/\d[\d\s-]*/g, '').trim()
  const bank = knownBanks.find(item => text.toLowerCase().includes(item.toLowerCase())) || bankFromLine
  if (bank) add('bankName', '银行名称', titleBank(bank))

  const phoneLine = rawLines.find(line => /^(no\.?|phone|tel|mobile|hp|电话|手机)\s*:?/i.test(line))
  const phoneSource = phoneLine || text
  const phone = phoneSource.match(/(?:\+?60|0)1\d[\s-]?\d{7,8}/)?.[0] || phoneLine?.match(/(\d[\d\s-]{8,14})/)?.[1]
  if (phone) add('phone', '联系电话', phone.replace(/\s/g, ''))

  const usedLines = new Set<string>([email || '', accountLine || '', phoneLine || ''].filter(Boolean))
  const nameLine = rawLines.find(line => {
    if (usedLines.has(line)) return false
    if (/@|\d{6,}|bank|ic\b|email|acc\b|cvv|cctv|valid|vaild|thru|phone|tel|mobile|no\./i.test(line)) return false
    const letters = line.replace(/[^a-z]/gi, '')
    return letters.length >= 3 && line.length <= 80
  })
  add('name', '姓名', nameLine || '')

  result.unparsed = rawLines.filter(line => !result.matched.some(field => line.toLowerCase().includes(String(field.value).toLowerCase())) && !labels.test(line))
  return result
}
