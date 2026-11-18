import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Maximize2, Settings2, X } from "lucide-react";
import { z } from "zod";
import { isAdminUser } from "../utils/adminAuth";
import { useStore } from "../store/useStore";
import { CoachCommands, useRegisterCoachTools, type CoachArgs, type CoachTools } from "./commands";
import { TodayCoach } from "./TodayCoach";
import { activePracticePath } from "../hooks/useTodayPlan";
import { CoachIcon, COACH_SHORTCUT } from "./CoachLauncher";
import { CoachConnection, COACH_SETUP_PATH } from "./connection";

const CoachPanel = lazy(() => import("./CoachPanel").then(module => ({ default: module.CoachPanel })));
const screens = {
  today: "/dashboard", library: "/library", patterns: "/patterns", evidence: "/analytics",
  syntax: "/syntax", settings: "/settings", study_plan: "/study-plan", explanations: "/library/explanations",
  chat: "/coach", admin: "/admin",
};

function WorkspaceNavigation({ admin }: { admin: boolean }) {
  const navigate = useNavigate();
  useRegisterCoachTools({
    open_screen: {
      description: `Open a workspace screen. screen: today, library, patterns, evidence, syntax, settings, study_plan, explanations, chat${admin ? ", admin" : ""}.`,
      run: args => {
        const input = z.strictObject({ screen: z.enum(Object.keys(screens) as (keyof typeof screens)[]) }).safeParse(args);
        if (!input.success || (input.data.screen === "admin" && !admin)) return { message: "That screen is unavailable." };
        navigate(screens[input.data.screen]);
        return { message: `Opened ${input.data.screen.replace("_", " ")}.` };
      },
    },
  });
  return null;
}

export function CoachHost({ owner, user, children }: {
  owner: string;
  user: Parameters<typeof isAdminUser>[0];
  children: ReactNode;
}) {
  const location = useLocation();
  const { pathname } = location;
  const fullPage = /^\/coach\/?$/.test(pathname);
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);
  const [surface] = useState(() => document.createElement("div"));
  const tools = useRef<CoachTools>({});
  const navigate = useNavigate();
  const route = useRef(pathname);
  route.current = pathname;
  const launcher = useRef<HTMLElement | null>(null);
  const show = useCallback(() => {
    launcher.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setUsed(true);
    setOpen(true);
  }, []);
  const previousPage = useRef("/dashboard");
  const close = useCallback(() => {
    setOpen(false);
    if (fullPage) navigate(previousPage.current);
    else if (launcher.current?.isConnected) launcher.current.focus({ preventScroll: true });
  }, [fullPage, navigate]);
  const mounted = used || fullPage;
  const visible = fullPage || open;
  const admin = isAdminUser(user);
  const codingId = useStore(state => state.activeSession?.id);
  const recallId = useStore(state => state.activeRecall?.id);
  async function runOnPage(command: string, args: CoachArgs, destination: string, sessionId?: string): Promise<unknown> {
    const from = route.current;
    if (from !== destination) navigate(destination);
    for (let attempts = 0; attempts < 40; attempts++) {
      const store = useStore.getState();
      if (store.sessionUserId !== owner || (sessionId && sessionId !== (store.activeSession ?? store.activeRecall)?.id)) break;
      if (route.current !== from && route.current !== destination) break;
      if (route.current === destination && Object.hasOwn(tools.current, command)) return tools.current[command].run(args);
      await new Promise(resolve => window.setTimeout(resolve, 50));
    }
    return { message: "The workspace opened. Wait for its data, then try the action again." };
  }
  const fallback: CoachTools = {
    workspace_command: {
      description: "Run a tool on another page. Use {command, args}. Library: library_read/filter/sort/start/open_explanation/report_solve/remove_progress/copy_solved. Settings: settings_read/update/prepare_time_targets/save_time_targets/set_break/set_interview/add_event/remove_event/theme/sync_leetcode/export_backup/restore_backup. Patterns: patterns_read/open. Syntax: syntax_reference, action status/search/due/start. Evidence: evidence_history." +
        (admin ? " Admin feedback tools are available after opening the authorized admin workspace." : ""),
      run: async raw => {
        const parsed = z.strictObject({
          command: z.string().max(60),
          args: z.record(z.string(), z.unknown()).optional(),
        }).safeParse(raw);
        if (!parsed.success) return { message: "Specify a workspace command and its arguments." };
        const { command, args = {} } = parsed.data;
        const slug = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,120}$/.test(value) ? value : null;
        const patternId = slug(args.patternId);
        const problemId = slug(args.problemId);
        const destination = /^library_[a-z_]+$/.test(command) ? "/library" :
          /^settings_[a-z_]+$/.test(command) ? "/settings" :
          /^patterns_[a-z_]+$/.test(command) ? "/patterns" :
          /^explanations_[a-z_]+$/.test(command) ? "/library/explanations" :
          /^lesson_[a-z_]+$/.test(command) && patternId ? `/patterns/${patternId}` :
          /^explanation_[a-z_]+$/.test(command) && problemId ? `/library/${problemId}/explanation` :
          command === "syntax_reference" ? "/syntax" :
          command === "evidence_history" ? "/analytics" :
          /^feedback_[a-z_]+$/.test(command) ? "/dashboard" : null;
        if (!destination) return { message: "Open the corresponding workspace to use that control." };
        return runOnPage(command, args, destination);
      },
    },
  };
  if (codingId || recallId) {
    const id = (codingId ?? recallId)!;
    const kind = codingId ? "coding" : "recall";
    for (const suffix of ["session", "status"]) {
      const name = `${kind}_${suffix}`;
      fallback[name] = {
        description: `Open and use the active ${kind} session's ${suffix} control.`,
        duringPractice: true,
        run: args => {
          const live = useStore.getState();
          const destination = activePracticePath();
          if (destination && (live.activeSession ?? live.activeRecall)?.id === id && (args.sessionId === undefined || args.sessionId === id)) {
            return runOnPage(name, args, destination, id);
          }
          return { message: "That session changed. Ask again about the current session." };
        },
      };
    }
  }

  useEffect(() => {
    if (fullPage) setUsed(true);
  }, [fullPage]);
  useEffect(() => {
    const toggle = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat || event.code !== "KeyC" ||
          !event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;
      const dialog = document.activeElement?.closest('[aria-modal="true"]');
      if (!visible && dialog && !dialog.querySelector(`[aria-keyshortcuts="${COACH_SHORTCUT}"]`)) return;
      event.preventDefault();
      event.stopPropagation();
      if (visible) close();
      else show();
    };
    window.addEventListener("keydown", toggle, true);
    return () => window.removeEventListener("keydown", toggle, true);
  }, [close, show, visible]);
  useLayoutEffect(() => {
    if (!mounted) return;
    const outlet = fullPage ? document.getElementById("coach-page") : document.body;
    outlet?.append(surface);
    const observer = new MutationObserver(() => {
      const page = document.getElementById("coach-page");
      if (page) {
        page.append(surface);
        observer.disconnect();
      }
    });
    if (!outlet) observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); surface.remove(); };
  }, [mounted, fullPage, surface]);

  const Title = fullPage ? "h1" : "h2";
  return (
    <CoachConnection>
      <CoachCommands open={show} fallback={fallback} lookup={tools}>
        {children}
        <WorkspaceNavigation admin={admin} />
        {mounted && createPortal(
          <aside
            hidden={!visible}
            aria-label="Study chat"
            className={`${visible ? "flex" : "hidden"} flex-col overflow-hidden rounded-lg border border-line bg-surface ${fullPage
              ? "mx-auto h-[min(76dvh,50rem)] min-h-72 w-full max-w-3xl"
              : "fixed inset-x-2 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[80] mx-auto h-[min(72dvh,38rem)] max-w-md shadow-lg sm:inset-x-auto sm:right-6 sm:w-[27rem] lg:bottom-6"}`}
            onKeyDown={event => {
              event.stopPropagation();
              if (event.key === "Escape" && !fullPage) {
                event.preventDefault();
                close();
              }
            }}
          >
            <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-line px-4">
              <CoachIcon size={20} className="shrink-0 text-accent" aria-hidden="true" />
              <Title className={`mr-auto font-semibold text-foreground ${fullPage ? "text-lg" : "text-sm"}`}>Study chat</Title>
              <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-subtle sm:inline">{COACH_SHORTCUT}</kbd>
              {pathname !== "/onboarding" && <Link
                to={COACH_SETUP_PATH}
                aria-label="Study chat settings"
                title="Study chat settings"
                className="workspace-tool shrink-0"
                onClick={() => setOpen(false)}
              >
                <Settings2 size={16} aria-hidden="true" />
              </Link>}
              {!fullPage && <Link
                to="/coach"
                aria-label="Open full chat"
                title="Open full chat"
                className="workspace-tool shrink-0"
                onClick={() => {
                  previousPage.current = pathname + location.search + location.hash;
                  setOpen(false);
                }}
              >
                <Maximize2 size={15} aria-hidden="true" />
              </Link>}
              <button type="button" className="workspace-tool shrink-0" aria-label="Close study chat" title="Close study chat" onClick={close}>
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <Suspense fallback={<p role="status" className="p-4 text-sm text-muted">Loading study chat…</p>}>
              <CoachPanel owner={owner} visible={visible}>
                <TodayCoach visible={visible} />
              </CoachPanel>
            </Suspense>
          </aside>,
          surface,
        )}
      </CoachCommands>
    </CoachConnection>
  );
}
