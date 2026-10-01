import type { ContributionCalendar } from '../github-contributions'

const STEP = 14
const CELL = 11
const LEFT = 32
const TOP = 18

const utc = (date: string) => new Date(`${date}T00:00:00Z`)

// Label bulan di atas kolom minggu pertama tiap bulan. Bila dua label terlalu rapat, label di
// kolom paling awal (bulan yang hanya terlihat sebagian) dibuang; selain itu label baru dilewati.
export function monthLabels(calendar: ContributionCalendar, locale: string) {
  const format = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
  const labels: { x: number; text: string }[] = []
  let previousMonth = -1
  let lastIndex = -10
  calendar.weeks.forEach((week, index) => {
    const first = week[0]
    if (!first) return
    const month = utc(first.date).getUTCMonth()
    if (month !== previousMonth) {
      const label = { x: LEFT + index * STEP, text: format.format(utc(first.date)) }
      if (index - lastIndex >= 3) {
        labels.push(label)
        lastIndex = index
      } else if (lastIndex === 0 && labels.length === 1) {
        labels[0] = label
        lastIndex = index
      }
      previousMonth = month
    }
  })
  return labels
}

// Kalender kontribusi gaya GitHub, digambar di server sebagai SVG (tanpa JavaScript klien).
// Warna level: kelas .gh-0 sampai .gh-4 di globals.css. Keterangan tiap kotak lewat <title>
// (tooltip kursor); pembaca layar membaca ringkasan teks, bukan 371 kotak.
export function GithubCalendar({
  calendar,
  locale,
  labels,
}: {
  calendar: ContributionCalendar
  locale: string
  labels: {
    summary: string
    less: string
    more: string
    cell: (count: number, date: string) => string
  }
}) {
  const width = LEFT + calendar.weeks.length * STEP
  const height = TOP + 7 * STEP
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
  const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' })
  // baris Senin, Rabu, Jumat (minggu GitHub dimulai hari Minggu); 2026-01-05 adalah hari Senin
  const dayLabels = [1, 3, 5].map((row) => ({
    row,
    text: weekday.format(utc(`2026-01-0${4 + row}`)),
  }))

  return (
    <div className="rounded-xl border border-border p-4 sm:p-5">
      <p className="text-sm font-medium">{labels.summary}</p>
      {/* mulai tergulir ke kanan (minggu terbaru) bila layar sempit */}
      <div className="mt-4 overflow-x-auto [direction:rtl]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          // mengisi lebar kartu di layar lebar, tidak lebih kecil dari ukuran asli di HP (bisa digulir)
          style={{ minWidth: width }}
          className="block h-auto w-full max-w-none [direction:ltr]"
          aria-hidden="true"
        >
          {monthLabels(calendar, locale).map((m) => (
            <text key={m.x} x={m.x} y={11} className="fill-muted text-[10px]">
              {m.text}
            </text>
          ))}
          {dayLabels.map((d) => (
            <text key={d.row} x={0} y={TOP + d.row * STEP + 9} className="fill-muted text-[10px]">
              {d.text}
            </text>
          ))}
          {calendar.weeks.map((week, w) =>
            week.map((day) => (
              <rect
                key={day.date}
                x={LEFT + w * STEP}
                y={TOP + utc(day.date).getUTCDay() * STEP}
                width={CELL}
                height={CELL}
                rx={2}
                className={`gh-${day.level}`}
              >
                <title>{labels.cell(day.count, fullDate.format(utc(day.date)))}</title>
              </rect>
            )),
          )}
        </svg>
      </div>
      <div
        className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted"
        aria-hidden="true"
      >
        <span className="mr-1">{labels.less}</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <svg key={level} width={CELL} height={CELL} viewBox={`0 0 ${CELL} ${CELL}`}>
            <rect width={CELL} height={CELL} rx={2} className={`gh-${level}`} />
          </svg>
        ))}
        <span className="ml-1">{labels.more}</span>
      </div>
    </div>
  )
}
