// Browser page shown on the loopback redirect after `dynamoi login`.
// Self-contained (no network requests); values mirror the design foundation.

const BLOOM = `<svg class="bloom" viewBox="200 200 624 624" aria-hidden="true"><g transform="translate(512 512) scale(1.0033) translate(41.66 8.42)"><path d="M4.85,-59.64 C29.19,-78.22 32.45,-84.42 61.79,-93.14 A44.00,44.00 0 1 0 8.85,-152.75 C-3.28,-124.65 -6.63,-96.94 -7.99,-66.36 A8,8 0 0 0 4.85,-59.64Z"/><path d="M45.67,-39.10 C81.78,-36.49 90.63,-39.14 123.45,-23.87 A49.67,49.67 0 1 0 124.19,-114.27 C91.12,-99.54 66.29,-78.27 40.61,-52.76 A8,8 0 0 0 45.67,-39.10Z"/><path d="M59.91,7.25 C87.25,38.91 97.16,44.85 111.47,84.16 A55.33,55.33 0 1 0 184.12,13.90 C145.31,-1.72 107.95,-5.16 66.13,-5.98 A8,8 0 0 0 59.91,7.25Z"/><path d="M32.89,50.81 C26.66,97.90 28.83,111.64 6.29,153.44 A61.00,61.00 0 1 0 117.64,162.49 C102.15,117.60 77.39,83.21 46.96,46.74 A8,8 0 0 0 32.89,50.81Z"/><path d="M-20.77,57.01 C-66.35,84.39 -77.61,96.16 -129.95,105.57 A66.67,66.67 0 1 0 -62.24,207.50 C-33.27,162.90 -20.07,117.53 -8.83,65.56 A8,8 0 0 0 -20.77,57.01Z"/><path d="M-58.91,15.02 C-112.90,-8.46 -131.34,-11.44 -173.48,-52.56 A72.33,72.33 0 1 0 -221.44,71.49 C-162.60,69.41 -113.26,52.57 -59.00,29.73 A8,8 0 0 0 -58.91,15.02Z"/><path class="lead" d="M-43.70,-42.41 C-53.84,-106.19 -61.95,-125.66 -48.78,-188.89 A78.00,78.00 0 1 0 -189.68,-160.99 C-153.41,-107.55 -109.08,-71.68 -56.19,-34.60 A8,8 0 0 0 -43.70,-42.41Z"/></g></svg>`;

const STYLE = `
:root{--ground:#0c0b0a;--surface:#181715;--fg:#f4ece0;--fg-muted:rgb(244 236 224/.78);--fg-faint:rgb(244 236 224/.52);--line:rgb(244 236 224/.13);--accent:#e2733f;--ember:#d9622b;--ease-out:cubic-bezier(.16,1,.3,1);color-scheme:dark}
*{box-sizing:border-box;margin:0}
body{min-height:100dvh;display:grid;place-items:center;padding:16px;background:radial-gradient(ellipse 80% 50% at 50% 0%,rgb(226 115 63/.12),transparent 70%),var(--ground);color:var(--fg);font:16px/1.5 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
main{width:min(400px,100%);padding:40px 32px 32px;background:var(--surface);border:1px solid var(--line);border-radius:20px;text-align:center;box-shadow:0 24px 64px rgb(0 0 0/.45);animation:rise .6s var(--ease-out) both}
.lockup{display:inline-flex;align-items:center;gap:10px;margin-bottom:32px}
.bloom{width:36px;height:36px;fill:var(--fg)}.bloom .lead{fill:var(--ember)}
.word{font-size:26px;font-weight:800;letter-spacing:-.045em;line-height:1}
.status{width:48px;height:48px;margin:0 auto 20px;display:grid;place-items:center;border-radius:50%;background:rgb(226 115 63/.12);border:1px solid rgb(226 115 63/.32);color:var(--accent)}
.status svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
h1{font-size:22px;font-weight:650;letter-spacing:-.02em;margin-bottom:8px}
p{color:var(--fg-muted)}
code{white-space:nowrap;font:14px ui-monospace,SFMono-Regular,Menlo,monospace;padding:2px 6px;border-radius:6px;background:var(--ground);border:1px solid var(--line);color:var(--fg)}
footer{margin-top:32px;padding-top:20px;border-top:1px solid var(--line);font-size:13px;color:var(--fg-faint)}
footer a{color:inherit;text-decoration:none}footer a:hover{color:var(--fg)}
@keyframes rise{from{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion:reduce){main{animation:none}}`;

const CHECK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
const ALERT = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v6M12 17h.01"/></svg>`;

export function callbackPage(ok: boolean): string {
	const [title, body, icon] = ok
		? [
				"You're signed in",
				"You can close this tab and go back to your terminal.",
				CHECK,
			]
		: [
				"Sign-in couldn't be verified",
				"Go back to your terminal and run <code>dynamoi login</code> again.",
				ALERT,
			];
	return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Dynamoi</title><style>${STYLE}</style></head><body><main><div class="lockup">${BLOOM}<span class="word">dynamoi</span></div><div class="status">${icon}</div><h1>${title}</h1><p>${body}</p><footer><a href="https://dynamoi.com">dynamoi.com</a></footer></main></body></html>`;
}
