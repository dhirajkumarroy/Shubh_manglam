import { QuoteStatus } from '@prisma/client';

export const VALID_QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  [QuoteStatus.DRAFT]: [QuoteStatus.SENT, QuoteStatus.CANCELLED],
  [QuoteStatus.REQUESTED]: [QuoteStatus.SENT, QuoteStatus.REJECTED, QuoteStatus.CANCELLED],
  [QuoteStatus.SENT]: [
    QuoteStatus.VIEWED,
    QuoteStatus.REVISION_REQUESTED,
    QuoteStatus.ACCEPTED,
    QuoteStatus.REJECTED,
    QuoteStatus.EXPIRED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.VIEWED]: [
    QuoteStatus.REVISION_REQUESTED,
    QuoteStatus.ACCEPTED,
    QuoteStatus.REJECTED,
    QuoteStatus.EXPIRED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.REVISION_REQUESTED]: [
    QuoteStatus.REVISED,
    QuoteStatus.REJECTED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.REVISED]: [
    QuoteStatus.VIEWED,
    QuoteStatus.REVISION_REQUESTED,
    QuoteStatus.ACCEPTED,
    QuoteStatus.REJECTED,
    QuoteStatus.EXPIRED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.ACCEPTED]: [], // Terminal state
  [QuoteStatus.REJECTED]: [], // Terminal state
  [QuoteStatus.EXPIRED]: [],  // Terminal state
  [QuoteStatus.CANCELLED]: [],// Terminal state
};

export const DEFAULT_QUOTE_VALIDITY_DAYS = 7;
