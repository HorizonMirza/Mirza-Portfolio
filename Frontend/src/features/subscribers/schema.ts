export const SUBSCRIBER_STATUSES = ['CONFIRMED', 'PENDING', 'UNSUBSCRIBED'] as const
export type SubscriberStatusValue = (typeof SUBSCRIBER_STATUSES)[number]

export const subscriberStatusLabel: Record<SubscriberStatusValue, string> = {
  CONFIRMED: 'Terkonfirmasi',
  PENDING: 'Menunggu konfirmasi',
  UNSUBSCRIBED: 'Berhenti',
}

export function parseSubscriberStatus(value: unknown): SubscriberStatusValue {
  return SUBSCRIBER_STATUSES.includes(value as SubscriberStatusValue)
    ? (value as SubscriberStatusValue)
    : 'CONFIRMED'
}
