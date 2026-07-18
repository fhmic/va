export function MessageBubble({ role, content }: { role: "user" | "mentor"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
          isUser ? "bg-brand-600 text-white" : "bg-white text-slate-900 border border-slate-200"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
