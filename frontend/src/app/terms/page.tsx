import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <h2>Acceptance of Terms</h2>
          <p>
            By accessing and using this service, you accept and agree to be bound by the terms 
            and provision of this agreement.
          </p>

          <h2>Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of our service for personal, 
            non-commercial transitory viewing only.
          </p>

          <h2>Service Availability</h2>
          <p>
            We strive to maintain service availability but do not guarantee uninterrupted access. 
            We reserve the right to modify or discontinue services with notice.
          </p>

          <h2>User Responsibilities</h2>
          <p>
            Users are responsible for maintaining the confidentiality of their account information 
            and for all activities that occur under their account.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            In no event shall our company be liable for any damages arising out of the use or 
            inability to use our services.
          </p>

          <h2>Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with applicable laws 
            and you irrevocably submit to the exclusive jurisdiction of the courts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 