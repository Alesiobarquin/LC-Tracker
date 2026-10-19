export type ReferenceLanguage = "python" | "cpp";
export interface ProblemApproach {
  id: string;
  approach: string;
  explanation: string;
  code: { python: string; cpp?: string };
  sourceUrl: string;
  sourceName?: string;
  licenseUrl?: string;
  explanationAuthor?: string;
  codeAuthor?: string;
}
export interface ProblemReference extends Omit<ProblemApproach, "id" | "code"> {
  problemId: string;
  code: Record<ReferenceLanguage, string>;
  videoUrl: string;
  alternatives?: ProblemApproach[];
}

export function getProblemApproaches(reference: ProblemReference): ProblemApproach[] {
  return [{ ...reference, id: "default" }, ...(reference.alternatives ?? [])];
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
