import nodemailer from "nodemailer";
import sgMail from '@sendgrid/mail';

import { loginConfirmationEmailHtml } from "@/public/emails/login-confirmation";
import { verifyEmailEmailHtml } from "@/public/emails/verify-email";

export default class MailService {
    private DEV_MODE = process.env.NODE_ENV !== 'production';
    private transporter: nodemailer.Transporter | null = null;
    private sendgrid: typeof sgMail | null = null;

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
        } else {
            const apiKey = process.env.SENDGRID_API_KEY;
            if (!apiKey) {
                throw new Error("SENDGRID_API_KEY não configurado.");
            }
            sgMail.setApiKey(apiKey);
            this.sendgrid = sgMail;
        }
    }

    sendMail = async (params: {
        to: string;
        subject: string;
        text: string;
        html?: string;
    }): Promise<void> => {
        console.log(`[MailService] Tentando enviar e-mail para: ${params.to} (Modo: ${this.DEV_MODE ? 'DEV' : 'PROD'})`);

        if (this.DEV_MODE) {
            if (!this.transporter) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (this.transporter) {
                const message = await this.transporter.sendMail({
                    from: '"Forbook Test" <no-reply@forbook.com>',
                    to: params.to,
                    subject: params.subject,
                    html: params.html,
                    text: params.text
                });
                console.log(`[✓ Mailservice] E-mail de teste enviado: ${nodemailer.getTestMessageUrl(message)}`);
            }
            return;
        }

        if (!this.sendgrid) throw new Error("SendGrid não configurado.");

        const response = await this.sendgrid.send({
            from: process.env.EMAIL_FROM || "ForBook <noreply@forbook.com>",
            to: params.to,
            subject: params.subject,
            html: params.html || params.text,
        });

        if (response[0].statusCode !== 202) {
            console.error("[X Mailservice] Erro no SendGrid:", response[0].body);
            throw new Error("Falha ao enviar e-mail via SendGrid.");
        }

        console.log(`[✓ Mailservice] E-mail enviado com sucesso para ${params.to}:`, response[0].body);
    };

    sendLoginCode = async (to: string, name: string, code: string): Promise<void> => {
        await this.sendMail({
            to,
            subject: "Código de verificação — Forbook",
            text: `Seu código é: ${code}. Ele expira em 10 minutos.`,
            html: loginConfirmationEmailHtml(name, code),
        });
    };



    verifyEmail = async (to: string, code: string): Promise<void> => {
        const loginUrl = `${process.env.API_URL?.trim() || "#"}/auth/verify-email?code=${code}`;
        await this.sendMail({
            to,
            subject: "Verifique seu e-mail — Forbook",
            text: `Acesse o link no corpo dessa mensagem para verificar seu e-mail`,
            html: verifyEmailEmailHtml(loginUrl),
        });
    };
}