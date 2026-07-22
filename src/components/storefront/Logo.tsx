import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white font-display font-extrabold text-base">
        A²
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="font-display font-extrabold text-[15px] leading-none tracking-tight text-foreground">
          A Square
        </span>
        <span className="text-[10px] font-medium leading-none tracking-[0.2em] text-primary-700 uppercase">
          Agro Inputs
        </span>
      </span>
    </Link>
  );
}
