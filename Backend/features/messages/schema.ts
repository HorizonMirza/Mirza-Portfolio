// Status pesan masuk dan labelnya. Tanpa impor server, aman dipakai di klien.

export const MESSAGE_STATUSES = ['NEW', 'READ', 'ARCHIVED'] as const
export type MessageStatusValue = (typeof MESSAGE_STATUSES)[number]

export const messageStatusLabel: Record<MessageStatusValue, string> = {
  NEW: 'Baru',
  READ: 'Dibaca',
  ARCHIVED: 'Arsip',
}

// Status dari parameter URL; nilai tidak dikenal jatuh ke 'NEW'.
export function parseMessageStatus(value: unknown): MessageStatusValue {
  return MESSAGE_STATUSES.includes(value as MessageStatusValue)
    ? (value as MessageStatusValue)
    : 'NEW'
}
