import { describe, expect, it } from "vitest";
import { problems } from "./problems";
import { hasProblemReference, loadProblemReference } from "./problemReferences";

describe("core problem references", () => {
  it("provides a matching explanation, two code examples, and a NeetCode video for every core library item", async () => {
    expect(problems).toHaveLength(250);
    for (const problem of problems) {
      expect(hasProblemReference(problem.id), problem.id).toBe(true);
      const reference = await loadProblemReference(problem.id);
      expect(reference?.problemId).toBe(problem.id);
      expect(reference?.explanation, problem.id).toContain("### How it works");
      expect(reference?.explanation, problem.id).toContain("### Complexity");
      expect(reference?.code.python, problem.id).toMatch(/class /);
      expect(reference?.code.cpp, problem.id).toMatch(/class |struct /);
      expect(reference?.videoUrl).toBe(problem.videoUrl);
      expect(problem.videoUrl).toMatch(
        /^https:\/\/www.youtube.com\/watch\?v=[\w-]{11}$/,
      );
      expect(reference?.sourceUrl).toContain("/articles/");
    }
  });
  it("does not present core guidance as the solution for an extended-catalog problem", async () => {
    expect(hasProblemReference("count-commas-in-range")).toBe(false);
    expect(await loadProblemReference("count-commas-in-range")).toBeNull();
  });
});
