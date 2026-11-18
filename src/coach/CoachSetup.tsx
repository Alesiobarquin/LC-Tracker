import { useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { useCoachAccess, useCoachConnection } from "./connection";
import { FREE_QUESTIONS_PER_DAY, personalProviderInfo, personalProviders, validCoachKey, type PersonalProvider } from "./protocol";

export function CoachSetup() {
  const { personal, setPersonal } = useCoachConnection();
  const { data: access } = useCoachAccess();
  const inputId = useId();
  const keyInput = useRef<HTMLInputElement>(null);
  const [provider, setProvider] = useState<PersonalProvider>("openrouter");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const selected = personalProviderInfo[personal?.provider ?? provider];
  const available = provider === "openrouter" || access?.nativeKeys;

  if (personal) {
    return (
      <div className="space-y-3 text-sm">
        <p role="status" className="font-medium text-foreground">{selected.label} key added for this tab</p>
        <p className="text-muted">Your provider bills for AI questions. Disconnect here to clear the key and conversation.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => { setPersonal(null); setConsent(false); }}>Disconnect {selected.label}</Button>
          <a className="text-accent underline" href={selected.keysUrl} target="_blank" rel="noreferrer">Manage {selected.label} keys</a>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-3 text-sm text-body" autoComplete="off" onSubmit={event => {
      event.preventDefault();
      const key = keyInput.current?.value.trim() ?? "";
      if (!available || !consent || !validCoachKey(provider, key)) {
        setError(`Enter a valid ${selected.label} API key and confirm what will be shared.`);
        return;
      }
      if (keyInput.current) keyInput.current.value = "";
      setError("");
      setPersonal({ provider, key });
    }}>
      {access?.hosted === "free" && <p className="text-muted">Free AI includes {FREE_QUESTIONS_PER_DAY} questions per day.</p>}
      {access?.hosted === "owner" && <p className="text-muted">Owner AI is available with no daily allowance.</p>}
      <h3 className="font-medium text-foreground">Use your own API key</h3>
      <p className="text-muted">AI questions use your provider’s balance. Your key lasts until you refresh or disconnect.</p>
      <div className="space-y-1">
        <label className="font-medium text-foreground" htmlFor={`${inputId}-provider`}>Provider</label>
        <div className="relative">
          <Select id={`${inputId}-provider`} value={provider} onChange={event => {
            setProvider(event.currentTarget.value as PersonalProvider);
            setConsent(false);
            setError("");
            if (keyInput.current) keyInput.current.value = "";
          }}>
            {personalProviders.map(value => (
              <option key={value} value={value} disabled={value !== "openrouter" && !access?.nativeKeys}>
                {personalProviderInfo[value].label}
              </option>
            ))}
          </Select>
          <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="font-medium text-foreground" htmlFor={inputId}>{selected.label} API key</label>
        <Input id={inputId} ref={keyInput} type="password" maxLength={255} autoComplete="off" required spellCheck={false} />
      </div>
      <p className="text-muted">
        <a className="text-accent underline" href={selected.keysUrl} target="_blank" rel="noreferrer">Create {provider === "openrouter" ? "an" : "a"} {selected.label} API key</a>
        {provider === "gemini" ? " in a billing-enabled project. Google can use unpaid API requests to improve products."
          : provider === "claude" ? " scoped to a Claude Console workspace."
          : " with a spending limit. Study Chat uses GPT-4.1 Nano through OpenRouter."}
      </p>
      <label className="flex items-start gap-2">
        <input type="checkbox" className="mt-1 accent-accent" checked={consent} onChange={event => setConsent(event.currentTarget.checked)} required />
        <span>I agree to share my messages, recent chat context, and selected study facts with {selected.recipient}.
          {provider === "gemini" && " I’m using a billing-enabled project."}</span>
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button size="sm" type="submit" disabled={!available || !consent}>Connect {selected.label}</Button>
    </form>
  );
}
