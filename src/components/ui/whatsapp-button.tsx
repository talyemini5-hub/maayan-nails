import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WhatsAppButton({ message, label = "וואטסאפ" }: { message: string; label?: string }) {
  const url = `https://wa.me/972523298003?text=${encodeURIComponent(message)}`;
  return (
    <Button href={url} target="_blank" rel="noopener noreferrer" variant="whatsapp">
      <MessageCircle className="size-5" aria-hidden />
      {label}
    </Button>
  );
}
