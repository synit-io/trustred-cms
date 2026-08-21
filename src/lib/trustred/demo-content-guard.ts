export function canApplyDemoContent() {
  return process.env.TRUSTRED_ALLOW_DEMO_CONTENT === 'true'
}

export function assertDemoContentAllowed(context = 'demo/default content') {
  if (!canApplyDemoContent()) {
    throw new Error(
      `Refusing to apply ${context}. Set TRUSTRED_ALLOW_DEMO_CONTENT=true for explicit demo seeding only.`,
    )
  }
}
