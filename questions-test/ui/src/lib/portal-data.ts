import type {
  CategoryMeta,
  PortalDashboard,
  QuizSession,
} from "./types/portal"

export const portalDashboard: PortalDashboard = {
  targetWeekly: { done: 14, total: 20 },
  metrics: {
    sessionsCompleted: 28,
    sessionsDelta: "+4 minggu ini",
    sessionsTargetPercent: 70,
    averageScore: 84.5,
    kkm: 75,
    percentile: 88,
    accuracy: 86,
    correct: 240,
    totalItems: 278,
  },
}

export const categoryMeta: Record<string, CategoryMeta> = {
  "cat-verbal": {
    badgeLabel: "Populer",
    badgeClass: "bg-primary/10 text-primary",
    tags: ["Sinonim", "Antonim", "Analogi"],
    avgScore: 786,
    students: 1290,
    difficulty: "Sedang",
    level: "Fresh Graduate – Profesional",
  },
  "cat-numerik": {
    badgeLabel: "Disarankan",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    tags: ["Deret Angka", "Aritmetika", "Kuantitatif"],
    avgScore: 742,
    students: 1120,
    difficulty: "Sedang – Sulit",
    level: "Fresh Graduate – Profesional",
  },
  "cat-figural": {
    badgeLabel: "Menantang",
    badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    tags: ["Analogi Gambar", "Serial Gambar", "Pola"],
    avgScore: 718,
    students: 940,
    difficulty: "Sedang – Sulit",
    level: "Fresh Graduate – Profesional",
  },
  "cat-logika": {
    badgeLabel: "Wajib",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    tags: ["Silogisme", "Logika", "Simpulan"],
    avgScore: 801,
    students: 1180,
    difficulty: "Sedang",
    level: "Fresh Graduate – Profesional",
  },
  "cat-analisis": {
    badgeLabel: "Studi Kasus",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    tags: ["Studi Kasus", "Analisis", "Keputusan"],
    avgScore: 764,
    students: 720,
    difficulty: "Sedang – Sulit",
    level: "Menengah – Profesional",
  },
  "cat-kepribadian": {
    badgeLabel: "Baru",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    tags: ["Karakter", "Sikap Kerja", "Budaya"],
    avgScore: 822,
    students: 510,
    difficulty: "Mudah – Sedang",
    level: "Semua Level",
  },
}

export const quizSession: QuizSession = {
  id: "session-logika-01",
  title: "Tes Penalaran Logis — Paket 01",
  packageLabel: "Silogisme & Logika Proposisi",
  categoryId: "cat-logika",
  durationLimitMinutes: 20,
  questions: [
    {
      id: "qs-1",
      number: 1,
      topic: "Silogisme Kategorik",
      difficulty: "Sulit",
      stimulus:
        "Premis 1: Semua karyawan PT Maju menghadiri rapat tahunan. Premis 2: Sebagian peserta rapat tahunan mendapat hadiah utama.",
      prompt: "Kesimpulan yang sah dari premis di atas adalah…",
      options: [
        { key: "A", text: "Semua karyawan PT Maju mendapat hadiah utama." },
        { key: "B", text: "Sebagian karyawan PT Maju mendapat hadiah utama." },
        {
          key: "C",
          text: "Tidak dapat disimpulkan hubungan pasti antara karyawan PT Maju dan penerima hadiah utama.",
        },
        { key: "D", text: "Tidak ada karyawan PT Maju yang mendapat hadiah utama." },
      ],
      answer: "C",
      guide:
        "Premis khusus tidak menjamin hubungan pasti antara kedua himpunan.",
      explanation:
        "Premis 1 universal dan premis 2 partikular. Sebagian peserta rapat yang mendapat hadiah belum tentu karyawan PT Maju, sehingga hubungan pasti tidak dapat disimpulkan.",
    },
    {
      id: "qs-2",
      number: 2,
      topic: "Logika Proposisi",
      difficulty: "Sedang",
      stimulus:
        "Premis 1: Jika server pusat mengalami down, maka aplikasi transaksi tidak dapat diakses. Premis 2: Server pusat mengalami down.",
      prompt: "Kesimpulan yang tepat berdasarkan Modus Ponens adalah…",
      options: [
        { key: "A", text: "Server pusat tidak down." },
        { key: "B", text: "Aplikasi transaksi tidak dapat diakses." },
        { key: "C", text: "Aplikasi transaksi tetap dapat diakses." },
        { key: "D", text: "Tidak dapat disimpulkan." },
      ],
      answer: "B",
      guide: "Modus ponens: p → q dan p benar, maka q benar.",
      explanation:
        "Bentuk p → q dengan anteseden p yang benar menghasilkan konsekuen q. Karena server down, aplikasi transaksi tidak dapat diakses.",
    },
    {
      id: "qs-3",
      number: 3,
      topic: "Logika Proposisi",
      difficulty: "Sedang",
      stimulus:
        "Premis 1: Jika pelamar lulus tes pemrograman, maka pelamar diundang ke tahap wawancara. Premis 2: Budi tidak diundang ke tahap wawancara.",
      prompt: "Kesimpulan yang tepat berdasarkan Modus Tollens adalah…",
      options: [
        { key: "A", text: "Budi lulus tes pemrograman." },
        { key: "B", text: "Budi diundang wawancara." },
        { key: "C", text: "Budi tidak lulus tes pemrograman." },
        { key: "D", text: "Tidak dapat disimpulkan." },
      ],
      answer: "C",
      guide: "Modus tollens: p → q dan ¬q, maka ¬p.",
      explanation:
        "Karena konsekuen (diundang wawancara) dinegasikan, maka antesedennya juga dinegasikan: Budi tidak lulus tes pemrograman.",
    },
    {
      id: "qs-4",
      number: 4,
      topic: "Ekivalensi Logis",
      difficulty: "Sulit",
      prompt:
        "Manakah pernyataan yang secara logis ekivalen (sama makna) dengan pernyataan: “Jika hari hujan, maka jalanan licin”?",
      options: [
        { key: "A", text: "Jika jalanan licin, maka hari hujan." },
        { key: "B", text: "Jika hari tidak hujan, maka jalanan tidak licin." },
        { key: "C", text: "Jika jalanan tidak licin, maka hari tidak hujan." },
        { key: "D", text: "Hari hujan dan jalanan tidak licin." },
      ],
      answer: "C",
      guide: "Gunakan kontraposisi: p → q ≡ ¬q → ¬p.",
      explanation:
        "Kontraposisi memiliki nilai kebenaran yang sama dengan implikasi asalnya, sehingga “jika jalanan tidak licin, maka hari tidak hujan” adalah ekivalennya.",
    },
    {
      id: "qs-5",
      number: 5,
      topic: "Negasi Kuantor",
      difficulty: "Sedang",
      prompt:
        "Negasi atau ingkaran yang tepat dari pernyataan “Semua programmer di perusahaan menggunakan Git” adalah…",
      options: [
        { key: "A", text: "Semua programmer tidak menggunakan Git." },
        { key: "B", text: "Ada programmer di perusahaan yang tidak menggunakan Git." },
        { key: "C", text: "Tidak ada programmer yang menggunakan Git." },
        { key: "D", text: "Semua programmer menggunakan Git." },
      ],
      answer: "B",
      guide: "Negasi kuantor universal: ¬(∀x P(x)) ≡ ∃x ¬P(x).",
      explanation:
        "Ingkaran dari “semua P adalah Q” adalah “ada P yang bukan Q”, yaitu ada programmer yang tidak menggunakan Git.",
    },
    {
      id: "qs-6",
      number: 6,
      topic: "Silogisme Hipotetis",
      difficulty: "Sedang",
      stimulus:
        "Premis 1: Jika sistem diuji dengan benar, maka bug dapat ditemukan. Premis 2: Jika bug dapat ditemukan, maka kualitas software meningkat.",
      prompt: "Kesimpulan silogisme hipotetis yang sah adalah…",
      options: [
        { key: "A", text: "Jika kualitas meningkat, maka sistem diuji dengan benar." },
        {
          key: "B",
          text: "Jika sistem diuji dengan benar, maka kualitas software meningkat.",
        },
        { key: "C", text: "Bug tidak dapat ditemukan." },
        { key: "D", text: "Tidak dapat disimpulkan." },
      ],
      answer: "B",
      guide: "Silogisme hipotetis: (p → q) dan (q → r) menghasilkan (p → r).",
      explanation:
        "Rantai implikasi memungkinkan penyimpulan langsung dari anteseden awal ke konsekuen akhir: jika sistem diuji dengan benar, kualitas software meningkat.",
    },
    {
      id: "qs-7",
      number: 7,
      topic: "Silogisme Disjungtif",
      difficulty: "Mudah",
      stimulus:
        "Premis 1: Tim akan menggunakan framework React atau Vue. Premis 2: Tim tidak menggunakan framework React.",
      prompt: "Kesimpulan logis disjungtif yang sah adalah…",
      options: [
        { key: "A", text: "Tim menggunakan framework React." },
        { key: "B", text: "Tim tidak menggunakan framework apa pun." },
        { key: "C", text: "Tim menggunakan framework Vue." },
        { key: "D", text: "Tidak dapat disimpulkan." },
      ],
      answer: "C",
      guide: "Silogisme disjungtif: (p ∨ q) dan ¬p, maka q.",
      explanation:
        "Karena salah satu opsi disjungsi dinegasikan, opsi lainnya pasti benar: tim menggunakan framework Vue.",
    },
    {
      id: "qs-8",
      number: 8,
      topic: "Silogisme Kategorik",
      difficulty: "Sulit",
      stimulus:
        "Premis 1: Semua manajer proyek memiliki sertifikat PMP. Premis 2: Anton bukan seorang manajer proyek.",
      prompt: "Kesimpulan yang benar secara logika adalah…",
      options: [
        { key: "A", text: "Anton memiliki sertifikat PMP." },
        { key: "B", text: "Anton tidak memiliki sertifikat PMP." },
        {
          key: "C",
          text: "Tidak dapat disimpulkan apakah Anton memiliki sertifikat PMP atau tidak.",
        },
        { key: "D", text: "Semua pemegang PMP adalah manajer proyek." },
      ],
      answer: "C",
      guide:
        "Premis universal tidak membatasi individu di luar subjeknya.",
      explanation:
        "Pernyataan “semua manajer proyek punya PMP” tidak menyatakan apa pun tentang non-manajer, sehingga status PMP Anton tidak dapat disimpulkan.",
    },
    {
      id: "qs-9",
      number: 9,
      topic: "Logika Proposisi",
      difficulty: "Sulit",
      stimulus:
        "Premis 1: Jika mati lampu, maka AC mati. Premis 2: Jika AC mati, maka ruangan menjadi panas. Premis 3: Ruangan tidak panas.",
      prompt: "Kesimpulan yang paling tepat adalah…",
      options: [
        { key: "A", text: "Lampu mati." },
        { key: "B", text: "AC mati." },
        { key: "C", text: "Ruangan panas." },
        { key: "D", text: "Lampu tidak mati (tidak terjadi mati lampu)." },
      ],
      answer: "D",
      guide: "Terapkan modus tollens secara berantai pada kedua implikasi.",
      explanation:
        "Rantai implikasi: mati lampu → AC mati → ruangan panas. Karena ruangan tidak panas, keduanya dinegasikan, sehingga tidak terjadi mati lampu.",
    },
    {
      id: "qs-10",
      number: 10,
      topic: "Hukum De Morgan",
      difficulty: "Sedang",
      prompt:
        "Negasi dari pernyataan majemuk “Rian belajar Git dan Rian membuat Pull Request” sesuai Hukum De Morgan adalah…",
      options: [
        { key: "A", text: "Rian belajar Git dan tidak membuat Pull Request." },
        {
          key: "B",
          text: "Rian tidak belajar Git atau Rian tidak membuat Pull Request.",
        },
        { key: "C", text: "Rian tidak belajar Git dan Rian tidak membuat Pull Request." },
        { key: "D", text: "Rian belajar Git atau membuat Pull Request." },
      ],
      answer: "B",
      guide: "De Morgan: ¬(p ∧ q) ≡ ¬p ∨ ¬q.",
      explanation:
        "Ingkaran konjungsi mengubah “dan” menjadi “atau” dengan menegasikan tiap pernyataan: tidak belajar Git atau tidak membuat Pull Request.",
    },
  ],
}

