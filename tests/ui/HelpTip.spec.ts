/**
 * HelpTip Primitive Unit Tests
 *
 * Structure-only tests verifying API contract. Following Card.spec convention,
 * full render tests with hooks deferred to a future jsdom setup. Hook usage
 * (useState/useId/useRef/useEffect) means we cannot invoke the component
 * outside a React renderer.
 */

import { describe, it, expect } from "vitest";
import { HelpTip } from "../../src/ui/primitives/HelpTip.js";

describe("HelpTip primitive", () => {
  it("exports HelpTip as a named export", () => {
    expect(typeof HelpTip).toBe("function");
  });

  it("exposes the documented prop signature via length", () => {
    // React function components accept a single props object → length 1
    expect(HelpTip.length).toBe(1);
  });
});
