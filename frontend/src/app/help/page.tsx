import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, Book } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
              <div className="space-y-3">
                <p>• Create your first form by clicking "New Form" in the sidebar</p>
                <p>• Add fields by selecting from the field types on the right</p>
                <p>• Configure form settings in the Settings tab</p>
                <p>• Publish your form and share the link</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Common Questions</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">How do I make a field required?</h3>
                  <p className="text-sm text-muted-foreground">Click on any field in the form builder and toggle the "Required" switch in the field editor.</p>
                </div>
                <div>
                  <h3 className="font-medium">How do I view form submissions?</h3>
                  <p className="text-sm text-muted-foreground">Go to the Submissions page from the sidebar to view all form responses.</p>
                </div>
                <div>
                  <h3 className="font-medium">Can I export submission data?</h3>
                  <p className="text-sm text-muted-foreground">Yes, you can export submissions as CSV or Excel files from the submissions page.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-medium">Email Support</h3>
                      <p className="text-sm text-muted-foreground mt-1">Get help via email</p>
                      <Button className="mt-3" size="sm">
                        Contact Us
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-medium">Live Chat</h3>
                      <p className="text-sm text-muted-foreground mt-1">Chat with our team</p>
                      <Button className="mt-3" size="sm" variant="outline">
                        Start Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Book className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-medium">Documentation</h3>
                      <p className="text-sm text-muted-foreground mt-1">Browse our guides</p>
                      <Button className="mt-3" size="sm" variant="outline">
                        View Docs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 