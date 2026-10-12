import { resend } from "@/lib/resend"

export async function sendEmail({
    to,
    subject,
    body,
}: {
    to: string
    subject: string
    body: string
}) {
    if (!to.trim()) {
        throw new Error("Email recipient is required")
    }
    if (!subject.trim()) {
        throw new Error("Email subject is required")
    }
    if (!body.trim()) {
        throw new Error("Email body is required")
    }

    const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: [to.trim()],
        subject: subject.trim(),
        text: body,
    })

    if (error) {
        throw new Error(`Failed to send email: ${error.message}`)
    }
    if (!data?.id) {
        throw new Error("Resend did not return a sent email id")
    }

    return { id: data.id }
}
