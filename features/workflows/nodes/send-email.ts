import { resend } from "@/lib/resend"
import nodemailer from "nodemailer"
import * as tls from "node:tls"
import { rootCertificates } from "node:tls"

// @types/node may lag behind the Node runtime used by Trigger.dev.
const tlsWithSystemCertificates = tls as typeof tls & {
    getCACertificates?: (type: "system") => string[]
}

async function sendWithGmail({
    to,
    subject,
    body,
}: {
    to: string
    subject: string
    body: string
}) {
    const user = process.env.GMAIL_USER?.trim()
    const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "")
    if (!user || !appPassword) {
        throw new Error(
            "Gmail is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to the Trigger.dev environment."
        )
    }

    const customCa = process.env.GMAIL_SMTP_CA_CERT?.replace(/\\n/g, "\n").trim()
    const systemCa = tlsWithSystemCertificates.getCACertificates?.("system") ?? []
    const trustedCa = [...new Set([
        ...rootCertificates,
        ...systemCa,
        ...(customCa ? [customCa] : []),
    ])]
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user, pass: appPassword },
        tls: {
            servername: "smtp.gmail.com",
            ca: trustedCa,
        },
    })

    try {
        const result = await transporter.sendMail({
            from: user,
            to,
            subject,
            text: body,
        })
        return { id: result.messageId }
    } catch (error) {
        throw new Error(
            `Gmail send failed: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

export async function sendEmail({
    provider,
    to,
    subject,
    body,
}: {
    provider?: string
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

    const normalizedTo = to.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedTo)) {
        throw new Error("Enter a valid recipient email address")
    }

    if (provider === "gmail") {
        return sendWithGmail({
            to: normalizedTo,
            subject: subject.trim(),
            body,
        })
    }

    const from = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev"
    const { data, error } = await resend.emails.send({
        from,
        to: [normalizedTo],
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
