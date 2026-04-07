import nodemailer from "nodemailer";

import { loginConfirmationEmailHtml } from "@/public/emails/login-confirmation";

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
    private DEV_MODE = process.env.NODE_ENV !== 'production';
    private transporter?: nodemailer.Transporter;

    constructor() {
        if (this.DEV_MODE) {
            nodemailer.createTestAccount().then(testAccount => {
                this.transporter = nodemailer.createTransport({
                    host: testAccount.smtp.host,
                    port: testAccount.smtp.port,
                    secure: testAccount.smtp.secure,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });
            });

            return;
        }

        this.transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        });
    }

    sendMail = async (params: {
        to: string;
        subject: string;
        text: string;
        html?: string;
    }): Promise<void> => {
        if (!this.transporter) {
            throw new Error("Email Transporter não configurado.");
        }

        const fromRaw = process.env.EMAIL_FROM;
        if (!fromRaw) {
            throw new Error("EMAIL_FROM é obrigatório.");
        }

        const from = parseEmailFrom(fromRaw);

        const message = await this.transporter.sendMail({
            from: `"Forbook" <${from.email}>`,
            to: params.to,
            subject: params.subject,
            html: params.html,
            text: params.text
        });

        if (this.DEV_MODE) {
            console.log(`[✓ Mailservice] URL: ${nodemailer.getTestMessageUrl(message)}`);
        }
    };

    sendLoginCode = async (to: string, name: string, code: string): Promise<void> => {
        await this.sendMail({
            to,
            subject: "Código de verificação — Forbook",
            text: `Seu código é: ${code}. Ele expira em 10 minutos.`,
            html: loginConfirmationEmailHtml(name, code),
        });
    };
}
