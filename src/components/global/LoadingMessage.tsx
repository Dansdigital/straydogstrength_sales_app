import { Loader2 } from "lucide-react";

export default function LoadingMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className="w-4 h-4 animate-spin" />
      <p className="ml-2">{message}</p>
    </div>
  );
}
