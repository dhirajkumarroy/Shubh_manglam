import { PricingType } from '@prisma/client';

export const PRICING_TYPE_METADATA: Record<
  PricingType,
  { label: string; unitLabel: string; requiresBasePrice: boolean; description: string }
> = {
  [PricingType.FIXED]: {
    label: 'Fixed Price',
    unitLabel: 'total',
    requiresBasePrice: true,
    description: 'A single flat rate for the entire service or event setup.',
  },
  [PricingType.PER_PERSON]: {
    label: 'Per Person / Plate',
    unitLabel: 'per person',
    requiresBasePrice: true,
    description: 'Charged per guest, common in catering, halwai, and banquet setups.',
  },
  [PricingType.PER_UNIT]: {
    label: 'Per Unit / Item',
    unitLabel: 'per unit',
    requiresBasePrice: true,
    description: 'Charged per piece (e.g. chairs, tables, flower varmalas, light fixtures).',
  },
  [PricingType.PER_DAY]: {
    label: 'Per Day',
    unitLabel: 'per day',
    requiresBasePrice: true,
    description: 'Daily rental or service duration (e.g. tenting, power generator, photography).',
  },
  [PricingType.PER_HOUR]: {
    label: 'Per Hour',
    unitLabel: 'per hour',
    requiresBasePrice: true,
    description: 'Hourly rate for artists, choreographers, DJs, and sound engineers.',
  },
  [PricingType.CUSTOM_QUOTE]: {
    label: 'Custom Quotation',
    unitLabel: 'custom',
    requiresBasePrice: false,
    description: 'Price is determined per event requirements via bespoke quote negotiation.',
  },
};

export const ALLOWED_CATALOG_SORT_FIELDS = [
  'price_asc',
  'price_desc',
  'name_asc',
  'newest',
] as const;
