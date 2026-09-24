import { BrandMark } from "@/components/brand/brand-mark";

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.01em] text-ink">
      <BrandMark size={26} />
      Reins
    </span>
  );
}
