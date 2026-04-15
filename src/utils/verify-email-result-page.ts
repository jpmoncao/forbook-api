function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export type VerifyEmailResultPageOptions = {
    success: boolean;
    heading: string;
    message: string;
};

export function buildVerifyEmailResultPage(options: VerifyEmailResultPageOptions): string {
    const { success, heading, message } = options;
    const title = success ? "Forbook — E-mail verificado" : "Forbook — Verificação do e-mail";
    const accent = success ? "#0d7a3f" : "#b42318";

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #f6f7f9;
            color: #333;
        }
        .card {
            max-width: 420px;
            width: 100%;
            background: #fff;
            border-radius: 12px;
            padding: 32px 28px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            text-align: center;
        }
        .icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 16px;
            border-radius: 50%;
            background: ${accent};
            color: #fff;
            font-size: 28px;
            line-height: 48px;
            font-weight: 700;
        }
        h1 {
            font-size: 1.35rem;
            margin-bottom: 12px;
            color: #1a1a1a;
        }
        p {
            font-size: 1rem;
            line-height: 1.5;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon" aria-hidden="true">${success ? "\u2713" : "!"}</div>
        <h1>${escapeHtml(heading)}</h1>
        <p>${escapeHtml(message)}</p>
    </div>
</body>
</html>`;
}
