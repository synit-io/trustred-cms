import type { Payload } from 'payload'

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

export async function countUsers(payload: Payload) {
  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
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
  const existingUsers = await countUsers(payload)
  if (existingUsers > 0) {
    throw new Error('Initial admin can only be created while no users exist.')
  }

  const email = String(formData.get('admin.email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('admin.password') ?? '')
  const displayName = String(formData.get('admin.displayName') ?? '').trim()

  if (!email || !password || !displayName) {
    throw new Error('Name, E-Mail und Passwort sind Pflichtfelder.')
  }

  return payload.create({
    collection: 'users',
    data: {
      displayName,
      email,
      password,
      roles: ['super-admin'],
    },
    overrideAccess: true,
  }) as Promise<User>
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
