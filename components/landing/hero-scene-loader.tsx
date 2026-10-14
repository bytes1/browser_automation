"use client"

import dynamic from "next/dynamic"

const HeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => null,
})

export default function HeroSceneLoader() {
  return <HeroScene />
}

