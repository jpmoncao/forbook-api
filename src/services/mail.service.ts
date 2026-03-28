import sgMail from "@sendgrid/mail";
import { MailtrapClient } from "mailtrap";

function parseEmailFrom(from: string): { email: string; name?: string } {
    const trimmed = from.trim();
    const bracket = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
    if (bracket) {
        const name = bracket[1].trim().replace(/^["']|["']$/g, "");
        const email = bracket[2].trim();
        return name ? { email, name } : { email };
    }
    return { email: trimmed };
}

export default class MailService {
    sendMail = async (params: {
        to: string;
        subject: string;
        text: string;
        html?: string;
    }): Promise<void> => {
        const fromRaw = process.env.EMAIL_FROM;
        if (!fromRaw) {
            throw new Error("EMAIL_FROM é obrigatório.");
        }

        const from = parseEmailFrom(fromRaw);
        const isProd = process.env.NODE_ENV === "production";

        if (isProd) {
            const apiKey = process.env.SENDGRID_API_KEY;
            if (!apiKey) {
                throw new Error("SENDGRID_API_KEY é obrigatório em produção (NODE_ENV=production).");
            }

            sgMail.setApiKey(apiKey);
            await sgMail.send({
                to: params.to,
                from,
                subject: params.subject,
                text: params.text,
                html: params.html,
            });
            return;
        }

        const token = process.env.MAILTRAP_API_KEY;
        const inboxIdRaw = process.env.MAILTRAP_INBOX_ID;
        if (!token || !inboxIdRaw) {
            throw new Error(
                "MAILTRAP_API_KEY e MAILTRAP_INBOX_ID são obrigatórios em desenvolvimento (API Sandbox do Mailtrap).",
            );
        }

        const testInboxId = Number(inboxIdRaw);
        if (!Number.isFinite(testInboxId)) {
            throw new Error("MAILTRAP_INBOX_ID deve ser um número (ID da inbox na URL do Mailtrap).");
        }

        const client = new MailtrapClient({
            token,
            sandbox: true,
            testInboxId,
        });

        await client.send({
            from: { email: from.email, ...(from.name ? { name: from.name } : {}) },
            to: [{ email: params.to }],
            subject: params.subject,
            text: params.text,
            ...(params.html ? { html: params.html } : {}),
        });
    };

    sendLoginCode = async (to: string, code: string): Promise<void> => {
        await this.sendMail({
            to,
            subject: "Código de verificação — Forbook",
            text: `Seu código é: ${code}. Ele expira em 10 minutos.`,
            html: `<p>Seu código é: <strong>${code}</strong></p><p>Ele expira em 10 minutos.</p>`,
        });
    };
}
