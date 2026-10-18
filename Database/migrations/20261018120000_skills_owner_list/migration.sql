-- Permintaan pemilik 2026-10-18: daftar Keahlian Teknis dipilih pemilik dari daftar usulan (34 skill,
-- lima kategori). Skill lain dihapus (termasuk Project Management, Community Management, Digital
-- Marketing, MS Office; MS Office diganti Word, Excel, PowerPoint). Relasi project ke skill yang
-- dihapus ikut terhapus (ON DELETE CASCADE); HTML, CSS, JavaScript yang dipakai project tetap ada.
-- ID kategori sama dengan seedId('skill-category:<key>') di scripts/seed-ids.ts, sehingga seed tidak
-- membuat kategori ganda. Ikon tidak diubah: logo dicari dari nama skill (features/skills/skill-items.ts).

INSERT INTO "SkillCategory" ("id", "name_id", "name_en", "order") VALUES
  ('09e8d018-d77d-5ca5-b41a-581bcdae3dee', 'Bahasa Pemrograman', 'Programming Languages', 0),
  ('89ef888f-383a-5556-a620-60ca022a540a', 'Frontend', 'Frontend', 1),
  ('9591d4ba-3979-5dd9-9445-c27c1346d1d1', 'Backend', 'Backend', 2),
  ('6e85a61d-9b92-5cca-8775-deb9adc37bbc', 'Database', 'Database', 3),
  ('7ca77291-e7ab-5c32-aa1e-6d93fb4dba16', 'Tools', 'Tools', 4)
ON CONFLICT ("id") DO UPDATE SET "name_id" = EXCLUDED."name_id", "name_en" = EXCLUDED."name_en", "order" = EXCLUDED."order";

INSERT INTO "Skill" ("id", "name", "order", "categoryId") VALUES
  (gen_random_uuid(), 'TypeScript', 0, '09e8d018-d77d-5ca5-b41a-581bcdae3dee'::uuid),
  (gen_random_uuid(), 'JavaScript', 1, '09e8d018-d77d-5ca5-b41a-581bcdae3dee'::uuid),
  (gen_random_uuid(), 'Python', 2, '09e8d018-d77d-5ca5-b41a-581bcdae3dee'::uuid),
  (gen_random_uuid(), 'C++', 3, '09e8d018-d77d-5ca5-b41a-581bcdae3dee'::uuid),
  (gen_random_uuid(), 'C', 4, '09e8d018-d77d-5ca5-b41a-581bcdae3dee'::uuid),
  (gen_random_uuid(), 'Java', 5, '09e8d018-d77d-5ca5-b41a-581bcdae3dee'::uuid),
  (gen_random_uuid(), 'HTML', 0, '89ef888f-383a-5556-a620-60ca022a540a'::uuid),
  (gen_random_uuid(), 'CSS', 1, '89ef888f-383a-5556-a620-60ca022a540a'::uuid),
  (gen_random_uuid(), 'React', 2, '89ef888f-383a-5556-a620-60ca022a540a'::uuid),
  (gen_random_uuid(), 'Next.js', 3, '89ef888f-383a-5556-a620-60ca022a540a'::uuid),
  (gen_random_uuid(), 'Tailwind CSS', 4, '89ef888f-383a-5556-a620-60ca022a540a'::uuid),
  (gen_random_uuid(), 'Bootstrap', 5, '89ef888f-383a-5556-a620-60ca022a540a'::uuid),
  (gen_random_uuid(), 'Node.js', 0, '9591d4ba-3979-5dd9-9445-c27c1346d1d1'::uuid),
  (gen_random_uuid(), 'Laravel', 1, '9591d4ba-3979-5dd9-9445-c27c1346d1d1'::uuid),
  (gen_random_uuid(), 'NestJS', 2, '9591d4ba-3979-5dd9-9445-c27c1346d1d1'::uuid),
  (gen_random_uuid(), 'FastAPI', 3, '9591d4ba-3979-5dd9-9445-c27c1346d1d1'::uuid),
  (gen_random_uuid(), 'PostgreSQL', 0, '6e85a61d-9b92-5cca-8775-deb9adc37bbc'::uuid),
  (gen_random_uuid(), 'MySQL', 1, '6e85a61d-9b92-5cca-8775-deb9adc37bbc'::uuid),
  (gen_random_uuid(), 'MongoDB', 2, '6e85a61d-9b92-5cca-8775-deb9adc37bbc'::uuid),
  (gen_random_uuid(), 'Supabase', 3, '6e85a61d-9b92-5cca-8775-deb9adc37bbc'::uuid),
  (gen_random_uuid(), 'Git', 0, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'GitHub', 1, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'Docker', 2, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'Vercel', 3, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'VS Code', 4, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'Figma', 5, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'Canva', 6, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'Word', 7, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'Excel', 8, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'PowerPoint', 9, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'Claude', 10, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'Antigravity', 11, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'Codex', 12, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid),
  (gen_random_uuid(), 'Kiro', 13, '7ca77291-e7ab-5c32-aa1e-6d93fb4dba16'::uuid)
ON CONFLICT ("name") DO UPDATE SET "order" = EXCLUDED."order", "categoryId" = EXCLUDED."categoryId";

DELETE FROM "Skill" WHERE "name" NOT IN (
  'TypeScript',
  'JavaScript',
  'Python',
  'C++',
  'C',
  'Java',
  'HTML',
  'CSS',
  'React',
  'Next.js',
  'Tailwind CSS',
  'Bootstrap',
  'Node.js',
  'Laravel',
  'NestJS',
  'FastAPI',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Supabase',
  'Git',
  'GitHub',
  'Docker',
  'Vercel',
  'VS Code',
  'Figma',
  'Canva',
  'Word',
  'Excel',
  'PowerPoint',
  'Claude',
  'Antigravity',
  'Codex',
  'Kiro'
);

-- kategori lama yang kini kosong (Framework & Tools, Lainnya, atau buatan Admin)
DELETE FROM "SkillCategory" c
WHERE NOT EXISTS (SELECT 1 FROM "Skill" s WHERE s."categoryId" = c."id");
