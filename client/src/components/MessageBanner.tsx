interface MessageBannerProps {
  type: "success" | "error" | "info";
  text: string;
}

const BG_CLASSES: Record<string, string> = {
  success: "bg-green/15",
  error: "bg-red/15",
  info: "bg-blue/15",
};

const TEXT_CLASSES: Record<string, string> = {
  success: "text-green",
  error: "text-red",
  info: "text-blue",
};

export default function MessageBanner({ type, text }: MessageBannerProps) {
  return (
    <div className={`${BG_CLASSES[type]} ${TEXT_CLASSES[type]} p-3 rounded-lg mb-4 text-center text-[0.95rem] font-semibold`}>
      {text}
    </div>
  );
}