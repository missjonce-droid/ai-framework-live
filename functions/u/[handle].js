// /u/<handle> — a member's public AI Page, server-rendered.
// Shows only what the member chose to publish: profile fields, favorite
// tools (their stack), and frameworks they marked public.
import { getPublicProfile, cleanHandle, isNotReady } from '../api/_profiles.js';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const CSS = `
  :root{--bg:#0D0A07;--panel:#1A130C;--panel2:#241A10;--line:#3A2A1A;--ivory:#EDE6D8;
  --dim:#AB9C88;--faint:#776A58;--copper:#C97E4A;--copper2:#E09554;--brass:#C9A25E;--chrome:#C9CCD4}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--ivory);font-family:Archivo,-apple-system,"Segoe UI",sans-serif;line-height:1.55}
  .wrap{max-width:880px;margin:0 auto;padding:0 20px}
  header{padding:56px 0 34px;border-bottom:1px solid var(--line);
    background-image:radial-gradient(ellipse 90% 420px at 50% -80px,rgba(201,126,74,.10),transparent 70%)}
  .avatar{width:74px;height:74px;border-radius:14px;background:linear-gradient(160deg,#DE9257,#8A5227);
    display:flex;align-items:center;justify-content:center;font-family:"Big Shoulders Display",sans-serif;
    font-size:36px;font-weight:800;color:#180F06;border:1px solid #8A5227}
  .handle{font-family:"Spline Sans Mono",monospace;color:var(--copper);font-size:13px;letter-spacing:.14em;margin-top:16px}
  h1{font-family:"Big Shoulders Display",sans-serif;font-size:46px;font-weight:800;line-height:1.02;margin:4px 0 8px}
  .bio{color:var(--dim);font-size:17px;max-width:60ch}
  .since{font-family:"Spline Sans Mono",monospace;font-size:11px;color:var(--faint);letter-spacing:.12em;text-transform:uppercase;margin-top:12px}
  section{padding:34px 0;border-bottom:1px solid var(--line)}
  .kicker{font-family:"Spline Sans Mono",monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--copper);margin-bottom:12px}
  .ai-about{font-size:19px;line-height:1.6;color:var(--ivory);max-width:64ch}
  .chips{display:flex;flex-wrap:wrap;gap:8px}
  .chip{font-family:"Spline Sans Mono",monospace;font-size:11.5px;color:var(--chrome);border:1px solid #4d4438;
    border-radius:3px;padding:6px 11px;box-shadow:inset 0 1px 0 rgba(233,235,240,.07)}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:22px;margin-bottom:14px;
    box-shadow:inset 0 1px 0 rgba(233,235,240,.05)}
  .card h3{font-family:"Big Shoulders Display",sans-serif;font-size:25px;font-weight:700;margin-bottom:6px}
  .goal{color:var(--dim);font-size:15px;margin-bottom:12px}
  .outcome{border-left:2px solid var(--brass);padding-left:13px;color:var(--ivory);font-size:15px;margin:14px 0}
  .outcome small{display:block;font-family:"Spline Sans Mono",monospace;font-size:10px;letter-spacing:.18em;
    text-transform:uppercase;color:var(--brass);margin-bottom:4px}
  .card-foot{display:flex;align-items:center;gap:14px;margin-top:16px;flex-wrap:wrap}
  .forks{font-family:"Spline Sans Mono",monospace;font-size:11.5px;color:var(--faint);letter-spacing:.08em}
  .fork-btn{font-family:"Spline Sans Mono",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;
    background:linear-gradient(180deg,#DE9257,#B26A33);color:#180F06;border:1px solid #8A5227;border-radius:4px;
    padding:10px 16px;cursor:pointer;font-weight:600}
  .fork-btn[disabled]{opacity:.55;cursor:default}
  .fork-msg{font-size:13.5px;color:var(--copper2)}
  .empty{color:var(--faint);font-size:15px}
  footer{padding:38px 0 54px}
  .cta{background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:24px;text-align:center}
  .cta h2{font-family:"Big Shoulders Display",sans-serif;font-size:28px;margin-bottom:6px}
  .cta p{color:var(--dim);margin-bottom:16px}
  .cta a{display:inline-block;background:linear-gradient(180deg,#DE9257,#B26A33);color:#180F06;font-weight:700;
    text-decoration:none;padding:12px 22px;border-radius:5px;border:1px solid #8A5227}
  .brand{font-family:"Spline Sans Mono",monospace;font-size:11px;letter-spacing:.2em;color:var(--faint);
    text-transform:uppercase;text-align:center;margin-top:22px}
  .brand a{color:var(--dim);text-decoration:none}
`;

function page(title, body, status = 200) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="An AI Page on AI Framework — a living page for someone's AI: their stack, their frameworks, their results.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Big+Shoulders+Display:wght@600;700;800&family=Spline+Sans+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${body}
</body>
</html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function noticePage(heading, text, status = 200) {
  return page('AI Framework', `
  <header><div class="wrap">
    <div class="handle">AI FRAMEWORK</div>
    <h1>${esc(heading)}</h1>
    <p class="bio">${esc(text)}</p>
  </div></header>
  <footer><div class="wrap"><div class="cta">
    <h2>Get your own AI Page</h2>
    <p>Your AI, on display: your stack, your frameworks, your results.</p>
    <a href="/my-page/">Claim your page</a>
  </div>
  <p class="brand"><a href="/">AI Framework — Your AI Operating System</a></p>
  </div></footer>`, status);
}

export async function onRequestGet({ env, params }) {
  const handle = cleanHandle(params.handle || '');
  if (!handle) return noticePage('Page not found', 'That address does not look right.', 404);
  if (!env.DB) return noticePage('AI Pages are coming', 'Public AI Pages are not switched on yet.');

  let data;
  try {
    data = await getPublicProfile(env.DB, handle);
  } catch (e) {
    if (isNotReady(e)) return noticePage('AI Pages are coming', 'Public AI Pages are not switched on yet.');
    throw e;
  }
  if (!data) return noticePage('Page not found', `@${handle} has not claimed this page yet.`, 404);

  const p = data.profile;
  const initial = esc((p.display_name || handle).charAt(0).toUpperCase());
  const since = p.member_since ? String(p.member_since).slice(0, 10) : '';

  const stack = data.stack.length
    ? `<div class="chips">${data.stack.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>`
    : '<p class="empty">No tools on display yet.</p>';

  const cards = data.frameworks.length ? data.frameworks.map((f) => `
    <article class="card">
      <h3>${esc(f.title)}</h3>
      ${f.goal ? `<p class="goal">${esc(f.goal)}</p>` : ''}
      ${f.tools.length ? `<div class="chips">${f.tools.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
      ${f.outcome_note ? `<div class="outcome"><small>Owner's result — self-reported</small>${esc(f.outcome_note)}</div>` : ''}
      <div class="card-foot">
        <button class="fork-btn" data-fork="${esc(f.id)}" type="button">Fork this framework</button>
        <span class="forks">${f.forks} fork${f.forks === 1 ? '' : 's'}</span>
        <span class="fork-msg" data-msg="${esc(f.id)}"></span>
      </div>
    </article>`).join('')
    : '<p class="empty">No frameworks published yet.</p>';

  const body = `
  <header><div class="wrap">
    <div class="avatar">${initial}</div>
    <div class="handle">@${esc(p.handle)}</div>
    <h1>${esc(p.display_name)}</h1>
    ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}
    ${since ? `<p class="since">On AI Framework since ${esc(since)}</p>` : ''}
  </div></header>
  ${p.ai_about ? `<section><div class="wrap">
    <p class="kicker">What my AI does</p>
    <p class="ai-about">${esc(p.ai_about)}</p>
  </div></section>` : ''}
  <section><div class="wrap">
    <p class="kicker">My stack</p>
    ${stack}
  </div></section>
  <section><div class="wrap">
    <p class="kicker">My frameworks</p>
    ${cards}
  </div></section>
  <footer><div class="wrap"><div class="cta">
    <h2>Get your own AI Page</h2>
    <p>Build a framework, put it on display, and let people fork it.</p>
    <a href="/my-page/">Claim your page</a>
  </div>
  <p class="brand"><a href="/">AI Framework — Your AI Operating System</a></p>
  </div></footer>
  <script>
  document.querySelectorAll('[data-fork]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-fork');
      var msg = document.querySelector('[data-msg="' + id + '"]');
      btn.disabled = true; msg.textContent = 'Forking...';
      fetch('/api/v1/frameworks/' + id + '/fork', { method: 'POST' })
        .then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); })
        .then(function(res){
          if (res.ok) { msg.innerHTML = 'Forked to your workspace. <a href="/my-page/" style="color:inherit">Open it</a>'; return; }
          btn.disabled = false;
          msg.textContent = res.j.error || 'Could not fork.';
          if (res.j.error && res.j.error.indexOf('Sign in') === 0) {
            msg.innerHTML = 'Sign in to fork. <a href="/build-my-framework/" style="color:inherit">Sign in</a>';
          }
        })
        .catch(function(){ btn.disabled = false; msg.textContent = 'Could not fork.'; });
    });
  });
  </script>`;
  return page(`${p.display_name} (@${p.handle}) — AI Framework`, body);
}
