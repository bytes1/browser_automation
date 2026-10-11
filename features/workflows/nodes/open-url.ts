import type { Page } from "@browserbasehq/stagehand"

export async function openUrl({
    page,
    url,
}: {
    page: Page
    url: string
}) {
    // Stagehand's custom CDP page object has the same familiar Playwright API
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 })

    return { url: await page.url(), title: await page.title() }
}