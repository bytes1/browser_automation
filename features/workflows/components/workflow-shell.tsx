import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import type { WorkflowGraph } from "@/lib/db/schema"

import { Canvas } from "./canvas"
import { RightSidebar } from "./right-sidebar"
import { WorkflowConsole } from "./workflow-console"

interface WorkflowShellProps {
  workflowId: string
  initialGraph?: WorkflowGraph | null
}

export function WorkflowShell({
  workflowId,
  initialGraph,
}: WorkflowShellProps) {
  return (
    <ResizablePanelGroup orientation="horizontal" className="size-full">
      <ResizablePanel minSize="30rem">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel minSize="18rem">
            <Canvas initialGraph={initialGraph} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="16rem" minSize="3.5rem">
            <WorkflowConsole workflowId={workflowId} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="18rem" minSize="15rem" maxSize="36rem">
        <RightSidebar workflowId={workflowId} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
