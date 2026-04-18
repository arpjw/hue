interface HueDotsProps {
  size?: number;
}

export default function HueDots({ size = 8 }: HueDotsProps) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="rounded-full bg-hue-rose inline-block"
        style={{ width: size, height: size }}
      />
      <span
        className="rounded-full bg-hue-sage inline-block"
        style={{ width: size, height: size }}
      />
      <span
        className="rounded-full bg-hue-lav inline-block"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
