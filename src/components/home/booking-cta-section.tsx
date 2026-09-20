import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function BookingCtaSection() {
  return (
    <section id="booking" className="py-20 sm:py-24 bg-burgundy text-ivory">
      <Container className="text-center">
        <h2 className="font-brand text-3xl sm:text-4xl mb-4">מוכנה לפינוק?</h2>
        <p className="text-ivory/85 max-w-md mx-auto mb-8">
          קביעת תור אונליין לוקחת פחות מדקה — בחרי טיפול, תאריך ושעה שנוחים לך.
        </p>
        <Button href="/appointments/new" size="lg" className="!bg-ivory !text-burgundy hover:!bg-cream">
          קביעת תור
        </Button>
      </Container>
    </section>
  );
}
