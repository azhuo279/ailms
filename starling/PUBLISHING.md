# Publishing Starling to GitHub Packages

This guide takes the in-repo package (`starling/tool`) to a standalone private
repo published on **GitHub Packages** so org users can `npm install` it.

Everything except the literal **scope** is already wired. The scope is a
placeholder (`@starling`) because GitHub Packages requires the npm scope to
**exactly match the GitHub org/user that owns the package** — i.e. your "emu"
account. Pick that first.

---

## 0. Decide the scope (one decision, many touchpoints)

Let `@SCOPE` = your GitHub org or user login (e.g. `@emu`). Every file below uses
the placeholder `@starling` / `EMU_OWNER`; replace them with the real values:

| File | Placeholder | Replace with |
| --- | --- | --- |
| `package.json` `name` | `@starling/dev` | `@SCOPE/starling` |
| `package.json` `repository`/`homepage`/`bugs` | `EMU_OWNER` | the GitHub owner |
| `.npmrc` (publish) | `@starling:registry=…` | `@SCOPE:registry=…` |
| `.github/workflows/publish.yml` | `scope: "@starling"` | `scope: "@SCOPE"` |
| Consuming apps' imports | `@starling/dev` | `@SCOPE/starling` |

Also flip `"private": true` → remove it (or `false`) in `package.json` — it is
deliberately left `true` so an accidental `npm publish` can't fire before the
scope is set.

---

## 1. Extract into a standalone repo

`starling/tool` is untracked in the host repo (root `.gitignore` ignores
`starling/`), so there is no history to preserve — a fresh init is cleanest:

```bash
# From anywhere; copy the package out as a new repo root.
cp -R "<host-repo>/starling/tool" ~/code/starling
cd ~/code/starling
rm -rf dist node_modules package-lock.json
git init
git add -A
git commit -m "chore: initial import of Starling dev annotation tool"
```

The copied tree already contains `src/`, `plugin/`, `examples/`, `test/`,
`README.md`, `LICENSE`, `.npmrc`, `.github/workflows/publish.yml`, build config,
and this guide.

---

## 2. Create the private GitHub repo and push

```bash
gh repo create SCOPE/starling --private --source=. --remote=origin --push
```

(or create it in the GitHub UI under the "emu" org and `git remote add origin …`
+ `git push -u origin main`.)

---

## 3. Tokens & auth

- **Publishing (CI):** the workflow uses the built-in `secrets.GITHUB_TOKEN`
  with `permissions: { packages: write }` — no PAT needed.
- **Publishing (manual/local):** a classic PAT with `write:packages` (and `repo`
  if the repo is private). Then `export NODE_AUTH_TOKEN=<PAT>` and `npm publish`.
- **Consuming (other org apps):** a PAT with `read:packages` (and `repo` if
  private), exported as `GITHUB_TOKEN` per machine/CI.

---

## 4. Publish

Recommended (CI, via Release):

```bash
npm version patch          # bumps version + tags
git push --follow-tags
gh release create vX.Y.Z --generate-notes   # fires .github/workflows/publish.yml
```

Manual fallback:

```bash
export NODE_AUTH_TOKEN=<write:packages PAT>
npm publish                # prepublishOnly runs the build; publishConfig targets GH Packages
```

Validate without publishing anytime with:

```bash
npm publish --dry-run      # inspect the tarball, files, and resolved exports
```

---

## 5. Consume it in another org app

Add an `.npmrc` at that app's root (commit it with the env-var placeholder; never
commit a real token):

```ini
@SCOPE:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then:

```bash
export GITHUB_TOKEN=<read:packages PAT>
npm install -D @SCOPE/starling
```

Wire it (Next.js App Router):

```tsx
// app/layout.tsx
import { Starling } from "@SCOPE/starling/next";
// …
<Starling saveEndpoint="/api/starling/save"
          listEndpoint="/api/starling/list"
          loadEndpoint="/api/starling/load" />
```

```ts
// next.config.ts
import { withStarling } from "@SCOPE/starling/next/config";
export default withStarling(nextConfig);
```

Copy the three dev-only API routes from the host
(`src/app/api/starling/{save,list,load}/route.ts`) into the consuming app — they
own the `annotations/` folder I/O and the `git config user.name` authorship stamp.

---

## 6. Migrate THIS host off the `file:` dependency (optional)

Once published, the host at the repo root can switch from the local copy:

```diff
- "@starling/dev": "file:starling/tool",
+ "@SCOPE/starling": "^0.1.0",
```

Add the consuming `.npmrc` (step 5), `npm install`, and update the imports in
`src/app/layout.tsx` and `next.config.ts` to the new scope. The local
`starling/` folder stays untracked (root `.gitignore`) and can be removed.
