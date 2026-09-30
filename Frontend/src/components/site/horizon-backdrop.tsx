import { HorizonCanvas } from './horizon-canvas'

// Latar hero "Horizon": versi CSS statis tampil lebih dulu (dan tetap dipakai bila JavaScript mati),
// lalu digantikan canvas beranimasi saat halaman siap. Berada di alur halaman (bukan lapisan absolut)
// supaya tidak pernah menimpa teks. Dekoratif, jadi disembunyikan dari pembaca layar.
export function HorizonBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="horizon-backdrop pointer-events-none relative h-32 overflow-hidden md:h-56"
    >
      <div className="horizon-static absolute inset-0">
        <div className="horizon-grid absolute inset-x-[-50%] top-0 bottom-[-60%]" />
        <div className="horizon-line absolute inset-x-0 top-0 h-px" />
      </div>
      <HorizonCanvas />
    </div>
  )
}
