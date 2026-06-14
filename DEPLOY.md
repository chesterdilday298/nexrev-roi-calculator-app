# Deploy to GitHub + Vercel

## Step 1 — Push to GitHub

1. Go to **github.com** and click **New repository**
2. Name it `nexrev-roi-calculator` · Private or Public · **no** README (we already have files)
3. Click **Create repository**
4. Copy the repo URL (looks like `https://github.com/YOUR_USERNAME/nexrev-roi-calculator.git`)
5. Open Terminal in the `nexrev-roi-calculator` folder and run:

```bash
git init
git add .
git commit -m "Initial commit — NexRev ROI calculator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nexrev-roi-calculator.git
git push -u origin main
```

Sign in with your chester@keystoneendurance.com Google login when GitHub prompts you.

---

## Step 2 — Deploy on Vercel

1. Go to **vercel.com** · Sign in with your chester@keystoneendurance.com Google account
2. Click **Add New → Project**
3. Click **Import** next to `nexrev-roi-calculator`
4. Vercel auto-detects Vite — leave all defaults as-is
5. Click **Deploy**

That's it. Vercel builds and gives you a URL like `nexrev-roi-calculator.vercel.app` in ~60 seconds.

---

## Optional: Custom Domain

In Vercel → your project → **Settings → Domains**, add something like `roi.nexrev.com` or `calculator.nexrev.com` if NexRev gives you access to their DNS.

---

## Updating the site later

Any `git push` to `main` triggers an automatic redeploy on Vercel. No manual steps needed.

---

## Email capture (production setup)

Right now the email form stores submissions in React state (memory only — lost on page refresh). For real lead capture, replace the `handleSubmit` function body in `src/App.jsx` with a POST to one of these:

- **Formspree** (easiest): `fetch('https://formspree.io/f/YOUR_FORM_ID', { method: 'POST', body: formData })`
- **HubSpot Forms API**: POST to `https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}`
- **Zapier Webhook**: POST JSON to your Zap's catch webhook URL → Zapier routes to HubSpot/email/etc.
