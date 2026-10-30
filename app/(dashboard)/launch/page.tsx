"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  BookOpenIcon,
  CompassIcon,
  GlobeIcon,
  Loader2Icon,
  MapPinIcon,
  PlusIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { createWorkflowAction } from "@/features/workflows/actions"
import type { TemplateId } from "@/features/workflows/lib/templates"

const STARTER_TEMPLATES: {
  id: TemplateId
  title: string
  description: string
  icon: typeof SparklesIcon
}[] = [
    {
      id: "web-to-taste",
      title: "Web-to-Taste Auto-Discovery",
      description:
        "Scrape a live website, auto-resolve cultural seeds via Qloo, and generate a cross-domain taste brief.",
      icon: GlobeIcon,
    },
    {
      id: "concierge",
      title: "Cultural Concierge",
      description:
        "Taste seeds → Tokyo venues from Qloo → live web check → VIP itinerary email.",
      icon: SparklesIcon,
    },
    {
      id: "cross-domain",
      title: "Brand Affinity Scout",
      description:
        "Map film aesthetics like Wes Anderson to aligned lifestyle brands and email the report.",
      icon: CompassIcon,
    },
    {
      id: "local",
      title: "Local Hotspots",
      description:
        "Turn a favorite artist into explainable New York dining & nightlife picks.",
      icon: MapPinIcon,
    },
    {
      id: "cultural-positioning",
      title: "Startup Subculture & Competitor Positioning",
      description:
        "Drop your live startup URL to see how 3 cultural subcultures perceive your product via Qloo, and automatically scrape competitor positioning for each persona.",
      icon: SparklesIcon,
    },
  ]

export default function Page() {
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleCreate(templateId?: TemplateId) {
    const key = templateId ?? "blank"
    setActiveAction(key)
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await createWorkflowAction(undefined, templateId)
      } catch (err) {
        const digest = (err as { digest?: unknown } | null)?.digest
        if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
          throw err
        }
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Could not create workflow. Please try again."
        )
        setActiveAction(null)
      }
    })
  }

  return (
    <Empty className="min-h-svh border-none">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WorkflowIcon />
        </EmptyMedia>
        <EmptyTitle>No workflow selected</EmptyTitle>
        <EmptyDescription>
          Select a workflow from the sidebar, create a blank workflow, or start
          from a Qloo Cultural AI template.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="max-w-2xl">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Button
            onClick={() => handleCreate()}
            disabled={isPending}
            className="cursor-pointer"
          >
            {isPending && activeAction === "blank" ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <PlusIcon />
            )}
            {isPending && activeAction === "blank"
              ? "Creating workflow..."
              : "New workflow"}
          </Button>

          <Button variant="outline" asChild>
            <Link href="/docs">
              <BookOpenIcon className="size-4 text-violet-500" />
              Documentation &amp; Guide
            </Link>
          </Button>
        </div>

        {errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}

        <div className="mt-6 w-full text-left">
          <p className="mb-2.5 text-center text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            Or launch a starter template
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {STARTER_TEMPLATES.map((tpl) => {
              const Icon = tpl.icon
              const isCreatingThis = isPending && activeAction === tpl.id
              return (
                <button
                  key={tpl.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleCreate(tpl.id)}
                  className="group flex flex-col items-start gap-1 rounded-lg border bg-card p-3 text-left transition-colors hover:border-foreground/25 hover:bg-accent/50 disabled:pointer-events-none disabled:opacity-60"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <Icon className="size-3.5 text-violet-500" />
                      {tpl.title}
                    </span>
                    {isCreatingThis && (
                      <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-[11px] leading-relaxed text-muted-foreground">
                    {tpl.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </EmptyContent>
    </Empty>
  )
}
