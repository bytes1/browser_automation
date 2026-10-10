import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex h-full min-h-[400px] flex-1 items-center justify-center p-6">
      <Spinner className="size-8 text-muted-foreground" />
    </div>
  )
}
