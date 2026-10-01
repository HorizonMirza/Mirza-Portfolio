# Pemberitahuan Pihak Ketiga

Aset dan kode pihak ketiga yang disertakan langsung di repo ini (di luar dependency npm).

## Scene keyboard skill 3D

- Berkas: `Frontend/public/spline/skills-keyboard.spline`
- Sumber: portofolio Naresh Khatri, https://github.com/Naresh-Khatri/3d-portfolio (`public/assets/skills-keyboard.spline`)
- Lisensi: MIT, sesuai README repo tersebut ("Free to use! This portfolio is open source ... available under the MIT License"). Kredit ditampilkan di halaman Skill.
- Perubahan: tiga URL Google Fonts di dalam scene diganti path lokal (`/spline/*.ttf`) dengan panjang yang sama.

```
MIT License

Copyright (c) Naresh Khatri

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Runtime Spline (WebAssembly)

- Berkas: `Frontend/public/spline/process.wasm`, dari paket npm `@splinetool/modelling-wasm` 1.12.0 (Spline). Di-host sendiri agar runtime tidak mengambilnya dari unpkg.com. Dipakai bersama `@splinetool/runtime` sesuai ketentuan Spline.

## Font di dalam scene

- `Frontend/public/spline/inter-bold.ttf`, `inter-regular.ttf`: Inter, SIL Open Font License 1.1 (`Frontend/public/spline/OFL-Inter.txt`).
- `Frontend/public/spline/archivo-black.ttf`: Archivo Black, SIL Open Font License 1.1 (`Frontend/public/spline/OFL-ArchivoBlack.txt`).

## Logo skill

- `Frontend/src/features/skills/brand-icons.ts`: path SVG dari Simple Icons (CC0). Logo Git oleh Jason Long, CC BY 3.0. Logo JavaScript, Bootstrap, dan Zod berlisensi MIT.
