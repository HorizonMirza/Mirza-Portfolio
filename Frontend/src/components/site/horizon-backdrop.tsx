// Latar hero "Horizon" versi statis (CSS saja): garis horizon dan grid perspektif di bawahnya.
// Berada di alur halaman (bukan lapisan absolut) supaya tidak pernah menimpa teks.
// Versi canvas beranimasi menyusul di M4. Dekoratif, jadi disembunyikan dari pembaca layar.
export function HorizonBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none relative h-28 overflow-hidden md:h-44">
      <div className="horizon-grid absolute inset-x-[-50%] top-0 bottom-[-60%]" />
      <div className="horizon-line absolute inset-x-0 top-0 h-px" />
    </div>
  )
}
