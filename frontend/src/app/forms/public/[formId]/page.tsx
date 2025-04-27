import { notFound } from "next/navigation";
import { getFormById, getFormBySlug } from "@/lib/forms";
import { Form } from "@/components/Form";

interface Props {
  params: {
    formId: string;
  };
}

export default async function FormPage({ params }: Props) {
  const { formId } = params;
  
  console.log('Fetching form with ID/slug:', formId);
  
  // Try to get form by ID first
  let form = await getFormById(formId);
  console.log('Form by ID result:', form);
  
  // If not found by ID, try to get by slug
  if (!form) {
    console.log('Trying to get form by slug...');
    form = await getFormBySlug(formId);
    console.log('Form by slug result:', form);
  }
  
  if (!form) {
    console.error(`Form not found with ID/slug: ${formId}`);
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <Form form={form} />
      </div>
    </div>
  );
} 