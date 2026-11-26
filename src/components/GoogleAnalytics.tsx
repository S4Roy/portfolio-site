import Script from "next/script";

/**
 * Google tag loading, controlled by build-time env vars (renders nothing when unset):
 * - NEXT_PUBLIC_GTM_ID (GTM-XXXX): Google Tag Manager container. Configure GA4 inside GTM.
 * - NEXT_PUBLIC_GA_ID  (G-XXXX):   direct GA4 via gtag.js, used only when no GTM ID is set.
 * Loaded after the page is interactive so it does not affect LCP. Custom events
 * (resume downloads, project visits, contact clicks) are pushed by <Analytics />.
 */
export default function GoogleAnalytics() {
  const gtm = process.env.NEXT_PUBLIC_GTM_ID;
  const ga = process.env.NEXT_PUBLIC_GA_ID;

  if (gtm && /^GTM-[A-Z0-9]+$/.test(gtm)) {
    return (
      <>
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
      </>
    );
  }

  if (ga && /^G-[A-Z0-9]+$/.test(ga)) {
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true,allow_google_signals:false,allow_ad_personalization_signals:false});`}
        </Script>
      </>
    );
  }

  return null;
}
