'use client'

import { useEffect } from 'react'
import Script from 'next/script'

interface AnalyticsScriptsProps {
  googleAnalyticsId?: string
  googleSearchConsoleId?: string
  facebookPixelId?: string
}

export function AnalyticsScripts({ 
  googleAnalyticsId, 
  googleSearchConsoleId, 
  facebookPixelId 
}: AnalyticsScriptsProps) {
  
  // Google Analytics
  useEffect(() => {
    if (googleAnalyticsId && typeof window !== 'undefined') {
      // @ts-ignore
      window.dataLayer = window.dataLayer || []
      // @ts-ignore
      function gtag(...args: any[]) {
        // @ts-ignore
        window.dataLayer.push(args)
      }
      // @ts-ignore
      window.gtag = gtag
      
      gtag('js', new Date())
      gtag('config', googleAnalyticsId)
    }
  }, [googleAnalyticsId])

  // Facebook Pixel
  useEffect(() => {
    if (facebookPixelId && typeof window !== 'undefined') {
      // @ts-ignore
      !function(f,b,e,v,n,t,s)
      // @ts-ignore
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      // @ts-ignore
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      // @ts-ignore
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      // @ts-ignore
      n.queue=[];t=b.createElement(e);t.async=!0;
      // @ts-ignore
      t.src=v;s=b.getElementsByTagName(e)[0];
      // @ts-ignore
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      
      // @ts-ignore
      window.fbq('init', facebookPixelId)
      // @ts-ignore
      window.fbq('track', 'PageView')
    }
  }, [facebookPixelId])

  return (
    <>
      {/* Google Analytics */}
      {googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsId}');
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel */}
      {facebookPixelId && (
        <>
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${facebookPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            <img 
              height="1" 
              width="1" 
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${facebookPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* Google Search Console Verification */}
      {googleSearchConsoleId && (
        <meta 
          name="google-site-verification" 
          content={googleSearchConsoleId.replace('google-site-verification=', '')} 
        />
      )}
    </>
  )
}
