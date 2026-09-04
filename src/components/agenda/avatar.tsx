import { cn } from "@/lib/utils";
import { initials } from "@/lib/contacts/format";

type AvatarProps = {
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "size-10 text-sm",
  md: "size-12 text-base",
  lg: "size-24 text-3xl",
};

export function Avatar({ firstName, lastName, size = "md", className }: AvatarProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-surface font-display font-medium tracking-tight text-accent shadow-[var(--shadow-card)]",
        sizeClass[size],
        className,
      )}
    >
      {initials({ firstName, lastName })}
    </div>
  );
}
