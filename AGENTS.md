# AstronomyLab standalone project

Use native Windows PowerShell 7 locally; do not use WSL. Python project work uses the existing Conda dl_env environment. Runtime needs only Node.js 22; do not install Conda or Python on the server for serving this site.

This repository is independent of WebsiteZJUAAA. Do not change, merge into, restart, stop, or migrate the existing official website or any other server site. Keep deployment directory, PM2 process, Nginx server block, hostname, and TLS certificate separate. Port 4180 must remain bound to 127.0.0.1; Nginx is the public entry.

Read README.md and docs/DEPLOYMENT.md. Preserve existing source, science models, data, article text, and attributions. Do not publish original exam PDFs, teacher records, private keys, credentials, private QA evidence, or .env files. Local historical engineering results are not production verification, human scientific review, classroom trials, or textbook verification.

Keep third-party licenses and source records; the repository has no blanket license covering all assets. Review unresolved redistribution terms before public release. SSH credentials and local private key paths belong only in the local chat/handoff, never in the public repository.
