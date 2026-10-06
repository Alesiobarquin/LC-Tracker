/** Fetch every page without relying on the project's PostgREST row cap. */
export async function fetchAllPages<T>(
  read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 500
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ;) {
    const { data, error } = await read(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    // A project may cap responses below our requested range. A short page does
    // not prove completion; continue from the actual number of returned rows.
    if (page.length === 0) return rows;
    offset += page.length;
  }
}
