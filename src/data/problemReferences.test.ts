import manifest from "../../scripts/additional-reference-manifest.json";
import approachManifest from "../../scripts/approach-reference-manifest.json";
import { describe, expect, it } from "vitest";
import { ensureExtendedCatalogLoaded, problems } from "./problems";
import { getProblemApproaches, hasProblemReference, loadProblemReference } from "./problemReferences";

describe("problem references", () => {
  it("offers two or three distinct approaches for every NeetCode 250 problem, preserving the default", async () => {
    expect(approachManifest.problems.map((entry) => entry.id).sort()).toEqual(problems.map((problem) => problem.id).sort());
    let added = 0;
    for (const entry of approachManifest.problems) {
      const reference = (await loadProblemReference(entry.id))!;
      const approaches = getProblemApproaches(reference);
      expect(approaches[0].id, entry.id).toBe("default");
      expect(approaches[0].approach, entry.id).toBe(entry.default);
      expect(approaches[0].code.cpp, entry.id).toBeTruthy();
      expect(approaches.slice(1).map((approach) => approach.approach), entry.id).toEqual(entry.alternatives);
      expect(approaches.length, entry.id).toBeGreaterThanOrEqual(2);
      expect(approaches.length, entry.id).toBeLessThanOrEqual(3);
      expect(new Set(approaches.map((approach) => approach.id)).size, entry.id).toBe(approaches.length);
      expect(new Set(approaches.map((approach) => approach.code.python)).size, entry.id).toBe(approaches.length);
      for (const approach of approaches.slice(1)) {
        for (const section of ["How it works", "Steps", "Complexity"]) {
          expect(approach.explanation, `${entry.id}: ${approach.id}`).toContain(`### ${section}`);
        }
        expect(approach.code.python).toContain("class ");
        expect(approach.code.cpp).toBeUndefined();
        expect(approach.sourceUrl).toContain(approachManifest.revision);
        expect(approach.code.python).not.toContain("sortedcontainers");
        added++;
      }
    }
    expect(added).toBe(445);
  });
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
  it("uses the requested row, column, and box sets for Valid Sudoku", async () => {
    const reference = await loadProblemReference("valid-sudoku");
    expect(reference?.approach).toBe("Hash Set (One Pass)");
    expect(reference?.code.python).toContain("import collections");
    expect(reference?.code.python).toContain("collections.defaultdict(set)");
    expect(reference?.code.python).toContain("squares[(r // 3, c // 3)]");
    expect(reference?.code.cpp).toContain("unordered_set<char>");
    expect(reference?.explanation).toContain("collections.defaultdict(set)");
    expect(reference?.explanation).toContain("fixed 9×9 board");
    expect(reference?.explanation).not.toContain("mask");
  });
  it("does not present core guidance as the solution for an extended-catalog problem", async () => {
    expect(hasProblemReference("count-commas-in-range")).toBe(false);
    expect(await loadProblemReference("count-commas-in-range")).toBeNull();
  });
});
