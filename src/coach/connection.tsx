import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadCoachAccess } from "./provider";
import type { PersonalConnection } from "./protocol";

export const COACH_FIXTURE_MODE = import.meta.env.MODE === "e2e";
export const COACH_SETUP_SECTION = "section-study-chat";
export const COACH_SETUP_PATH = `/settings#${COACH_SETUP_SECTION}`;

const Connection = createContext({
  owner: "",
  personal: null as PersonalConnection | null,
  setPersonal: (_connection: PersonalConnection | null) => {},
});

export function CoachConnection({ children, owner }: { children: ReactNode; owner: string }) {
  const [personal, setPersonal] = useState<PersonalConnection | null>(null);
  return <Connection.Provider value={{ owner, personal, setPersonal }}>{children}</Connection.Provider>;
}

export function useCoachConnection() {
  return useContext(Connection);
}

export function useCoachAccess() {
  const { owner } = useCoachConnection();
  return useQuery({
    queryKey: ["coach-access", owner],
    queryFn: loadCoachAccess,
    enabled: Boolean(owner),
    staleTime: 60_000,
    retry: false,
    refetchInterval: false,
  });
}
