import React from 'react';
import FadeUp from '@/components/ux/FadeUp';
import MainLayout from '@/components/layout/MainLayout';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Please enter a subject'),
  message: z.string().min(10, 'Please enter a detailed message (min 10 chars)'),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please accept the privacy policy' }) }),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toast, error, success } = useToast();
  const [loading, setLoading] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { consent: true },
  });

  const onSubmit: SubmitHandler<ContactForm> = async (data) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/core/contact/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, message: data.message }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        throw new Error(j?.error || 'Failed to send message');
      }
      success('Message sent! We will get back to you soon.');
      reset();
    } catch (e: any) {
      error(e?.message || 'Could not send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Contact | Send His Word">
      <section className="relative">
        <div className="relative">
          <img
            src="/images/hero/home-1.svg"
            alt="Contact"
            className="w-full h-[280px] object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <FadeUp>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white">Contact Us</h1>
            </FadeUp>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8">
        <div>
          <FadeUp>
            <h2 className="text-2xl font-bold mb-3">Get in Touch</h2>
            <p className="text-gray-700 mb-6">
              Have a prayer request, testimony, or question? Send us a message and our team will
              respond promptly.
            </p>
          </FadeUp>
          <FadeUp delayMs={80}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your full name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" placeholder="+256 700 555 555" {...register('phone')} />
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="How can we help?" {...register('subject')} />
                {errors.subject && (
                  <p className="text-sm text-red-600 mt-1">{errors.subject.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Write your message here..."
                  {...register('message')}
                />
                {errors.message && (
                  <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="consent" {...register('consent')} />
                <Label htmlFor="consent">I agree to the privacy policy</Label>
              </div>
              {errors.consent && (
                <p className="text-sm text-red-600 -mt-2">{errors.consent.message as string}</p>
              )}

              <div className="pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                    </span>
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </div>
            </form>
          </FadeUp>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">Contact Information</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Email:</strong> info@sendhisword.org
            </p>
            <p>
              <strong>Phone:</strong> +256 (0) 700 555 555
            </p>
            <p>
              <strong>Address:</strong> 123 Hope Street, Kampala, UG
            </p>
          </div>
          <div className="mt-6">
            <div className="aspect-video w-full rounded-lg overflow-hidden border">
              <iframe
                className="w-full h-full"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31812.476!2d32.5825!3d0.315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177dbb!2sKampala!5e0!3m2!1sen!2sug!4v1700000000000"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                title="Location"
              />
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
