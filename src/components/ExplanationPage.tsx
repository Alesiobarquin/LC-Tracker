import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useRegisterCoachTools } from "../coach/commands";
import { ensureExtendedCatalogLoaded, problemMap } from "../data/problems";
import { useProblemProgress } from "../hooks/useUserData";
import { useStore } from "../store/useStore";
import { parsePersonalExplanation } from "../utils/personalExplanation";
import {
  ProblemExplanation,
  ExplanationLinks,
  ExplanationText,
} from "./ProblemExplanation";
import { ReferenceCode } from "./ReferenceCode";
import { PageHeader } from "./ui";

export function ExplanationPage() {
  const { problemId } = useParams();
  const problem = problemId ? problemMap[problemId] : undefined;
  const { progress } = useProblemProgress();
  const activeRecall = useStore((state) => state.activeRecall);
  const [personal, setPersonal] = useState(true);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setCatalogReady(false);
    setCatalogError(false);
    if (!problemId || problemMap[problemId]) {
      setCatalogReady(true);
      return;
    }
    void ensureExtendedCatalogLoaded()
      .then(() => {
        if (!cancelled) setCatalogReady(true);
      })
      .catch(() => {
        if (!cancelled) setCatalogError(true);
      });
    return () => { cancelled = true; };
  }, [problemId]);

  const notes = problem ? progress[problem.id]?.notes : undefined;
  const awaitingRecall = Boolean(problem && activeRecall?.problemId === problem.id && !activeRecall.revealed);
  useRegisterCoachTools(problem && !awaitingRecall ? {
    explanation_set_reference: {
      description: "Switch between the current problem's personal or built-in explanation. Provide source (personal or built_in) and optional matching problemId.",
      run: (args) => {
        const input = z.strictObject({
          source: z.enum(["personal", "built_in"]), problemId: z.string().refine((id) => id === problem.id).optional(),
        }).safeParse(args);
        if (!input.success || (input.data.source === "personal" && !notes)) return { message: "That explanation source is unavailable." };
        setPersonal(input.data.source === "personal");
        return { message: input.data.source === "personal" ? "Your saved explanation is displayed." : "The built-in explanation is displayed." };
      },
    },
  } : {});
  if (!problem && catalogError)
    return (
      <div role="alert">
        Could not load the problem catalog.{" "}
        <button className="quiet-action" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  if (!problem && !catalogReady)
    return <p role="status">Loading problem…</p>;
  if (!problem)
    return (
      <p>
        This explanation isn’t available.{" "}
        <Link className="text-accent" to="/library">
          Open library
        </Link>
      </p>
    );
  if (awaitingRecall)
    return (
      <div className="premium-card p-6 space-y-4">
        <p>
          Your recall check is in progress. Write your attempt before revealing
          the explanation.
        </p>
        <Link className="text-accent" to={`/recall/${problem.id}`}>
          Resume recall check
        </Link>
      </div>
    );
  const custom = parsePersonalExplanation(notes ?? "");
  return (
    <div className="recall-workspace mx-auto space-y-6 pb-12">
      <Link
        to="/library"
        className="inline-flex gap-2 items-center text-muted text-sm"
      >
        <ArrowLeft size={14} /> Problem library
      </Link>
      <PageHeader
        title={problem.title}
        description="Explanation and code example"
      />
      <Link to="/library/explanations" className="inline-flex text-sm text-accent hover:underline">
        Browse all problem explanations
      </Link>
      {notes && (
        <div className="reference-switch" aria-label="Explanation source">
          <button
            className="quiet-action"
            aria-pressed={personal}
            onClick={() => setPersonal(true)}
          >
            My explanation
          </button>
          <button
            className="quiet-action"
            aria-pressed={!personal}
            onClick={() => setPersonal(false)}
          >
            Built-in explanation
          </button>
        </div>
      )}
      {notes && personal ? (
        <div className="space-y-4">
          <h2 className="text-lg text-foreground">Your saved explanation</h2>
          <ExplanationText>{custom.explanation}</ExplanationText>
          {custom.code && (
            <ReferenceCode code={custom.code} language={custom.language} />
          )}
          <Link className="text-sm text-accent" to={`/recall/${problem.id}`}>
            Edit your explanation during a recall check
          </Link>
        </div>
      ) : (
        <ProblemExplanation problem={problem} />
      )}
      <ExplanationLinks problem={problem} />
    </div>
  );
}
