import { seedTestUser } from '../helpers/seedUser'

export default async function globalSetup() {
  await seedTestUser()
}
