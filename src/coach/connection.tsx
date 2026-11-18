import { createContext, useContext, useState, type ReactNode } from "react";

export const COACH_FIXTURE_MODE = import.meta.env.MODE === "e2e";
export const COACH_SETUP_SECTION = "section-study-chat";
export const COACH_SETUP_PATH = `/settings#${COACH_SETUP_SECTION}`;

const Connection = createContext({ apiKey: "", setApiKey: (_key: string) => {} });

export function CoachConnection({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState("");
  return <Connection.Provider value={{ apiKey, setApiKey }}>{children}</Connection.Provider>;
}

export function useCoachConnection() {
  return useContext(Connection);
}
