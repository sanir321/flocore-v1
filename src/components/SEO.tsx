import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
}

export function SEO({ 
  title, 
  description, 
  ogTitle, 
  ogDescription, 
  ogType = 'website' 
}: SEOProps) {
  useEffect(() => {
    if (title) {
      document.title = title.includes('Slik') ? title : `${title} | Slik`;
    }

    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      let element = isProperty 
        ? document.querySelector(`meta[property="${name}"]`)
        : document.querySelector(`meta[name="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    if (description) updateMetaTag('description', description);
    if (ogTitle || title) updateMetaTag('og:title', ogTitle || title || '', true);
    if (ogDescription || description) updateMetaTag('og:description', ogDescription || description || '', true);
    if (ogType) updateMetaTag('og:type', ogType, true);

  }, [title, description, ogTitle, ogDescription, ogType]);

  return null;
}
