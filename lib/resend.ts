import { Resend } from "resend"

let client: Resend | undefined

export function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is missing. Add it to your Trigger.dev environment variables to send emails with Resend."
    )
  }
  client ??= new Resend(apiKey)
  return client
}

// Keep a backwards-compatible export that does not throw at module-import time
// during Trigger.dev task indexing or Next.js build collection.
export const resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    const instance = getResend()
    const value = Reflect.get(instance, prop, receiver)
    return typeof value === "function" ? value.bind(instance) : value
  },
})
