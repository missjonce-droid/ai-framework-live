# Cloudflare Pages redirects.
#
# Note: the /api/* routes that were here on Netlify are gone on purpose.
# Cloudflare Pages Functions are routed by file path, so functions/api/
# build-framework.js is automatically served at /api/build-framework. Adding
# a redirect for it would actually shadow the function.
#
# Cloudflare evaluates these top to bottom and caps the file at 2100 rules,
# which this is nowhere near.

/vault-thank-you     /vault-thank-you/index.html     200
/playbooks           /playbooks/index.html           200
/build-my-framework  /build-my-framework/index.html  200
/promptlab           /promptlab.html                 200
/prompt-lab          /promptlab.html                 200
/prompt-lab/         /promptlab.html                 200
/receipt             /receipt.html                   200
/the-receipt         /receipt.html                   200
/news                /news.html                      200

# SPA fallback - must stay last so it can't swallow the rules above.
/*                   /index.html                     200
