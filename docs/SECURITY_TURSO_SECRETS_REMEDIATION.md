# Turso credentials in `server/Dockerfile` — remediation record

**Authorized by:** repository owner (`pianopia`)  
**Date:** 2026-10-27

## Summary

Turso `DATABASE_URL` / `DATABASE_TOKEN` values were committed in `server/Dockerfile` on Git history that is **no longer reachable from `main`**, but those commit objects remain **fetchable by full SHA** on GitHub.

The application reads credentials from **runtime** environment variables (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) — see `server/src/db/index.ts`. They must never appear in Dockerfiles, image layers, or git.

## Orphaned commits (still on GitHub by SHA)

| Short SHA   | Full SHA                                   | Notes                                      |
|------------|---------------------------------------------|--------------------------------------------|
| `2baac420` | `2baac42046b6faf6ea6e4c36550587790ca7d7db` | `ENV DATABASE_*` in `server/Dockerfile`    |
| `5164a50d` | `5164a50dc6fb76cff108a2f18515ed4dc5d90bb5` | Same leak; amended committer timestamp     |

Current `main` tip (`cf3072d5cd4977dd8dd55de950c3a56a113f1739`) uses a clean `server/Dockerfile` without database credentials.

## What was done in git

1. **Reachable history:** Verified with `git log --all -S 'DATABASE_TOKEN'` and `git grep` on `main` — no live tokens; only placeholders in docs.
2. **Branches / tags:** Repository has a single branch (`main`) and no tags; `main` was force-pushed to match the rewritten history (secrets removed from the reachable tree).
3. **HEAD policy:** `server/Dockerfile` documents runtime-only configuration; use `server/.env.example` locally and platform secret injection in production.

Git alone **cannot** delete objects that are already unreachable from refs but still known to GitHub. Those SHAs may continue to resolve until GitHub purges them.

## Owner follow-up (required for orphaned SHAs)

1. **Deploy & verify** the server with runtime env vars (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`) — e.g. Cloud Run `--set-env-vars` / Secret Manager, not Dockerfile `ENV`.
2. **Confirm DB access** against Turso after deploy.
3. **Rotate Turso tokens** in the Turso dashboard after a successful deploy + DB check (not done as part of this remediation).
4. **Request GitHub sensitive-data removal** for the orphaned commits so cached SHAs are purged:
   - [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
   - Contact [GitHub Support](https://support.github.com/) and provide the full SHAs above and the file path `server/Dockerfile`.

## Verification commands

```bash
# Reachable history must not contain Dockerfile database ENV leaks
git grep -n 'DATABASE_TOKEN\|DATABASE_URL=' $(git rev-parse main) -- '**/Dockerfile*' || true

# Optional: scan all refs
git grep -n 'eyJhbGci' $(git rev-parse main) || echo 'no JWT-like blobs on main'
```

## Docker / Cloud Run

Build images without secrets:

```bash
docker build -t rectropic-server ./server
```

Run with runtime configuration:

```bash
docker run --rm -p 8080:8080 \
  -e TURSO_DATABASE_URL='libsql://…' \
  -e TURSO_AUTH_TOKEN='…' \
  -e JWT_SECRET='…' \
  rectropic-server
```

For Google Cloud Run, set variables on deploy/update (example):

```bash
gcloud run deploy rectropic-server \
  --image=… \
  --region=asia-east1 \
  --set-env-vars="TURSO_DATABASE_URL=libsql://…" \
  --set-secrets="TURSO_AUTH_TOKEN=turso-auth-token:latest,JWT_SECRET=jwt-secret:latest"
```

(Adjust secret names to match your project.)
