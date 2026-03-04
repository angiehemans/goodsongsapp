'use client';

import { useState } from 'react';
import { MailingListContent, MailingListData, MailingListSettings, SectionProps } from '@/lib/site-builder/types';

type MailingListSectionProps = SectionProps<MailingListContent, MailingListData, MailingListSettings>;

export function MailingListSection({ content, settings, isPreview }: MailingListSectionProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const heading = content.heading || 'Stay Updated';
  const description = content.description || 'Subscribe to get the latest updates.';
  const providerUrl = settings?.provider_url;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) return;

    if (!providerUrl) {
      // Native subscription
      setIsSubmitting(true);
      // TODO: Implement native subscription endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="profile-centered">
      <h2 className="profile-section__heading" style={{ marginBottom: 0 }}>
        {heading}
      </h2>

      <p className="profile-centered__description">
        {description}
      </p>

      {providerUrl ? (
        <a
          href={isPreview ? '#' : providerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="profile-btn profile-btn--primary profile-btn--lg"
          onClick={isPreview ? (e) => e.preventDefault() : undefined}
        >
          Subscribe
        </a>
      ) : submitted ? (
        <p style={{ color: '#22c55e', fontWeight: 500 }}>
          Thanks for subscribing!
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="profile-form-row">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="profile-input"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="profile-btn profile-btn--primary"
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      )}
    </div>
  );
}
