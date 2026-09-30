// State form publik (useActionState). Pesan berupa kunci terjemahan, diterjemahkan di klien.
export type PublicFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string>
  // isian dikembalikan saat gagal agar tidak hilang (form tetap jalan tanpa JavaScript)
  values?: Record<string, string>
}

export const initialFormState: PublicFormState = { status: 'idle' }
