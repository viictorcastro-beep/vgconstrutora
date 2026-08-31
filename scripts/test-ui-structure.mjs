import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [appHtml, docsHtml] = await Promise.all([
  readFile(new URL("../app/index.html", import.meta.url), "utf8"),
  readFile(new URL("../docs/index.html", import.meta.url), "utf8")
]);

assert.equal(appHtml, docsHtml, "app/index.html e docs/index.html devem ser espelhos exatos.");
assert.match(docsHtml, /id="view-DASHBOARD" class="view-content hidden"/);
assert.match(docsHtml, /id="rat-list" class="overflow-x-auto"/);
assert.match(docsHtml, /id="receb-list" class="overflow-x-auto"/);
assert.match(docsHtml, /id="acerto-list" class="overflow-x-auto"/);
assert.match(docsHtml, /body\.modal-open \{ overflow:hidden; \}/);
assert.match(docsHtml, /aria-live="polite"/);
assert.match(docsHtml, /aria-current/);
assert.match(docsHtml, /prefers-reduced-motion/);
assert.doesNotMatch(docsHtml, /�/);
assert.doesNotMatch(
  docsHtml,
  /toLocaleString\('pt-BR', \{minimumFractionDigits: 2\}\)/,
  "Valores monetários não podem exibir uma terceira casa decimal."
);
assert.doesNotMatch(docsHtml, /fetchCatalogo\("\/api\/catalogos\/etapas"\)[\s\S]{0,200}API_BASE \|\|/);
assert.doesNotMatch(docsHtml, /obra-(?:nome|quadra|lote|endereco)-new/, "O formulário antigo e incompleto de obra não pode reaparecer.");
assert.doesNotMatch(docsHtml, /onclick="(?!window\.)/u, "Handlers inline do módulo precisam chamar funções expostas em window.");
assert.match(docsHtml, /setAttribute\('role', 'dialog'\)/);
assert.match(docsHtml, /setAttribute\('aria-modal', 'true'\)/);
assert.match(docsHtml, /min-height:44px/);
assert.match(docsHtml, /overflow-x:auto/);

const moduleMatch = docsHtml.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(moduleMatch, "O script principal do site precisa existir.");
const tempModule = join(tmpdir(), `vgconstrutora-ui-${process.pid}.mjs`);
await writeFile(tempModule, moduleMatch[1], "utf8");
try {
  execFileSync(process.execPath, ["--check", tempModule], { stdio: "pipe" });
} finally {
  await unlink(tempModule).catch(() => {});
}

console.log("✓ Estrutura, responsividade e sintaxe da interface validadas");
