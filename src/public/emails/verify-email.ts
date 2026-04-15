import escapeHtml from "./utils/escape-html";

export function verifyEmailEmailHtml(loginUrl: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet">
<title>Verifique seu e-mail — Forbook</title>
<style>
* {
font-family: 'Lexend', sans-serif;
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F0F2F5;">
<tr>
<td align="center" style="padding:28px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background-color:#EFF2F5;border-radius:20px;">
<tr>
<td style="padding:40px 32px 36px;text-align:center;">
<p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111111;letter-spacing:0.04em;text-transform:uppercase;">BEM VINDO AO</p>
<p style="margin:0 0 32px;font-size:42px;font-weight:800;color:#111111;line-height:1.05;letter-spacing:-0.02em;">FORBOOK</p>
<h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111111;">Verifique seu e-mail</h1>
<p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#555555;max-width:400px;margin-left:auto;margin-right:auto;">
Bem vindo ao Forbook! Acesse o link no corpo dessa mensagem para verificar seu e-mail
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 28px;">
</table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
<tr>
<td align="center" bgcolor="#6C63FF" style="border-radius:14px;background-color:#6C63FF;">
<a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:16px 40px;font-size:15px;font-weight:700;color:#F0F2F5;text-decoration:none;border-radius:14px;">Clique aqui para confirmar seu e-mail</a>
</td>
</tr>
</table>
<p style="margin:32px 0 0;font-size:12px;line-height:1.5;color:#666666;">Se você não solicitou essa verificação, ignore esse email.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}