import { supabase } from "@/integrations/supabase/client";

export interface TrackingScript {
  id: string;
  name: string;
  description: string;
  script_type: string;
  position: string;
  code: string;
  is_active: boolean;
  is_verified: boolean;
  last_verified_at: string | null;
  verification_method: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getTrackingScripts(activeOnly = false): Promise<TrackingScript[]> {
  let query = supabase
    .from("tracking_scripts" as any)
    .select("*")
    .order("sort_order");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as TrackingScript[];
}

export async function createTrackingScript(script: Partial<TrackingScript>): Promise<void> {
  const { error } = await supabase
    .from("tracking_scripts" as any)
    .insert(script as any);
  if (error) throw error;
}

export async function updateTrackingScript(id: string, updates: Partial<TrackingScript>): Promise<void> {
  const { error } = await supabase
    .from("tracking_scripts" as any)
    .update(updates as any)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTrackingScript(id: string): Promise<void> {
  const { error } = await supabase
    .from("tracking_scripts" as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/** Preset templates for common tracking scripts */
export const TRACKING_PRESETS: { name: string; script_type: string; description: string; position: string; template: string }[] = [
  {
    name: "Google Tag Manager",
    script_type: "gtm",
    description: "Google Tag Manager container for managing all marketing tags",
    position: "head",
    template: `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->`,
  },
  {
    name: "Google Analytics 4",
    script_type: "ga4",
    description: "Google Analytics 4 measurement tag for website analytics",
    position: "head",
    template: `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>`,
  },
  {
    name: "Google Ads Conversion",
    script_type: "google_ads",
    description: "Google Ads conversion tracking and remarketing tag",
    position: "head",
    template: `<!-- Google Ads -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXXX');
</script>`,
  },
  {
    name: "Meta Pixel",
    script_type: "meta_pixel",
    description: "Facebook/Meta Pixel for conversion tracking and audiences",
    position: "head",
    template: `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.net/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"/></noscript>`,
  },
  {
    name: "LinkedIn Insight Tag",
    script_type: "linkedin",
    description: "LinkedIn Insight Tag for conversion tracking and matched audiences",
    position: "head",
    template: `<!-- LinkedIn Insight Tag -->
<script type="text/javascript">
_linkedin_partner_id = "YOUR_PARTNER_ID";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script>
<script type="text/javascript">
(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);
</script>`,
  },
  {
    name: "Hotjar",
    script_type: "hotjar",
    description: "Hotjar behavior analytics — heatmaps, recordings, and feedback",
    position: "head",
    template: `<!-- Hotjar Tracking Code -->
<script>
(function(h,o,t,j,a,r){
  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
  h._hjSettings={hjid:YOUR_HJID,hjsv:6};
  a=o.getElementsByTagName('head')[0];
  r=o.createElement('script');r.async=1;
  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
  a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>`,
  },
  {
    name: "Custom Script",
    script_type: "custom",
    description: "Custom HTML/JS code injection",
    position: "head",
    template: `<!-- Custom Script -->
<script>
  // Your custom code here
</script>`,
  },
];
