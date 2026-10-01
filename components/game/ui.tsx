import Link from "next/link";
import { Star } from "lucide-react";
import { formatCoins } from "@/lib/format";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function CoinPill({ amount, label = "Town wallet" }: { amount: number; label?: string }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sun px-3 py-1 text-sm font-extrabold text-ink">
      <span aria-hidden="true">●</span>
      <span>
        {label}: <span className="sr-only">fictional </span>
        {formatCoins(amount)}
      </span>
    </p>
  );
}

export function StarRow({ stars, of = 3 }: { stars: number; of?: number }) {
  return (
    <span className="inline-flex gap-1" role="img" aria-label={`${stars} of ${of} stars`}>
      {Array.from({ length: of }, (_, index) => {
        const filled = index < stars;
        return (
          <Star
            key={index}
            aria-hidden="true"
            className={cn("h-5 w-5", filled ? "fill-sun text-ink" : "text-line")}
          />
        );
      })}
    </span>
  );
}

type ActionProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "quiet";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

const variants = {
  primary: "bg-sun text-ink border-ink shadow-[0_4px_0_#241c33] hover:translate-y-0.5 hover:shadow-[0_2px_0_#241c33]",
  secondary: "bg-paper text-ink border-ink",
  quiet: "bg-transparent text-ink border-transparent underline-offset-4 hover:underline",
};

export function Action({ children, href, onClick, variant = "primary", type = "button", disabled, className }: ActionProps) {
  const classes = cn(
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 px-5 py-2 text-center text-base font-extrabold transition",
    variants[variant],
    disabled && "cursor-not-allowed opacity-50 shadow-none hover:translate-y-0",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-bold text-ink-soft">
        <span>{label}</span>
        <span>{safe}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#f3e2c8]" role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-leaf" style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}
