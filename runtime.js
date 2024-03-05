/**
 * Enum of supported runtimes.
 */
export const Runtimes = {
  Deno: 1,
  Bun: 2,
  Node: 3,
  Unsupported: 1000,
};

function getCurrentRuntime() {
  if (typeof Deno === "object") {
    return Runtimes.Deno;
  } else if (typeof Bun === "object") {
    return Runtimes.Bun;
  } else if (
    typeof process === "object" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined"
  ) {
    return Runtimes.Node;
  } else {
    return Runtimes.Unsupported;
  }
}

const CurrentRuntime = getCurrentRuntime();

export { CurrentRuntime };
