import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { getBusinessSettings } from "@/lib/data/business-settings";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { businessInfo } = await getBusinessSettings();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter business={businessInfo} />
      <MobileBottomNav />
    </>
  );
}
