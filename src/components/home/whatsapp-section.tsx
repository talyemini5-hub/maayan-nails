import { MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { whatsAppGeneralInquiry } from "@/lib/whatsapp";

export function WhatsAppSection() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="flex flex-col items-center text-center gap-4">
        <MessageCircle className="size-8 text-[#25D366]" aria-hidden />
        <h2 className="font-brand text-2xl sm:text-3xl">יש שאלה? כתבי לנו בוואטסאפ</h2>
        <p className="text-charcoal-soft max-w-sm">נשמח לעזור עם כל שאלה על טיפולים, מחירים או התאמת עיצוב.</p>
        <WhatsAppButton message={whatsAppGeneralInquiry()} label="פתיחת וואטסאפ" />
      </Container>
    </section>
  );
}
