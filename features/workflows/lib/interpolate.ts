
export type NodeOutputs = Record<string, unknown>

const PLACEHOLDER = /\{\{\s*([^}]+?)\s*\}\}/g


function getByPath(root: NodeOutputs, path: string): unknown {
    const keys = path
        .replace(/\[(\w+)\]/g, ".$1") // items[0] -> items.0
        .split(".")
        .filter(Boolean)

    return keys.reduce<unknown>((acc, key) => {
        if (acc == null || typeof acc !== "object") return undefined
        return (acc as Record<string, unknown>)[key]
    }, root)
}

export function interpolate({
    text,
    outputs,
}: {
    text: string
    outputs: NodeOutputs
}): string {
    return text.replace(PLACEHOLDER, (_match, expr: string) => {
        const value = getByPath(outputs, expr.trim())
        if (value == null) return ""
        if (typeof value === "object") return JSON.stringify(value)
        return String(value)
    })
}