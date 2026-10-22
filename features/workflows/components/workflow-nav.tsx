"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CompassIcon, PlusIcon, SparklesIcon, WorkflowIcon } from "lucide-react"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar"
import type { Workflow } from "@/lib/db/schema"
import { generateSlug } from "@/features/workflows/lib/generate-slug"
import { cn } from "@/lib/utils"

interface WorkflowNavProps {
    workflows?: Workflow[]
    onCreateWorkflow: (name: string) => Promise<void>
}

export function WorkflowNav({
    workflows = [],
    onCreateWorkflow,
}: WorkflowNavProps) {
    const { state } = useSidebar()
    const pathname = usePathname()
    const [isPending, startTransition] = React.useTransition()

    const handleCreateWorkflow = () => {
        startTransition(async () => {
            const name = generateSlug()
            await onCreateWorkflow(name)
        })
    }

    const workflowItems = workflows.map((workflow) => {
        const isActive =
            pathname === `/workflows/${workflow.id}` ||
            pathname.startsWith(`/workflows/${workflow.id}/`)

        return (
            <SidebarMenuItem key={workflow.id}>
                <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                        "group/wf relative rounded-lg transition-all",
                        isActive &&
                            "bg-violet-500/10! font-semibold text-foreground! ring-1 ring-violet-500/25"
                    )}
                >
                    <Link href={`/workflows/${workflow.id}`}>
                        <span
                            className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-md border text-[10px] transition-colors",
                                isActive
                                    ? "border-violet-500/40 bg-violet-500 text-white shadow-2xs"
                                    : "border-border/70 bg-muted/60 text-muted-foreground group-hover/wf:border-violet-500/30 group-hover/wf:text-foreground"
                            )}
                        >
                            <WorkflowIcon className="size-3" />
                        </span>
                        <span className="truncate">{workflow.name}</span>
                        {isActive && (
                            <span className="ml-auto size-1.5 shrink-0 rounded-full bg-violet-500" />
                        )}
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    })

    if (state === "collapsed") {
        return (
            <SidebarGroup>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Launchpad & Templates">
                                <Link href="/launch">
                                    <CompassIcon className="text-violet-500" />
                                    <span>Launchpad</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <SidebarMenuButton tooltip="Workflows">
                                        <WorkflowIcon />
                                        <span>Workflows</span>
                                    </SidebarMenuButton>
                                </PopoverTrigger>
                                <PopoverContent side="right" align="start" className="p-1">
                                    <SidebarMenu>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                onClick={handleCreateWorkflow}
                                                disabled={isPending}
                                            >
                                                <PlusIcon />
                                                <span>New workflow</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </SidebarMenu>
                                    <SidebarSeparator className="mx-0" />
                                    <SidebarMenu className="gap-y-0.5">
                                        {workflowItems}
                                    </SidebarMenu>
                                </PopoverContent>
                            </Popover>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        )
    }

    return (
        <SidebarGroup className="gap-2">
            <div className="px-1 pt-1">
                <button
                    type="button"
                    onClick={handleCreateWorkflow}
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-gradient-to-r from-violet-500/12 via-fuchsia-500/10 to-indigo-500/12 px-3 py-2 text-xs font-semibold text-foreground shadow-2xs transition-all hover:border-violet-500/50 hover:from-violet-500/20 hover:to-indigo-500/20 disabled:opacity-50"
                >
                    <PlusIcon className="size-3.5 text-violet-500" />
                    <span>{isPending ? "Creating..." : "New Workflow"}</span>
                </button>
            </div>

            <SidebarMenu className="px-0.5">
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === "/launch"}
                        className="rounded-lg text-xs"
                    >
                        <Link href="/launch">
                            <CompassIcon className="size-3.5 text-fuchsia-500" />
                            <span>Template Launchpad</span>
                            <SparklesIcon className="ml-auto size-3 text-muted-foreground/60" />
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>

            <SidebarSeparator className="mx-1 opacity-60" />

            <div>
                <div className="flex items-center justify-between px-2 pb-1">
                    <SidebarGroupLabel className="h-6 px-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Workflows ({workflows.length})
                    </SidebarGroupLabel>
                    <SidebarGroupAction
                        title="New workflow"
                        onClick={handleCreateWorkflow}
                        disabled={isPending}
                        className="static translate-y-0"
                    >
                        <PlusIcon className="size-3.5" />
                        <span className="sr-only">New workflow</span>
                    </SidebarGroupAction>
                </div>
                <SidebarGroupContent>
                    <SidebarMenu className="gap-y-1">
                        {workflowItems}
                    </SidebarMenu>
                </SidebarGroupContent>
            </div>
        </SidebarGroup>
    )
}
