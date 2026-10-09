import manifest from "../../scripts/additional-reference-manifest.json";
import { describe, expect, it } from "vitest";
import { ensureExtendedCatalogLoaded, problems } from "./problems";
import { hasProblemReference, loadProblemReference } from "./problemReferences";

describe("problem references", () => {
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
  it("provides coherent Python/C++ references for the supported extended catalog", async () => {
    const catalog = await ensureExtendedCatalogLoaded();
    const supported = catalog.filter((problem) => hasProblemReference(problem.id));
    expect(supported).toHaveLength(586);
    for (const problem of supported) {
      const reference = await loadProblemReference(problem.id);
      expect(reference?.problemId).toBe(problem.id);
      expect(reference?.approach, problem.id).toBeTruthy();
      for (const section of ["How it works", "Steps", "Complexity"]) {
        expect(reference?.explanation, problem.id).toContain(`### ${section}`);
      }
      expect(reference?.code.python, problem.id).toMatch(/class /);
      expect(reference?.code.cpp, problem.id).toMatch(/class |struct /);
      expect(reference?.videoUrl).toBe(problem.videoUrl);
      expect(reference?.sourceUrl).toMatch(
        /^(https:\/\/github.com\/neetcode-gh\/leetcode\/blob\/3186ede2ea4c4788e87be4b509bf2b66d5eba0e9\/(articles|python)\/|https:\/\/github.com\/walkccc\/LeetCode\/tree\/9b85aa15e086d0b5dc1ead7184bca547942e6ff6\/solutions\/)/,
      );
    }
    for (const id of ["string-compression", "reverse-words-in-a-string", "reverse-words-in-a-string-ii", "reverse-words-in-a-string-iii"]) {
      expect(hasProblemReference(id), id).toBe(true);
    }
  });
  it("adds 80 medium and 20 easy references with source-specific attribution", async () => {
    expect(manifest.references.filter((r) => r.difficulty === "Medium")).toHaveLength(80);
    expect(manifest.references.filter((r) => r.difficulty === "Easy")).toHaveLength(20);
    for (const entry of manifest.references) {
      const reference = await loadProblemReference(entry.id);
      expect(reference?.sourceName).toBe("walkccc / Peng-Yu Chen");
      expect(reference?.licenseUrl).toBe("/walkccc-license.txt");
      expect(reference?.explanationAuthor).toBe("LC Tracker");
      expect(reference?.explanation).toContain("### Things to watch for");
      expect(reference?.code.python).not.toContain("sortedcontainers");
      expect(reference?.code.python).not.toContain("eval(");
    }
  });
  it("does not present core guidance as the solution for an extended-catalog problem", async () => {
    expect(hasProblemReference("count-commas-in-range")).toBe(false);
    expect(await loadProblemReference("count-commas-in-range")).toBeNull();
  });
});
