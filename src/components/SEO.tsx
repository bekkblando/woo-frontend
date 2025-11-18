import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  canonicalUrl?: string;
  lang?: string;
}

const SEO = ({
  title = 'VraagMijnOverheid - Transparantie en vertrouwen tussen burger en overheid',
  description = 'Stel uw vraag aan de overheid op een eenvoudige en respectvolle manier. Wij helpen u vanaf de eerste vraag met het vinden van informatie en het indienen van WOO-verzoeken.',
  keywords = 'WOO verzoek, Wet Open Overheid, informatieverzoek, overheid, transparantie, burger, overheidsinformatie, open overheid',
  ogTitle,
  ogDescription,
  ogImage = '/government-logo.png',
  ogUrl,
  twitterCard = 'summary',
  canonicalUrl,
  lang = 'nl',
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Get or create meta tags
    const getOrCreateMetaTag = (name: string, attribute: 'name' | 'property' = 'name') => {
      const selector = attribute === 'name' ? `meta[name="${name}"]` : `meta[property="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      return meta;
    };

    const getOrCreateLinkTag = (rel: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      return link;
    };

    // Update description
    if (description) {
      const metaDescription = getOrCreateMetaTag('description');
      metaDescription.setAttribute('content', description);
    }

    // Update keywords
    if (keywords) {
      const metaKeywords = getOrCreateMetaTag('keywords');
      metaKeywords.setAttribute('content', keywords);
    }

    // Open Graph tags
    if (ogTitle || title) {
      const ogTitleTag = getOrCreateMetaTag('og:title', 'property');
      ogTitleTag.setAttribute('content', ogTitle || title);
    }

    if (ogDescription || description) {
      const ogDescriptionTag = getOrCreateMetaTag('og:description', 'property');
      ogDescriptionTag.setAttribute('content', ogDescription || description);
    }

    if (ogImage) {
      const ogImageTag = getOrCreateMetaTag('og:image', 'property');
      const fullImageUrl = ogImage.startsWith('http') 
        ? ogImage 
        : `${window.location.origin}${ogImage}`;
      ogImageTag.setAttribute('content', fullImageUrl);
    }

    if (ogUrl) {
      const ogUrlTag = getOrCreateMetaTag('og:url', 'property');
      const fullUrl = ogUrl.startsWith('http') 
        ? ogUrl 
        : `${window.location.origin}${ogUrl}`;
      ogUrlTag.setAttribute('content', fullUrl);
    }

    const ogTypeTag = getOrCreateMetaTag('og:type', 'property');
    ogTypeTag.setAttribute('content', 'website');

    // Twitter Card tags
    const twitterCardTag = getOrCreateMetaTag('twitter:card');
    twitterCardTag.setAttribute('content', twitterCard);

    if (ogTitle || title) {
      const twitterTitleTag = getOrCreateMetaTag('twitter:title');
      twitterTitleTag.setAttribute('content', ogTitle || title);
    }

    if (ogDescription || description) {
      const twitterDescriptionTag = getOrCreateMetaTag('twitter:description');
      twitterDescriptionTag.setAttribute('content', ogDescription || description);
    }

    if (ogImage) {
      const twitterImageTag = getOrCreateMetaTag('twitter:image');
      const fullImageUrl = ogImage.startsWith('http') 
        ? ogImage 
        : `${window.location.origin}${ogImage}`;
      twitterImageTag.setAttribute('content', fullImageUrl);
    }

    // Canonical URL
    if (canonicalUrl) {
      const canonicalLink = getOrCreateLinkTag('canonical');
      const fullCanonicalUrl = canonicalUrl.startsWith('http') 
        ? canonicalUrl 
        : `${window.location.origin}${canonicalUrl}`;
      canonicalLink.setAttribute('href', fullCanonicalUrl);
    }

    // Language
    const htmlLang = document.documentElement.getAttribute('lang');
    if (lang && htmlLang !== lang) {
      document.documentElement.setAttribute('lang', lang);
    }

    // Additional SEO meta tags
    const viewportTag = getOrCreateMetaTag('viewport');
    if (!viewportTag.getAttribute('content')) {
      viewportTag.setAttribute('content', 'width=device-width, initial-scale=1.0');
    }

    const charsetTag = document.querySelector('meta[charset]') as HTMLMetaElement;
    if (!charsetTag) {
      const meta = document.createElement('meta');
      meta.setAttribute('charset', 'UTF-8');
      document.head.insertBefore(meta, document.head.firstChild);
    }

    // Theme color for mobile browsers
    const themeColorTag = getOrCreateMetaTag('theme-color');
    themeColorTag.setAttribute('content', '#154273');

  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, twitterCard, canonicalUrl, lang]);

  return null;
};

export default SEO;

