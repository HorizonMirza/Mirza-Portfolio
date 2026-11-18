// Pindahkan satu id satu langkah ke atas/bawah. null bila tidak bisa dipindah.
export function moveItem(
  ids: readonly string[],
  id: string,
  direction: 'up' | 'down',
): string[] | null {
  const index = ids.indexOf(id)
  if (index === -1) return null
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= ids.length) return null
  const next = [...ids]
  ;[next[index], next[target]] = [next[target]!, next[index]!]
  return next
}

export type MoveDirection = 'up' | 'down'
