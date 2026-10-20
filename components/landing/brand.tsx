import Image from "next/image";

export default function Brand({
  href = "/",
  priority = false,
}: {
  href?: string;
  priority?: boolean;
}) {
  return (
    <a href={href} className="brand" aria-label="OhioismQuant home">
      <Image
        className="brand-logo"
        src="/ohioismquant-logo.png"
        alt="OhioismQuant logo"
        width={48}
        height={48}
        priority={priority}
        unoptimized
      />
      <span>
        ohioism<span className="brand-secondary">quant</span>
        <span className="brand-by">TRADERS & BUILDERS</span>
      </span>
    </a>
  );
}
