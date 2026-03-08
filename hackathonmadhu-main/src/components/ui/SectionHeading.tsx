import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-14 md:mb-20",
        align === "center" && "text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="mb-4 inline-flex rounded-full border border-[#d8f8b0]/20 bg-[#d8f8b0]/8 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#dff8bc]">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-5 max-w-2xl text-base leading-8 text-white/70 md:text-lg",
            align === "center" ? "mx-auto" : "mx-0"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
