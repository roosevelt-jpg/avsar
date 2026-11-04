import { BRAND_SLIDES, INTRO_FILM, slidesWithCaptions } from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * Visa & Relocation — mockup shell from “Visa & Relocation Journey to Portugal”.
 *
 * Layout matches the PNG. Copy stays honest: no invented timelines or
 * guaranteed visa outcomes. Requirements are the usual document types for a
 * Portuguese work visa; the recruiter still confirms the live checklist.
 */
export const VISA: DefaultPage = {
  slug: 'visa-and-relocation',
  path: '/visa-and-relocation',
  title: 'Visa and relocation',
  purpose: 'The visa process and arrival in Portugal. Reduces the biggest worry candidates have.',
  seo: {
    title: 'Portugal work visa from India · Documents, steps and timings',
    description:
      'How the Portuguese work visa works for Indian citizens: the documents, the visa centre appointment, timings, residence permit, and what we do for you at each step.',
  },
  blocks: makeBlocks('visa', [
    [
      'hero',
      {
        eyebrow: 'Visa & relocation support',
        title: 'End-to-End Visa & Relocation Support to Portugal',
        accentWord: 'Portugal',
        subtitle:
          'We guide you through the entire process — from work visa application and documentation to travel, arrival, and settling into your new life in Portugal.',
        primaryCta: { label: 'Start Your Application', href: '/signup' },
        secondaryCta: { label: '', href: '' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: INTRO_FILM.url,
        filmLabel: 'Watch the Process',
        highlights: [],
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: '/photos/lisbon.jpg',
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: 'Lisbon and the Tagus — the destination after a successful visa',
        slides: slidesWithCaptions(BRAND_SLIDES.visa),
        stats: [],
      },
    ],
    [
      'trust_bar',
      {
        style: 'stats',
        items: [
          { icon: 'shield', title: 'Compliant & Transparent Process', body: '' },
          { icon: 'users', title: 'Expert Guidance', body: '' },
          { icon: 'document', title: 'Documentation Support', body: '' },
          { icon: 'plane', title: 'Travel & Arrival Assistance', body: '' },
          { icon: 'home', title: 'Settling-In Support', body: '' },
        ],
      },
    ],
    [
      'steps',
      {
        eyebrow: '',
        title: 'The Visa & Relocation Journey',
        intro:
          'Five clear stages after a successful offer. Timings vary by case — your recruiter confirms the current checklist before you submit anything.',
        layout: 'journey',
        sideImage: '/photos/brand/journey-tram.jpg',
        sideImageAlt: 'A yellow Lisbon tram on a historic street',
        sideImageCaption: 'Start Your New Life in Portugal',
        sideImageSide: 'right',
        items: [
          {
            icon: 'document',
            title: 'Job Offer & Documentation',
            body: 'Get a verified job offer and prepare your documents.',
            meta: '',
            image: '',
          },
          {
            icon: 'briefcase',
            title: 'Work Visa Application',
            body: 'We guide you through the visa submission process.',
            meta: '',
            image: '',
          },
          {
            icon: 'plane',
            title: 'Travel Preparation',
            body: 'Flight booking, accommodation and arrival planning.',
            meta: '',
            image: '',
          },
          {
            icon: 'users',
            title: 'Arrival & Onboarding',
            body: 'Airport support, orientation and employer onboarding.',
            meta: '',
            image: '',
          },
          {
            icon: 'home',
            title: 'Relocation & Settling-In',
            body: 'Help with housing, local registration (NIF, NISS), and daily life setup.',
            meta: '',
            image: '',
          },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: '',
        title: 'Our Relocation Support Includes',
        intro: '',
        columns: '2',
        style: 'visa_desk',
        sideImage: '/photos/selected/visa.jpg',
        sideImageAlt: 'Portuguese passport and travel documents',
        checklistTitle: 'Key Visa Requirements',
        checklist: [
          'Valid passport',
          'Signed job offer',
          'Academic certificates',
          'Updated CV',
          'Police clearance',
          'Medical fitness certificate',
          'Completed visa application form',
        ],
        typing: false,
        items: [
          { icon: 'home', title: 'Accommodation Assistance', body: '', link: { label: '', href: '' }, image: '' },
          { icon: 'document', title: 'Local Registration (NIF & NISS)', body: '', link: { label: '', href: '' }, image: '' },
          { icon: 'euro', title: 'Bank Account Guidance', body: '', link: { label: '', href: '' }, image: '' },
          { icon: 'heart', title: 'Healthcare Registration', body: '', link: { label: '', href: '' }, image: '' },
          { icon: 'map', title: 'Transport & Mobility Tips', body: '', link: { label: '', href: '' }, image: '' },
          { icon: 'users', title: 'Living & Cultural Orientation', body: '', link: { label: '', href: '' }, image: '' },
        ],
      },
    ],
    [
      'cta',
      {
        title: 'Ready to Work and Live in Portugal?',
        body: 'Let us handle the visa and relocation process while you focus on your new career opportunity.',
        primary: { label: 'Create Free Profile', href: '/signup' },
        secondary: { label: '', href: '' },
        style: 'banner',
        image: '/photos/lisbon.jpg',
        imageAlt: 'Lisbon rooftops — life after arrival in Portugal',
      },
    ],
  ]),
};
