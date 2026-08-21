import { defaultHomePage, defaultManagedPages, fallbackFeedData } from '../src/lib/trustred/defaults'

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

function findPage(slug: string) {
  return defaultManagedPages.find((page) => page.slug === slug)
}

const now = Date.now()
const upcomingEvents = fallbackFeedData.events.filter((event) => new Date(event.endsAt ?? event.startsAt).getTime() >= now)
const archivedEvents = fallbackFeedData.events.filter((event) => new Date(event.endsAt ?? event.startsAt).getTime() < now)

assert(upcomingEvents.length > 0, 'Starter content must include at least one upcoming public event for /termine.')
assert(archivedEvents.length > 0, 'Starter content must include at least one archived public event for /termine/archiv.')
assert(fallbackFeedData.equipment.length > 0, 'Starter content must include at least one equipment profile for /technik.')
assert(fallbackFeedData.operations.length > 0, 'Starter content must include at least one operation for /einsaetze.')
assert(fallbackFeedData.posts.length > 0, 'Starter content must include at least one post for /aktuelles.')

const terminePage = findPage('termine')
const technikPage = findPage('technik')
const operationsPage = findPage('einsaetze')

assert(Boolean(terminePage), 'Managed starter page for /termine is missing.')
assert(Boolean(technikPage), 'Managed starter page for /technik is missing.')
assert(Boolean(operationsPage), 'Managed starter page for /einsaetze is missing.')

assert(
  Boolean(terminePage?.layout.some((block) => block.blockType === 'feed' && block.source === 'events')),
  'The /termine starter page must include an events feed block.',
)
assert(
  Boolean(technikPage?.layout.some((block) => block.blockType === 'tech-overview')),
  'The /technik starter page must include a tech-overview block.',
)
assert(
  Boolean(technikPage?.layout.some((block) => block.blockType === 'tech-details')),
  'The /technik starter page must include a tech-details block.',
)
assert(
  Boolean(operationsPage?.layout.some((block) => block.blockType === 'operations-log')),
  'The /einsaetze starter page must include an operations-log block.',
)
assert(
  Boolean(defaultHomePage.layout.some((block) => block.blockType === 'feed' && block.source === 'events')),
  'The homepage starter layout must include an events feed.',
)
assert(
  Boolean(defaultHomePage.layout.some((block) => block.blockType === 'feed' && block.source === 'equipment')),
  'The homepage starter layout must include an equipment feed.',
)

console.log('Starter content verification passed.')
