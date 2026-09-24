import reinsMark from "@/assets/brand/reins-mark.webp";

export function BrandMark({ size }: { size: number }) {
  return (
    <img
      src={reinsMark}
      alt=""
      aria-hidden
      width={size}
      height={size}
      decoding="async"
      className="block shrink-0"
    />
  );
}
