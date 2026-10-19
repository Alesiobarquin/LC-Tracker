import { allProblems, ensureExtendedCatalogLoaded } from '../data/problems';
import { hasProblemReference } from '../data/problemReferences';

export async function getReferenceProblems() {
  await ensureExtendedCatalogLoaded();
  return allProblems.filter(problem => hasProblemReference(problem.id))
    .sort((a, b) => a.title.localeCompare(b.title, 'en') || a.id.localeCompare(b.id, 'en'));
}
