import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode, useId } from "react";
import { Link } from "react-router";
import { cx } from "@/lib/cx";

export function Panel({
  title,
  description,
  link,
  className,
  children,
}: {
  title: string;
  description?: string;
  link?: { readonly href: string; readonly label: string };
  className?: string;
  children: ReactNode;
}) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={cx("glass flex flex-col rounded-[24px] p-5 sm:p-6", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="text-[17px] font-medium tracking-[-0.005em]">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {link && (
          <Link
            to={link.href}
            className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            {link.label}
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={15}
              strokeWidth={1.9}
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          </Link>
        )}
      </div>
      <div className="mt-5 flex-1">{children}</div>
    </section>
  );
}
