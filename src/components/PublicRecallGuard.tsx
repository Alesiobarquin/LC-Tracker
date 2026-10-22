export function PublicRecallGuard({ problemId }: { problemId: string }) {
  return <div className="public-recall-message mx-auto max-w-3xl px-5 py-8 space-y-4" role="status">
    <p>Your recall check is in progress. Write your attempt before revealing the explanation.</p>
    <a className="text-accent" href={`/recall/${encodeURIComponent(problemId)}`}>Resume recall check</a>
  </div>;
}
