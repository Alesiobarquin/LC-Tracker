export type ReferenceLanguage = "python" | "cpp";
export interface ProblemReference {
  problemId: string;
  approach: string;
  explanation: string;
  code: Record<ReferenceLanguage, string>;
  videoUrl: string;
  sourceUrl: string;
  sourceName?: string;
  licenseUrl?: string;
  explanationAuthor?: string;
}

// Load only the requested solution, after retrieval or an explicit library visit.
const references = import.meta.glob<ProblemReference>(
  "./problemReferences/*.json",
  { import: "default" },
);
export function hasProblemReference(problemId: string) {
  return `./problemReferences/${problemId}.json` in references;
}
export async function loadProblemReference(
  problemId: string,
): Promise<ProblemReference | null> {
  const load = references[`./problemReferences/${problemId}.json`];
  return load ? load() : null;
}
