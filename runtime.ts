/**
 * Enum of supported runtimes.
 */
export enum Runtimes {
  Deno = "deno",
  Bun = "bun",
  Node = "node",
  Unsupported = "unsupported",
}

function getCurrentRuntime(): Runtimes {
  if (typeof Deno === "object") {
    return Runtimes.Deno;
    // @ts-ignore
  } else if (typeof Bun === "object") {
    return Runtimes.Bun;
  } else if (
    // @ts-ignore
    typeof process === "object" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined"
  ) {
    return Runtimes.Node;
  } else {
    return Runtimes.Unsupported;
  }
}

const CurrentRuntime = getCurrentRuntime();

export { CurrentRuntime };
