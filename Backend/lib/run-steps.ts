// Jalankan langkah-langkah berurutan (cron harian); satu langkah yang gagal dicatat dan tidak
// menghentikan yang lain. Tiap langkah mengembalikan angka hasil yang digabung ke `data`.

type StepRunner = () => Promise<Record<string, number>>

export async function runSteps(
  steps: Record<string, StepRunner>,
  onError: (name: string, error: unknown) => void | Promise<void>,
): Promise<{ data: Record<string, number>; failed: string[] }> {
  const data: Record<string, number> = {}
  const failed: string[] = []
  for (const [name, run] of Object.entries(steps)) {
    try {
      Object.assign(data, await run())
    } catch (error) {
      failed.push(name)
      try {
        await onError(name, error)
      } catch {
        // pelaporan galat tidak boleh menghentikan langkah berikutnya
      }
    }
  }
  return { data, failed }
}
