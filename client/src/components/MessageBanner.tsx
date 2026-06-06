interface MessageBannerProps {
  type: "success" | "error" | "info";
  text: string;
}

const BG_COLORS: Record<string, string> = {
  success: "rgba(46,204,113,0.15)",
  error: "rgba(231,76,60,0.15)",
  info: "rgba(52,152,219,0.15)",
};

const TEXT_COLORS: Record<string, string> = {
  success: "var(--green)",
  error: "var(--red)",
  info: "var(--blue)",
};

export default function MessageBanner({ type, text }: MessageBannerProps) {
  return (
    <div style={{
      background: BG_COLORS[type],
      color: TEXT_COLORS[type],
      padding: "0.75rem",
      borderRadius: "8px",
      marginBottom: "1rem",
      textAlign: "center",
      fontSize: "0.95rem",
      fontWeight: 600,
    }}>
      {text}
    </div>
  );
}