import { seedContent } from '../../scripts/seed'
import { seedTestUser } from '../helpers/seedUser'

export default async function globalSetup() {
  await seedContent({ emptyMode: true })
  await seedTestUser()
}
