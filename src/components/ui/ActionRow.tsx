import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

interface ActionRowProps {
  title: string;
  description?: string;
  icon: ReactNode;
  onClick?: () => void;
  trailing?: ReactNode;
  disabled?: boolean;
}

export function ActionRow({
  title,
  description,
  icon,
  onClick,
  trailing,
  disabled = false,
}: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "focus-ring flex min-h-16 w-full items-center gap-3 px-5 py-4 text-left transition",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-white/[0.03] active:scale-[0.99]",
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-text-secondary">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-medium text-text-primary">{title}</p>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>

      {trailing ?? (
        <ChevronRight size={18} className="text-text-disabled" aria-hidden="true" />
      )}
    </button>
  );
}
