"use client"

import dynamic from "next/dynamic"

const ClosingScene = dynamic(() => import("./closing-scene"), {
  ssr: false,
  loading: () => null,
})

export default function ClosingSceneLoader() {
  return <ClosingScene />
}

