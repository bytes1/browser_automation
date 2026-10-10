import * as React from "react"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

import { AppSidebarThemeToggle } from "@/components/app-sidebar-theme-toggle"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { createWorkflowAction } from "@/features/workflows/actions"
import { WorkflowNav } from "@/features/workflows/components/workflow-nav"
import { listWorkflows } from "@/features/workflows/data"

export async function AppSidebar({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
    const { orgId } = await auth()
    const workflows = orgId ? await listWorkflows(orgId) : []

    return (
        <Sidebar variant="inset" collapsible="icon" {...props}>
            <SidebarHeader className="flex-row items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                <OrganizationSwitcher
                    hidePersonal
                    appearance={{
                        elements: {
                            rootBox: "min-w-0 group-data-[collapsible=icon]:!hidden",
                            organizationSwitcherTrigger: "w-full justify-between",
                        },
                    }}
                />
                <SidebarTrigger />
            </SidebarHeader>
            <SidebarContent>
                <WorkflowNav
                    workflows={workflows}
                    onCreateWorkflow={createWorkflowAction}
                />
            </SidebarContent>
            <SidebarFooter className="gap-1 group-data-[collapsible=icon]:items-center">
                <AppSidebarThemeToggle />
                <UserButton
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            userButtonTrigger:
                                "w-full justify-start group-data-[collapsible=icon]:justify-center",
                            userButtonOuterIdentifier: "group-data-[collapsible=icon]:hidden",
                        },
                    }}
                />
            </SidebarFooter>
        </Sidebar>
    )
}