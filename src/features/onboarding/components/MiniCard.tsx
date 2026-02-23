interface MiniCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MiniCard({
  children,
  className = "",
  style = {},
}: MiniCardProps) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-lg ${className}`}
      style={{ border: "1px solid #ede9e4", ...style }}
    >
      {children}
    </div>
  );
}
