import { Liveblocks } from "@liveblocks/node"

let client: Liveblocks | undefined

function getLiveblocks(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY?.trim()
  if (!secret || !secret.startsWith("sk_")) {
    throw new Error(
      "LIVEBLOCKS_SECRET_KEY is missing or invalid (must start with 'sk_')."
    )
  }
  client ??= new Liveblocks({ secret })
  return client
}

export const liveblocks = new Proxy({} as Liveblocks, {
  get(_target, prop, receiver) {
    const instance = getLiveblocks()
    const value = Reflect.get(instance, prop, receiver)
    return typeof value === "function" ? value.bind(instance) : value
  },
})
