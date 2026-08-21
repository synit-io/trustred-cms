import nodemailer, { type Transporter } from 'nodemailer'
import type { EmailAdapter, Payload } from 'payload'

import type { SiteSetting } from '@/payload-types'

type RuntimeSMTPSettings = {
  fromAddress: string
  fromName: string
  host: string
  ignoreTLS: boolean
  password?: string
  port: number
  requireTLS: boolean
  secure: boolean
  skipVerify: boolean
  username?: string
}

const placeholderFromAddress = 'noreply@trustred.local'
const placeholderFromName = 'Trustred CMS'

let cachedTransport:
  | {
      key: string
      transporter: Transporter
    }
  | undefined
let lastKnownFromAddress = placeholderFromAddress
let lastKnownFromName = placeholderFromName
let warnedAboutMissingSMTP = false

function normalizeSMTPSettings(settings: SiteSetting): RuntimeSMTPSettings | null {
  const smtp = settings.smtp

  if (!smtp?.enabled) {
    return null
  }

  const host = String(smtp.host ?? '').trim()
  const fromAddress = String(smtp.fromEmail ?? '').trim() || String(settings.contact?.email ?? '').trim()
  const fromName = String(smtp.fromName ?? '').trim() || String(settings.siteName ?? '').trim() || placeholderFromName

  if (!host || !fromAddress) {
    return null
  }

  const port = typeof smtp.port === 'number' && Number.isFinite(smtp.port) ? smtp.port : 587

  return {
    fromAddress,
    fromName,
    host,
    ignoreTLS: Boolean(smtp.ignoreTLS),
    password: String(smtp.password ?? '').trim() || undefined,
    port,
    requireTLS: Boolean(smtp.requireTLS),
    secure: Boolean(smtp.secure),
    skipVerify: Boolean(smtp.skipVerify),
    username: String(smtp.username ?? '').trim() || undefined,
  }
}

async function loadSMTPSettings(payload: Payload) {
  const settings = (await payload.findGlobal({
    slug: 'site-settings',
  })) as SiteSetting

  return normalizeSMTPSettings(settings)
}

function getTransport(settings: RuntimeSMTPSettings) {
  const key = JSON.stringify(settings)

  if (cachedTransport?.key === key) {
    return cachedTransport.transporter
  }

  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    ...(settings.username || settings.password
      ? {
          auth: {
            user: settings.username,
            pass: settings.password,
          },
        }
      : {}),
    ...(settings.ignoreTLS ? { ignoreTLS: true } : {}),
    ...(settings.requireTLS ? { requireTLS: true } : {}),
    tls: {
      rejectUnauthorized: !settings.skipVerify,
    },
  })

  cachedTransport = {
    key,
    transporter,
  }

  return transporter
}

export const runtimeSMTPAdapter: EmailAdapter = ({ payload }) => ({
  get defaultFromAddress() {
    return lastKnownFromAddress
  },
  get defaultFromName() {
    return lastKnownFromName
  },
  name: 'trustred-runtime-smtp',
  async sendEmail(message) {
    const settings = await loadSMTPSettings(payload)

    if (!settings) {
      if (!warnedAboutMissingSMTP) {
        payload.logger.warn(
          'SMTP delivery is disabled or incomplete in site settings. Email sending is being skipped until SMTP is configured in /manage/settings.',
        )
        warnedAboutMissingSMTP = true
      }

      return {
        skipped: true,
      }
    }

    warnedAboutMissingSMTP = false
    lastKnownFromAddress = settings.fromAddress
    lastKnownFromName = settings.fromName

    const transporter = getTransport(settings)

    return transporter.sendMail({
      ...message,
      from: `"${settings.fromName}" <${settings.fromAddress}>`,
    })
  },
})
