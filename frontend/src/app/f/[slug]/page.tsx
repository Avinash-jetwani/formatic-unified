'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const FormShortLinkRedirector = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  useEffect(() => {
    if (slug) {
      // Redirect to the complete form URL
      router.replace(`/forms/public/${slug}`);
    }
  }, [slug, router]);
  
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading Form...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-4">
          Redirecting to your form...
        </p>
      </div>
    </div>
  );
};

export default FormShortLinkRedirector; 