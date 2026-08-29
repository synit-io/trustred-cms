import { timingSafeEqual } from 'node:crypto'

import { createLocalReq, type Payload, type PayloadRequest } from 'payload'

import { trustredRoles, userHasRole } from '@/access/hasRole'
import { defaultHomePage } from '@/lib/trustred/defaults'
import type { Page, User } from '@/payload-types'

export type SetupStep = 'admin' | 'site' | 'contact' | 'appearance' | 'mail' | 'done'

export const setupSteps: SetupStep[] = ['admin', 'site', 'contact', 'appearance', 'mail', 'done']

export function normalizeSetupStep(
  value: string | string[] | undefined,
  hasUsers: boolean,
): SetupStep {
  const candidate = Array.isArray(value) ? value[0] : value
  if (candidate && setupSteps.includes(candidate as SetupStep)) {
    if (!hasUsers && candidate !== 'admin') {
      return 'admin'
    }
    return candidate as SetupStep
  }

  return hasUsers ? 'site' : 'admin'
}

export async function countUsers(payload: Payload, req?: PayloadRequest) {
  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
  })

  return result.totalDocs
}

export async function getSetupState(payload: Payload) {
  try {
    return await payload.findGlobal({
      slug: 'setup-state',
      overrideAccess: true,
    })
  } catch {
    return {
      currentStep: 'admin',
      status: 'not_started',
      version: 1,
    }
  }
}

export function canUseSetup(user: User | null | undefined, hasUsers: boolean) {
  if (!hasUsers) {
    return true
  }

  return userHasRole(user, trustredRoles.settings)
}

export async function markSetupInProgress(payload: Payload, currentStep: SetupStep) {
  await payload.updateGlobal({
    slug: 'setup-state',
    data: {
      currentStep,
      status: 'in_progress',
      version: 1,
    },
    overrideAccess: true,
  })
}

export async function markSetupSkipped(payload: Payload, user: User) {
  await payload.updateGlobal({
    slug: 'setup-state',
    data: {
      currentStep: 'done',
      skippedAt: new Date().toISOString(),
      status: 'skipped',
      version: 1,
    },
    overrideAccess: false,
    user,
  })
}

export async function markSetupCompleted(payload: Payload, user: User) {
  await payload.updateGlobal({
    slug: 'setup-state',
    data: {
      completedAt: new Date().toISOString(),
      completedBy: user.id,
      currentStep: 'done',
      status: 'completed',
      version: 1,
    },
    overrideAccess: false,
    user,
  })
}

export async function createInitialAdmin(payload: Payload, formData: FormData) {
  verifySetupToken(String(formData.get('admin.setupToken') ?? ''))

  const email = String(formData.get('admin.email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('admin.password') ?? '')
  const displayName = String(formData.get('admin.displayName') ?? '').trim()

  if (!email || !password || !displayName) {
    throw new Error('Name, E-Mail und Passwort sind Pflichtfelder.')
  }

  const transactionID = await payload.db.beginTransaction({ behavior: 'immediate' })
  if (transactionID === null) {
    throw new Error('Database transactions must be enabled for initial setup.')
  }

  const req = await createLocalReq({ context: { initialAdminBootstrap: true } }, payload)
  req.transactionID = transactionID

  try {
    const existingUsers = await countUsers(payload, req)
    if (existingUsers > 0) {
      throw new Error('Initial admin can only be created while no users exist.')
    }

    const user = (await payload.create({
      collection: 'users',
      data: {
        displayName,
        email,
        password,
        roles: ['super-admin'],
      },
      overrideAccess: true,
      req,
    })) as User

    await payload.db.commitTransaction(transactionID)
    return user
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

function verifySetupToken(providedToken: string) {
  const configuredToken = process.env.SETUP_TOKEN?.trim()
  if (!configuredToken) {
    throw new Error('SETUP_TOKEN must be configured before initial setup.')
  }

  const expected = Buffer.from(configuredToken)
  const provided = Buffer.from(providedToken.trim())
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new Error('Setup token is invalid.')
  }
}

async function createUploadedHeroImage(payload: Payload, user: User, formData: FormData) {
  const upload = formData.get('heroImageUpload')

  if (!(upload instanceof File) || upload.size === 0) {
    return undefined
  }

  const alt =
    String(formData.get('heroImageAlt') ?? '').trim() || upload.name.replace(/\.[^.]+$/, '')

  const media = await payload.create({
    collection: 'media',
    data: {
      alt,
      category: 'general',
    },
    file: {
      data: Buffer.from(await upload.arrayBuffer()),
      mimetype: upload.type,
      name: upload.name,
      size: upload.size,
    },
    overrideAccess: false,
    user,
  } as never)

  return media.id as number
}

export async function saveHomepageHero(payload: Payload, user: User, formData: FormData) {
  const heroImage = await createUploadedHeroImage(payload, user, formData)
  const headline = String(formData.get('hero.headline') ?? '').trim()
  const copy = String(formData.get('hero.copy') ?? '').trim()

  const homeResult = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    user,
    where: {
      slug: {
        equals: 'home',
      },
    },
  })
  const existingHome = homeResult.docs[0] as Page | undefined
  const currentLayout = (
    existingHome?.layout?.length ? existingHome.layout : defaultHomePage.layout
  ) as Page['layout']
  const nextLayout = currentLayout.map((block, index) => {
    if (index !== 0 || block.blockType !== 'hero') {
      return block
    }

    return {
      ...block,
      ...(copy ? { copy } : {}),
      ...(headline ? { headline } : {}),
      ...(heroImage ? { heroImage } : {}),
    }
  })

  if (existingHome) {
    return payload.update({
      collection: 'pages',
      data: {
        layout: nextLayout,
      },
      id: existingHome.id,
      overrideAccess: false,
      user,
    })
  }

  return payload.create({
    collection: 'pages',
    data: {
      _status: 'published',
      layout: nextLayout,
      navigationLabel: defaultHomePage.navigationLabel,
      navigationOrder: defaultHomePage.navigationOrder,
      showInNavigation: defaultHomePage.showInNavigation,
      slug: 'home',
      title: defaultHomePage.title,
    },
    overrideAccess: false,
    user,
  })
}
