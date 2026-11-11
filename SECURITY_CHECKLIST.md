# 🔒 Security & Privacy Checklist

## ✅ Current Measures

### 1. Environment Variables
- ✅ `.env` and its variants (`.env.local`, `.env.production`, …) are in `.gitignore`
- ✅ No `.env` file has ever been committed (`git log --all -- .env` is empty)
- ✅ `.env.example` contains only placeholder values
- ✅ The browser bundle only gets `VITE_` variables: the Supabase URL and publishable (anon) key, which are public by design and limited by RLS
- ✅ The Groq API key is a Supabase secret read by the `groq-proxy` Edge Function, never a `VITE_` variable

### 2. Git Ignore Configuration
`.gitignore` excludes:
- ✅ All `.env*` files
- ✅ Secret files (`.key`, `.pem`, `.p12`, `.pfx`)
- ✅ Local database dumps (`local_schema.sql`)
- ✅ Build artifacts (`dist`, `build`, `node_modules`)
- ✅ Editor files (`.vscode`, `.idea`)

### 3. GitHub Repository Settings
The repository is public. As of 2026-11-11:
- ✅ Secret scanning is on, with no open alerts
- ✅ Push protection is on, so pushes containing known provider secrets are blocked
- ⚠️ Scanning for non-provider patterns (generic passwords, private keys) is off
- ⚠️ Dependabot alerts and security updates are off

### 4. Payments
The app is free and contains no payment code, so there are no Stripe keys, price IDs, or webhook secrets to protect.

## 🔐 Keys and Where They Live

| Key | Where it lives | Public? |
|-----|----------------|---------|
| `VITE_SUPABASE_URL` | `.env`, Vercel environment variables | Yes, bundled into the app |
| `VITE_SUPABASE_ANON_KEY` | `.env`, Vercel environment variables | Yes, a publishable key; RLS limits what it can do |
| `GROQ_API_KEY` | Supabase secret for `groq-proxy` | **No**, never prefix it with `VITE_` |
| Supabase secret / service-role key | Supabase dashboard only | **No**, never in this repo or the frontend |

## 📝 Before Every Push

```bash
# 1. .env must not be listed
git status

# 2. Review what is staged
git diff --cached

# 3. Look for secrets in the staged changes
git diff --cached | grep -E "(api[_-]?key|secret|password|token|sk_live|sb_secret_|gsk_)"
```

## 🚨 If a Secret Is Committed

1. **Rotate it first.** Once a secret has been pushed, rotation is the only real fix:
   - Groq: https://console.groq.com/keys (create a new key, update the Supabase secret, delete the old key)
   - Supabase: Project Settings → API Keys (create a replacement secret key, switch to it, delete the old one)
2. **Not pushed yet:** undo the commit with `git reset --soft HEAD~1`, unstage the file, and commit again.
3. **Already pushed:** rewriting history (for example with `git filter-repo`) and force-pushing removes it from branches, but copies can survive in forks, clones, pull request refs, and GitHub's caches until GitHub Support purges them. Treat the secret as leaked either way.

## 📋 Never Commit

- `.env` (all variants)
- Files with API keys, passwords, or tokens
- `.key`, `.pem`, `.p12`, `.pfx` files
- Database dumps or exports with real data
- `node_modules/`, `dist/`, `build/`

## 📋 Safe to Commit

- `.env.example` (placeholders only)
- Source code (`src/**`, `supabase/functions/**`)
- Database migrations (schema only, no real data)
- Markdown documentation
- `package.json`, `tsconfig.json`, and other config files

## 🎯 Current Status

- ✅ No secrets in tracked files
- ✅ A scan of all reachable commits for common secret formats (Stripe, Groq, Supabase secret and service-role keys, webhook secrets) found none. The only keys in history are Supabase anon keys, which are public by design.
- ✅ `.env.example` has placeholders only
- ✅ No payment code or payment keys

---

**Last Verified**: 2026-11-11
**Project**: personal-finance-web-app
