# Agents quick checklist

This repo uses cross-org reusable CI for Deno, Bun, and Node. Make your changes
pass the same checks locally.

Source of truth:

- Deno CI:
  https://github.com/cross-org/workflows/blob/main/.github/workflows/deno-ci.yml
- Bun CI:
  https://github.com/cross-org/workflows/blob/main/.github/workflows/bun-ci.yml
- Node CI:
  https://github.com/cross-org/workflows/blob/main/.github/workflows/node-ci.yml

Repo CI inputs (`.github/workflows/test.yml`):

- Deno: entrypoint=mod.ts, lint_docs=false
- Bun: jsr deps: @std/assert @std/async @cross/runtime; npm deps: sinon
- Node: test_target=*.test.ts; jsr deps: @std/assert @std/async @cross/runtime;
  npm deps: sinon

Do before you commit:

- Deno: deno fmt --check; deno lint; deno check mod.ts; deno test -A
- Bun: tests run with bun test after jsr/npm deps install
- Node (18/20/22): tests run with tsx; ESM required

Keep in mind:

- Don't break the public entrypoint (mod.ts). If you change it, update
  test.yml.
- Prefer minimal diffs and stable public APIs.
- New deps must resolve via JSR/NPM across Deno/Bun/Node.
- Keep this file (AGENTS.md) lean if requested to add stuff.
- This is a cross-runtime testing framework - changes must work identically
  across all three runtimes.

Docs:

- Keep README concise and focused on usage examples.
- Inline documentation in mod.ts should be comprehensive for JSR docs.

Network access (Copilot workspace):

- npmjs.org, registry.npmjs.org, deno.land, jsr.io
- github.com, raw.githubusercontent.com, bun.sh
