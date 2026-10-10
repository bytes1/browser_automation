"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Canvas } from "@/features/workflows/components/canvas"
import { Room } from "@/features/workflows/components/room"
import { RightSidebar } from "@/features/workflows/components/right-sidebar"

interface WorkflowShellProps {
  workflowId: string
}

export function WorkflowShell({ workflowId }: WorkflowShellProps) {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="size-full"
      data-workflow-id={workflowId}
    >
      {/* Left panel: Primary column */}
      <ResizablePanel minSize="30rem">
        <ResizablePanelGroup orientation="vertical">
          {/* Top panel: Canvas */}
          <ResizablePanel minSize="18rem">
            <Room roomId={workflowId}>
              <Canvas />
            </Room>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Bottom panel: Logs */}
          <ResizablePanel defaultSize="8rem" minSize="6rem">
            <div className="flex h-full items-center justify-center p-4 text-sm font-medium text-muted-foreground">
              Logs
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right panel: Inspector */}
      <ResizablePanel defaultSize="16rem" minSize="14rem" maxSize="36rem">
        <RightSidebar />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
