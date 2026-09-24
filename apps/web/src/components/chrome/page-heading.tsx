import type { ReactNode } from "react";

export function PageHeading({
  title,
  accent,
  description,
  aside,
}: {
  title: string;
  accent?: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-[clamp(36px,3.6vw,52px)] leading-[1.1] font-normal tracking-[-0.015em] [font-stretch:90%]">
          {title}
          {accent && <span className="font-serif text-accent italic"> {accent}</span>}
        </h1>
        <p className="text-base leading-relaxed font-light text-muted">{description}</p>
      </div>
      {aside}
    </div>
  );
}
