import escapeHtml from "./utils/escape-html";

export function loginConfirmationEmailHtml(name: string, code: string): string {
    const chars = code.slice(0, 6).padEnd(6, "\u00a0").split("");
    const loginUrl = process.env.FRONTEND_LOGIN_URL?.trim() || "#";

    const box = (ch: string, index: number) => {
        const purple =
            "border:1px solid #6C63FF;background-color:#F0EDFF;color:#6C63FF;font-size:22px;font-weight:700;width:44px;height:44px;text-align:center;vertical-align:middle;border-radius:10px;";
        const pink =
            "border:1px solid #FF6584;background-color:#FCEFF1;color:#FF6584;font-size:22px;font-weight:700;width:44px;height:44px;text-align:center;vertical-align:middle;border-radius:10px;";
        const style = index < 3 ? purple : pink;
        return `<td style="padding:5px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="${style}"><tr><td align="center" valign="middle" style="width:44px;height:44px;line-height:44px;">${escapeHtml(ch)}</td></tr></table></td>`;
    };

    const codeRow = chars.map((ch, i) => box(ch, i)).join("");

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet">
<title>Código de Login — Forbook</title>
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
<h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111111;">Código de Login</h1>
<p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#555555;max-width:400px;margin-left:auto;margin-right:auto;">
Olá, ${name}! Bem vindo ao Forbook! Para acessar sua conta, seu código de login é: <strong>${code}</strong>. Este código expira em 10 minutos. Faça o login e comece a explorar nossa plataforma.
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 28px;">
<tr>${codeRow}</tr>
</table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
<tr>
<td align="center" bgcolor="#6C63FF" style="border-radius:14px;background-color:#6C63FF;">
<a href="${escapeHtml(loginUrl)}?code=${code}" style="display:inline-block;padding:16px 40px;font-size:15px;font-weight:700;color:#F0F2F5;text-decoration:none;border-radius:14px;">Clique aqui para fazer o login</a>
</td>
</tr>
</table>
<p style="margin:32px 0 0;font-size:12px;line-height:1.5;color:#666666;">Se você não solicitou esse código, ignore esse email.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}