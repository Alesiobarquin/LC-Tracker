import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type CoachArgs = Record<string, unknown>;
export type CoachAction = { label: string; name: string; args?: CoachArgs };
export type CoachToolResult = {
  message: string;
  data?: unknown;
  modelData?: unknown;
  actions?: CoachAction[];
};
export type CoachTool = {
  description: string;
  kind?: "read" | "action";
  duringPractice?: boolean;
  live?: CoachToolResult;
  available?: (args: CoachArgs) => boolean;
  revision?: string;
  run: (args: CoachArgs) => unknown | Promise<unknown>;
};
export type CoachTools = Record<string, CoachTool>;

type Registration = (tools: CoachTools) => () => void;
const RegisteredTools = createContext<Registration | null>(null);
const ToolSnapshot = createContext<CoachTools>({});
const OpenCoach = createContext<() => void>(() => {});
export const useCoachOpen = () => useContext(OpenCoach);
export const useCoachTools = () => useContext(ToolSnapshot);

export function CoachCommands({
  children, open, fallback, lookup,
}: {
  children: ReactNode;
  open: () => void;
  fallback: CoachTools;
  lookup: React.RefObject<CoachTools>;
}) {
  const [groups, setGroups] = useState<CoachTools[]>([]);
  const register = useMemo<Registration>(() => tools => {
    setGroups(current => [...current, tools]);
    return () => setGroups(current => current.filter(group => group !== tools));
  }, []);
  const registered = useMemo(() => Object.assign({}, ...groups) as CoachTools, [groups]);
  useLayoutEffect(() => {
    lookup.current = registered;
    return () => { lookup.current = {}; };
  }, [registered, lookup]);
  const tools = useMemo(() => ({ ...fallback, ...registered }), [fallback, registered]);
  return (
    <OpenCoach.Provider value={open}>
      <RegisteredTools.Provider value={register}>
        <ToolSnapshot.Provider value={tools}>{children}</ToolSnapshot.Provider>
      </RegisteredTools.Provider>
    </OpenCoach.Provider>
  );
}

export function useRegisterCoachTools(tools: CoachTools) {
  const register = useContext(RegisteredTools);
  const current = useRef(tools);
  useLayoutEffect(() => { current.current = tools; });
  const signature = JSON.stringify(Object.entries(tools).map(([name, tool]) =>
    [name, tool.description, tool.kind, tool.duringPractice, tool.live, tool.revision]));
  useLayoutEffect(() => {
    if (!register || !Object.keys(current.current).length) return;
    let mounted = true;
    const registered = Object.fromEntries(Object.entries(current.current).map(([name, tool]) => [
      name, {
        ...tool,
        available: (args: CoachArgs) => mounted && !!current.current[name] &&
          (current.current[name].available?.(args) ?? true),
        run: (args: CoachArgs) => {
          const handler = current.current[name];
          return mounted && handler
            ? handler.run(args)
            : { message: "This control is no longer available. Open the current screen and try again." };
        },
      },
    ]));
    const unregister = register(registered);
    return () => { mounted = false; unregister(); };
  }, [register, signature]);
}
