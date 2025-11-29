import esbuild from "esbuild";
import { dtsPlugin } from "esbuild-plugin-d.ts";
import { cp, readFile, writeFile } from "@cross/fs";
import { dirname, fromFileUrl, resolve } from "@std/path";

/**
 * Build helpers
 */
export async function build(
  baseConfig: esbuild.BuildOptions,
  configs?: esbuild.BuildOptions[],
): Promise<void> {
  const buildConfigs = configs?.map((config) => ({ ...baseConfig, ...config })) || [baseConfig];
  try {
    await Promise.all(buildConfigs.map((config) => esbuild.build(config)));
    console.log("All builds completed successfully.");
  } catch (error) {
    console.error("Build failed:", error);
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  const jsonData = await readFile(filePath);
  return JSON.parse(new TextDecoder().decode(jsonData)) as T;
}

/**
 * Now the actual build script
 */

/* Preparations - Work out paths */
const baseRelativeProjectRoot = "../"; // Where is this script located relative to the project root
const currentScriptDir = dirname(fromFileUrl(import.meta.url));
const relativeProjectRoot = resolve(currentScriptDir, baseRelativeProjectRoot);
const resolvedDistPath = resolve(relativeProjectRoot, "dist");

/* Handle argument `clean`: Rimraf build artifacts */
if (Deno.args[1] === "clean") {
  for (
    const filePath of [
      "package.json",
      "tsconfig.json",
      "node_modules",
      "dist",
    ]
  ) {
    try {
      await Deno.remove(filePath, { recursive: true });
    } catch (_e) { /* No-op */ }
  }

  /* Handle argument `build`: Transpile and generate typings */
} else if (Deno.args[1] === "build") {
  await build({
    entryPoints: [resolve(relativeProjectRoot, "mod.ts")],
    bundle: true,
    minify: true,
    sourcemap: false,
    // Mark runtime-specific modules as external - they won't be bundled
    // node:test is a Node.js built-in, bun:test is a Bun built-in
    external: ["bun:test", "node:test"],
    // Use banner to add a comment
    banner: {
      js: `// @cross/test - Cross-runtime testing for Deno, Bun, and Node.js
// This build is for Node.js. For Deno, use JSR: jsr:@cross/test
`,
    },
  }, [
    {
      outdir: resolvedDistPath,
      platform: "node",
      format: "cjs",
      outExtension: { ".js": ".cjs" },
    },
    {
      outdir: resolvedDistPath,
      platform: "node",
      format: "esm",
      plugins: [dtsPlugin({
        experimentalBundling: true,
        tsconfig: {
          compilerOptions: {
            declaration: true,
            emitDeclarationOnly: true,
            allowImportingTsExtensions: true,
            lib: ["es6", "dom"],
          },
        },
      })],
    },
  ]);

  // Just re-use the .d.ts for commonjs, as .d.cts
  await cp(
    resolve(resolvedDistPath, "mod.d.ts"),
    resolve(resolvedDistPath, "mod.d.cts"),
  );

  /* Handle argument `package`: Generate package.json based on a base config and values from deno.json */
} else if (Deno.args[1] === "package") {
  // Read version from deno.json
  const denoConfig = await readJson<{ version: string; name: string }>(
    resolve(relativeProjectRoot, "deno.json"),
  );

  // Write package.json
  await writeFile(
    resolve(relativeProjectRoot, "package.json"),
    new TextEncoder().encode(JSON.stringify(
      {
        ...await readJson<object>(resolve(relativeProjectRoot, "build/package.template.json")),
        // Use cross-test as npm package name (without @ scope)
        name: "cross-test",
        version: denoConfig.version,
      },
      null,
      2,
    )),
  );
}
