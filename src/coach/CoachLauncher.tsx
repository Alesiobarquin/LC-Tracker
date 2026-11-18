import type { ButtonHTMLAttributes } from "react";
import { MessageCircleMore } from "lucide-react";
import { useCoachOpen } from "./commands";

export { MessageCircleMore as CoachIcon };
export const COACH_SHORTCUT = "Alt+Shift+C";

export function CoachLauncher({ onClick, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const open = useCoachOpen();
  return (
    <button
      type="button"
      aria-label={typeof children === "string" ? children : undefined}
      aria-keyshortcuts={COACH_SHORTCUT}
      title={`Study chat (${COACH_SHORTCUT})`}
      {...props}
      onClick={event => {
        onClick?.(event);
        if (!event.defaultPrevented) open();
      }}
    >
      <MessageCircleMore size={17} aria-hidden="true" />
      {children}
    </button>
  );
}
