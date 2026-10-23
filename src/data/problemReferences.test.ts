import manifest from "../../scripts/additional-reference-manifest.json";
import approachManifest from "../../scripts/approach-reference-manifest.json";
import extendedApproachManifest from "../../scripts/extended-approach-reference-manifest.json";
import moreApproachManifest from "../../scripts/more-approach-reference-manifest.json";
import catalogApproachManifest from "../../scripts/catalog-approach-reference-manifest.json";
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
  it("expands 429 extended problems with 743 coherent Python alternatives while retaining their defaults", async () => {
    const catalog = await ensureExtendedCatalogLoaded();
    const extendedIds = new Set(catalog.map((problem) => problem.id));
    const coreIds = new Set(problems.map((problem) => problem.id));
    expect(extendedApproachManifest.problems).toHaveLength(429);
    expect(new Set(extendedApproachManifest.problems.map((entry) => entry.id)).size).toBe(429);
    let added = 0;
    for (const entry of extendedApproachManifest.problems) {
      expect(extendedIds.has(entry.id), entry.id).toBe(true);
      expect(coreIds.has(entry.id), entry.id).toBe(false);
      const reference = (await loadProblemReference(entry.id))!;
      const approaches = getProblemApproaches(reference);
      expect(approaches[0].id, entry.id).toBe("default");
      expect(approaches[0].approach, entry.id).toBe(entry.default);
      expect(approaches[0].code.cpp, entry.id).toBeTruthy();
      expect(approaches.slice(1).map((approach) => approach.approach), entry.id).toEqual(entry.alternatives);
      expect(approaches.length, entry.id).toBeGreaterThanOrEqual(2);
      expect(approaches.length, entry.id).toBeLessThanOrEqual(3);
      expect(new Set(approaches.map((approach) => approach.id)).size, entry.id).toBe(approaches.length);
      expect(new Set(approaches.map((approach) => approach.code.python.trim())).size, entry.id).toBe(approaches.length);
      for (const approach of approaches.slice(1)) {
        for (const section of ["How it works", "Steps", "Complexity"]) {
          expect(approach.explanation, `${entry.id}: ${approach.id}`).toContain(`### ${section}`);
        }
        expect(approach.code.python, entry.id).toContain("class ");
        expect(approach.code.cpp, entry.id).toBeUndefined();
        expect(approach.sourceUrl, entry.id).toBe(reference.sourceUrl);
        expect(approach.sourceUrl, entry.id).toContain(extendedApproachManifest.revision);
        expect(approach.code.python, entry.id).not.toContain("sortedcontainers");
        expect(approach.explanation, entry.id).not.toContain("::tabs-");
        added++;
      }
    }
    expect(added).toBe(743);
  });
  it("adds 127 further alternatives with accurate authored or source-specific attribution", async () => {
    const catalog = await ensureExtendedCatalogLoaded();
    const catalogIds = new Set(catalog.map((problem) => problem.id));
    const priorIds = new Set([...approachManifest.problems, ...extendedApproachManifest.problems].map((entry) => entry.id));
    expect(moreApproachManifest.problems).toHaveLength(127);
    expect(new Set(moreApproachManifest.problems.map((entry) => entry.id)).size).toBe(127);
    let authored = 0;
    let adapted = 0;
    for (const entry of moreApproachManifest.problems) {
      expect(catalogIds.has(entry.id), entry.id).toBe(true);
      expect(priorIds.has(entry.id), entry.id).toBe(false);
      const reference = (await loadProblemReference(entry.id))!;
      const approaches = getProblemApproaches(reference);
      expect(approaches).toHaveLength(2);
      expect(approaches[0].approach, entry.id).toBe(entry.default);
      expect(approaches[0].code.cpp, entry.id).toBeTruthy();
      const alternative = approaches[1];
      expect(alternative.approach, entry.id).toBe(entry.alternatives[0].approach);
      expect(alternative.code.python.trim(), entry.id).not.toBe(reference.code.python.trim());
      expect(alternative.code.cpp, entry.id).toBeUndefined();
      for (const section of ["How it works", "Steps", "Complexity"]) {
        expect(alternative.explanation, entry.id).toContain(`### ${section}`);
      }
      expect(alternative.explanationAuthor, entry.id).toBe("LC Tracker");
      expect(alternative.code.python, entry.id).not.toContain("sortedcontainers");
      expect(alternative.code.python, entry.id).not.toContain("eval(");
      if (entry.alternatives[0].kind === "authored") {
        expect(alternative.codeAuthor, entry.id).toBe("LC Tracker");
        expect(alternative.sourceUrl, entry.id).toBe(reference.sourceUrl);
        expect(alternative.licenseUrl, entry.id).toBe(reference.licenseUrl ?? "/neetcode-license.txt");
        authored++;
      } else {
        expect(alternative.codeAuthor, entry.id).toBeUndefined();
        expect(alternative.sourceName, entry.id).toBe("walkccc / Peng-Yu Chen");
        expect(alternative.sourceUrl, entry.id).toContain(`/blob/${moreApproachManifest.sourceRevision}/`);
        expect(alternative.licenseUrl, entry.id).toBe("/walkccc-license.txt");
        adapted++;
      }
    }
    expect(authored).toBe(117);
    expect(adapted).toBe(10);
  });
  it("adds 120 previously uncovered catalog problems with complete, distinct approaches", async () => {
    const catalog = await ensureExtendedCatalogLoaded();
    const catalogById = new Map(catalog.map((problem) => [problem.id, problem]));
    const previousIds = new Set([...approachManifest.problems, ...extendedApproachManifest.problems, ...moreApproachManifest.problems, ...manifest.references].map((entry) => entry.id));
    expect(catalogApproachManifest.problems).toHaveLength(120);
    expect(catalogApproachManifest.problems.filter((entry) => entry.difficulty === "Medium")).toHaveLength(87);
    expect(catalogApproachManifest.problems.filter((entry) => entry.difficulty === "Easy")).toHaveLength(33);
    let authored = 0;
    for (const entry of catalogApproachManifest.problems) {
      expect(catalogById.has(entry.id), entry.id).toBe(true);
      expect(previousIds.has(entry.id), entry.id).toBe(false);
      const reference = (await loadProblemReference(entry.id))!;
      const approaches = getProblemApproaches(reference);
      expect(approaches).toHaveLength(2);
      expect(reference.approach, entry.id).toBe(entry.default);
      expect(reference.code.cpp, entry.id).toMatch(/class |struct /);
      expect(reference.videoUrl, entry.id).toBe(catalogById.get(entry.id)!.videoUrl);
      const alternative = approaches[1];
      expect(alternative.approach, entry.id).toBe(entry.alternative.approach);
      expect(alternative.code.cpp, entry.id).toBeUndefined();
      expect(alternative.code.python.trim(), entry.id).not.toBe(reference.code.python.trim());
      for (const approach of approaches) {
        for (const section of ["How it works", "Steps", "Complexity"]) {
          expect(approach.explanation, entry.id).toContain(`### ${section}`);
        }
        expect(approach.code.python, entry.id).toContain("class ");
        expect(approach.code.python, entry.id).not.toContain("sortedcontainers");
        expect(approach.code.python, entry.id).not.toContain("eval(");
        expect(approach.sourceUrl, entry.id).toContain(catalogApproachManifest.revision);
        expect(approach.sourceName, entry.id).toBe("walkccc / Peng-Yu Chen");
        expect(approach.licenseUrl, entry.id).toBe("/walkccc-license.txt");
        expect(approach.explanationAuthor, entry.id).toBe("LC Tracker");
      }
      if (entry.alternative.kind === "authored") {
        expect(alternative.codeAuthor, entry.id).toBe("LC Tracker");
        expect(alternative.sourceUrl, entry.id).toBe(reference.sourceUrl);
        authored++;
      } else {
        expect(alternative.codeAuthor, entry.id).toBeUndefined();
        expect(alternative.sourceUrl, entry.id).toContain(`/blob/${catalogApproachManifest.revision}/`);
      }
    }
    expect(authored).toBe(108);
  });
  it("provides coherent Python/C++ references for the supported extended catalog", async () => {
    const catalog = await ensureExtendedCatalogLoaded();
    const supported = catalog.filter((problem) => hasProblemReference(problem.id));
    expect(supported).toHaveLength(706);
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
