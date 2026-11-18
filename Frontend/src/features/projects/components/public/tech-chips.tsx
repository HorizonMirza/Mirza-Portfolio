import { logoColorFor, resolveIcon, resolveLogo } from '@backend/features/skills/skill-items'

import { type ChipData, TechChipsList } from './tech-chips-list'

type SkillInput = { id: string; name: string; icon: string | null; logo?: { url: string } | null }

// Chip teknologi project dengan logo kecil (pilihan pemilik 2026-10-08, demo efek nomor 7). Logo asli
// berwarna penuh sama dengan globe skill di beranda (public/skills, permintaan pemilik 2026-10-18);
// skill tanpa logo asli memakai logo satu warna Simple Icons (abu-abu, berwarna brand saat disorot).
// Logo brand yang sangat gelap memakai warna teks agar tetap terlihat di tema gelap.
export function toChipData(skills: SkillInput[]): ChipData[] {
  return skills.map((s) => {
    const logo = resolveLogo(s.name, s.icon, s.logo)
    const brand = resolveIcon(s.name, s.icon)
    return {
      id: s.id,
      name: s.name,
      // aturan warna yang sama dengan globe skill (logo hampir hitam memakai warna teks)
      color: (brand && logoColorFor(brand.hex)) ?? 'var(--text)',
      logo,
      brand: brand
        ? { path: brand.path, viewBox: brand.viewBox ?? undefined, evenOdd: Boolean(brand.evenOdd) }
        : null,
    }
  })
}

export function TechChips({
  skills,
  label,
  className,
}: {
  skills: SkillInput[]
  label: string
  className?: string
}) {
  return <TechChipsList chips={toChipData(skills)} label={label} className={className} />
}
