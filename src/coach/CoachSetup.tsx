import { useId, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { useCoachConnection } from "./connection";

const keysUrl = "https://openrouter.ai/settings/keys";

export function CoachSetup() {
  const { apiKey, setApiKey } = useCoachConnection();
  const inputId = useId();
  const keyInput = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  if (apiKey) {
    return (
      <div className="space-y-3 text-sm">
        <p role="status" className="font-medium text-foreground">OpenRouter key added for this tab</p>
        <p className="text-muted">Disconnect here to clear the key and chat. You can revoke the key in OpenRouter.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => { setApiKey(""); setConsent(false); }}>Disconnect OpenRouter</Button>
          <a className="text-accent underline" href={keysUrl} target="_blank" rel="noreferrer">Manage OpenRouter keys</a>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-3 text-sm text-body" autoComplete="off" onSubmit={event => {
      event.preventDefault();
      const key = keyInput.current?.value.trim() ?? "";
      if (!/^sk-or-v1-[A-Za-z0-9_-]{10,190}$/.test(key) || !consent) {
        setError("Enter a valid OpenRouter API key and confirm what will be shared.");
        return;
      }
      if (keyInput.current) keyInput.current.value = "";
      setError("");
      setApiKey(key);
    }}>
      <p><a className="text-accent underline" href={keysUrl} target="_blank" rel="noreferrer">Create a spend-limited key in OpenRouter</a>. Custom questions use your OpenRouter balance. Reconnect after a page refresh.</p>
      <div className="space-y-1">
        <label className="font-medium text-foreground" htmlFor={inputId}>OpenRouter API key</label>
        <Input id={inputId} ref={keyInput} type="password" maxLength={200} autoComplete="off" placeholder="sk-or-v1-…" required spellCheck={false} />
      </div>
      <label className="flex items-start gap-2">
        <input type="checkbox" className="mt-1 accent-accent" checked={consent} onChange={event => setConsent(event.currentTarget.checked)} required />
        <span>I agree to send my messages, recent chat context, and selected facts such as problem titles, time spent, and reported outcomes to OpenRouter and Microsoft Azure.</span>
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button size="sm" type="submit" disabled={!consent}>Connect OpenRouter</Button>
    </form>
  );
}
