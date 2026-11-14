// ===== DATA (dimuat dari localStorage) =====
const $ = (id) => document.getElementById(id);

function muatData(kunci) {
    try {
        const d = JSON.parse(localStorage.getItem(kunci));
        return Array.isArray(d) ? d : [];
    } catch {
        return [];
    }
}

function muatPeta(kunci) {
    try {
        const p = JSON.parse(localStorage.getItem(kunci));
        return p && typeof p === "object" && !Array.isArray(p) ? p : {};
    } catch {
        return {};
    }
}

const incomes = muatData("incomes");
const goals = muatData("goals");
const expenses = muatData("expenses");
let budget = Number(localStorage.getItem("budget")) || 0;
let kataBelajar = muatPeta("kataBelajar");           // kamus pengeluaran yang dipelajari
let kataBelajarMasuk = muatPeta("kataBelajarMasuk"); // kamus pemasukan yang dipelajari

function simpanData() {
    localStorage.setItem("incomes", JSON.stringify(incomes));
    localStorage.setItem("goals", JSON.stringify(goals));
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("budget", String(budget));
}

function simpanKamus() {
    localStorage.setItem("kataBelajar", JSON.stringify(kataBelajar));
    localStorage.setItem("kataBelajarMasuk", JSON.stringify(kataBelajarMasuk));
}

// ===== FUNGSI BANTU =====
function formatRupiah(angka) {
    return "Rp " + angka.toLocaleString("id-ID");
}

function formatAngka(n) {
    return n.toLocaleString("id-ID");
}

function ambilAngka(teks) {
    return Number(teks.replace(/\D/g, ""));
}

function formatSingkat(n) {
    if (n >= 1000000) {
        return (n / 1000000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "jt";
    }
    if (n >= 1000) {
        return Math.round(n / 1000).toLocaleString("id-ID") + "rb";
    }
    return String(n);
}

function hariIni() {
    return new Date().toLocaleDateString("sv-SE"); // format YYYY-MM-DD
}

function bulanIni() {
    return hariIni().slice(0, 7);
}

function tglLokal(tgl) {
    const [y, m, d] = tgl.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function geserTanggal(tgl, n) {
    const x = tglLokal(tgl);
    x.setDate(x.getDate() + n);
    return x.toLocaleDateString("sv-SE");
}

function tanggalMundur(n) {
    return geserTanggal(hariIni(), -n);
}

// Senin = awal minggu
function awalMinggu() {
    const hari = (tglLokal(hariIni()).getDay() + 6) % 7;
    return geserTanggal(hariIni(), -hari);
}

function labelHari(tgl) {
    if (tgl === hariIni()) return "Hari ini";
    if (tgl === tanggalMundur(1)) return "Kemarin";
    return tglLokal(tgl).toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
}

function labelTglPendek(tgl) {
    return tglLokal(tgl).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function labelBulan(ym) {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function geserBulan(ym, n) {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1 + n, 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function bulanTerawal() {
    const tgl = [...incomes, ...expenses].map(x => x.date).filter(Boolean).sort();
    return tgl.length ? tgl[0].slice(0, 7) : bulanIni();
}

function totalBulan(daftar, ym) {
    let t = 0;
    for (const x of daftar) {
        if (x.date && x.date.slice(0, 7) === ym) t += x.amount;
    }
    return t;
}

function rapikan(desc) {
    return desc.replace(/\b\w/g, c => c.toUpperCase());
}

// ===== KATEGORI =====
const KATEGORI = {
    makan:     { nama: "Makan",     warna: "#f97316", ikon: "M6 3v8a3 3 0 0 0 6 0V3M9 3v18M18 3c-2 2-3 5-3 8h3v10" },
    transport: { nama: "Transport", warna: "#3b82f6", ikon: "M5 16l1.5-5h11L19 16M5 16v3M19 16v3M5 16h14" },
    belanja:   { nama: "Belanja",   warna: "#a855f7", ikon: "M6 7h12l-1 13H7L6 7zM9 7a3 3 0 0 1 6 0" },
    lainnya:   { nama: "Lainnya",   warna: "#94a3b8", ikon: "M5 12h.01M12 12h.01M19 12h.01" }
};

const KATEGORI_MASUK = {
    gaji:      { nama: "Gaji",      ikon: "M3 7h18v10H3zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4M6 12h.01M18 12h.01" },
    freelance: { nama: "Freelance", ikon: "M4 6h16v10H4zM2 19h20" },
    hadiah:    { nama: "Hadiah",    ikon: "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" },
    lainnya:   { nama: "Lainnya",   ikon: "M12 5v14M6 13l6 6 6-6" }
};

const URUT_KELUAR = Object.keys(KATEGORI);
const URUT_MASUK = Object.keys(KATEGORI_MASUK);

const KATA_KUNCI = {
    makan: ["makan", "makanan", "minum", "kopi", "nasi", "bakso", "ayam", "jajan", "permen", "sarapan", "es"],
    transport: ["bensin", "ojek", "parkir", "tol", "grab", "gojek", "angkot", "bus", "kereta"],
    belanja: ["belanja", "sabun", "baju", "shopee", "tokopedia", "indomaret", "alfamart"]
};

const KATA_MASUK = {
    gaji: ["gaji", "gajian", "salary", "upah", "thr", "bonus", "lembur"],
    freelance: ["freelance", "proyek", "project", "upwork", "fee", "jasa"],
    hadiah: ["hadiah", "kado", "angpao", "saku", "dikasih"]
};

// cari kategori dari kata kunci; hasilnya null kalau tidak ada yang cocok
function cariKategori(desc, peta) {
    const kata = desc.toLowerCase().split(/\s+/);
    for (const [kat, daftar] of Object.entries(peta)) {
        if (kata.some(k => daftar.includes(k))) return kat;
    }
    return null;
}

function kategoriDari(e) {
    return KATEGORI[e.category] ? e.category : "lainnya";
}

// data pemasukan lama belum punya kategori -> ditebak dari deskripsinya
function kategoriMasukDari(i) {
    if (KATEGORI_MASUK[i.category]) return i.category;
    return cariKategori(i.desc || "", KATA_MASUK) || "lainnya";
}

// saldo = pemasukan - setoran goal - pengeluaran
function hitungSaldo() {
    let total = 0;
    for (const item of incomes) total += item.amount;
    for (const goal of goals) total -= goal.current;
    for (const e of expenses) total -= e.amount;
    return total;
}

// ===== LAYAR KOSONG vs ISI =====
function perbaruiLayar() {
    const adaData = incomes.length > 0 || goals.length > 0 || expenses.length > 0 || budget > 0;
    $("empty-state").hidden = adaData;
    $("konten").hidden = !adaData;
    $("tab-bar").hidden = !adaData;
}

// ===== BARIS TRANSAKSI (dipakai Home dan Insight) =====
function buatBaris(t, labelWaktu) {
    const masuk = t.jenis === "income";
    const kat = masuk ? KATEGORI_MASUK[kategoriMasukDari(t.item)] : KATEGORI[kategoriDari(t.item)];

    const li = document.createElement("li");
    li.className = "tx " + (masuk ? "masuk" : "keluar");

    const ikon = document.createElement("span");
    ikon.className = "ikon-tx";
    ikon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${kat.ikon}"/></svg>`;

    const teks = document.createElement("span");
    teks.className = "teks";
    const nama = document.createElement("span");
    nama.className = "nama-tx";
    nama.textContent = t.item.desc;
    const sub = document.createElement("small");
    sub.textContent = `${labelWaktu} · ${kat.nama}`;
    teks.append(nama, sub);

    const jumlah = document.createElement("strong");
    jumlah.className = "jumlah";
    jumlah.textContent = (masuk ? "+ " : "- ") + formatRupiah(t.item.amount);

    li.append(ikon, teks, jumlah);
    li.addEventListener("click", function () {
        bukaAksiTransaksi(t);
    });
    return li;
}

// ===== HOME =====
function tampilkanSapaan() {
    const jam = new Date().getHours();
    let sapa = "Selamat malam";
    if (jam < 11) sapa = "Selamat pagi";
    else if (jam < 15) sapa = "Selamat siang";
    else if (jam < 18) sapa = "Selamat sore";
    $("sapaan").textContent = sapa;
}

function tampilkanRitme() {
    const el = $("insight");
    const terpakai = totalBulan(expenses, bulanIni());
    el.hidden = terpakai <= 0;
    if (terpakai <= 0) return;

    const sekarang = new Date();
    const hariKe = sekarang.getDate();
    const jumlahHari = new Date(sekarang.getFullYear(), sekarang.getMonth() + 1, 0).getDate();
    const rata = Math.round(terpakai / hariKe);

    let teks = `Rata-rata jajan Rp ${formatSingkat(rata)} per hari.`;
    if (budget > 0) {
        const sisa = budget - terpakai;
        if (sisa < 0) {
            teks += " Budget bulan ini sudah terlewati.";
        } else if (rata > 0) {
            const tanggalHabis = hariKe + Math.floor(sisa / rata);
            teks += tanggalHabis >= jumlahHari
                ? " Budget cukup sampai akhir bulan."
                : ` Dengan ritme ini budget cukup sampai tanggal ${tanggalHabis}.`;
        }
    }
    el.textContent = teks;
}

const BATAS_HOME = 7;

function tampilkanMinggu() {
    const awal = awalMinggu();
    const akhir = geserTanggal(awal, 6);
    const dalam = x => x.date && x.date >= awal && x.date <= akhir;

    const masuk = incomes.filter(dalam).map(item => ({ jenis: "income", item }));
    const keluar = expenses.filter(dalam).map(item => ({ jenis: "expense", item }));
    const semua = [...masuk, ...keluar].reverse().sort((a, b) => b.item.date.localeCompare(a.item.date));
    const totalKeluar = keluar.reduce((s, t) => s + t.item.amount, 0);

    $("minggu-rentang").textContent = `${labelTglPendek(awal)} – ${labelTglPendek(akhir)}`;
    const total = $("minggu-total");
    total.textContent = totalKeluar > 0 ? "- " + formatRupiah(totalKeluar) : "Rp 0";
    total.className = totalKeluar > 0 ? "merah" : "";
    $("minggu-kosong").hidden = semua.length > 0;

    const list = $("minggu-list");
    list.innerHTML = "";
    for (const t of semua.slice(0, BATAS_HOME)) {
        list.appendChild(buatBaris(t, labelHari(t.item.date)));
    }

    const lebih = semua.length - BATAS_HOME;
    $("minggu-semua").hidden = lebih <= 0;
    $("minggu-semua").textContent = `Lihat semua di Insight (+${lebih})`;
}

function tampilkanHome() {
    const saldo = hitungSaldo();
    $("balance").textContent = formatRupiah(saldo);
    $("balance").classList.toggle("minus", saldo < 0);

    const namaBulan = new Date().toLocaleDateString("id-ID", { month: "long" });
    $("pengeluaran-label").textContent = `Pengeluaran · ${namaBulan}`;
    $("stat-expense").textContent = "- " + formatRupiah(totalBulan(expenses, bulanIni()));

    tampilkanSapaan();
    tampilkanRitme();
    tampilkanMinggu();
}

// ===== INSIGHT (navigasi bulan) =====
let bulanLihat = bulanIni();

function isiBudget(terpakai) {
    const bar = $("budget-bar");
    const kartu = $("kartu-budget");
    bar.className = "";
    kartu.classList.remove("over-card");

    const persen = Math.round((terpakai / budget) * 100);
    const sisa = budget - terpakai;
    bar.style.width = Math.min(100, persen) + "%";

    if (sisa >= 0) {
        $("budget-info").textContent = `Sisa Rp ${formatSingkat(sisa)}`;
        if (persen >= 80) bar.className = "warn";
    } else {
        $("budget-info").textContent = `Over Rp ${formatSingkat(-sisa)}`;
        bar.className = "over";
        kartu.classList.add("over-card");
    }
}

function tampilkanGrafik(exp) {
    const chartEl = $("chart");
    chartEl.innerHTML = "";
    $("kartu-chart").hidden = exp.length === 0;
    if (exp.length === 0) return;

    const [y, m] = bulanLihat.split("-").map(Number);
    const jumlahHari = new Date(y, m, 0).getDate();
    const total = new Array(jumlahHari).fill(0);
    for (const e of exp) total[Number(e.date.slice(8, 10)) - 1] += e.amount;
    const maks = Math.max(...total, 1);

    chartEl.style.gridTemplateColumns = `repeat(${jumlahHari}, minmax(0, 1fr))`;

    for (let i = 0; i < jumlahHari; i++) {
        const tgl = `${bulanLihat}-${String(i + 1).padStart(2, "0")}`;

        const kolom = document.createElement("div");
        kolom.className = tgl === hariIni() ? "kolom hari-ini" : "kolom";

        const area = document.createElement("div");
        area.className = "area";
        const batang = document.createElement("div");
        batang.className = total[i] > 0 ? "batang" : "batang nol";
        batang.style.height = total[i] > 0 ? Math.max(8, Math.round((total[i] / maks) * 100)) + "%" : "3px";
        batang.title = `${i + 1}: ${formatRupiah(total[i])}`;
        area.appendChild(batang);

        const label = document.createElement("span");
        label.textContent = (i === 0 || (i + 1) % 5 === 0) ? String(i + 1) : "";

        kolom.append(area, label);
        chartEl.appendChild(kolom);
    }
}

function isiKategori(daftar) {
    const bar = $("kategori-bar");
    const list = $("kategori-list");
    bar.innerHTML = "";
    list.innerHTML = "";

    const total = {};
    let semua = 0;
    for (const e of daftar) {
        const k = kategoriDari(e);
        total[k] = (total[k] || 0) + e.amount;
        semua += e.amount;
    }
    $("kartu-kategori").hidden = semua === 0;
    if (semua === 0) return;

    const urut = Object.keys(total).sort((a, b) => total[b] - total[a]);
    for (const k of urut) {
        const potong = document.createElement("div");
        potong.style.width = (total[k] / semua) * 100 + "%";
        potong.style.background = KATEGORI[k].warna;
        bar.appendChild(potong);

        const li = document.createElement("li");
        const titik = document.createElement("span");
        titik.className = "titik";
        titik.style.background = KATEGORI[k].warna;
        const nama = document.createElement("span");
        nama.className = "nama";
        nama.textContent = KATEGORI[k].nama;
        const pct = document.createElement("span");
        pct.className = "pct";
        pct.textContent = Math.round((total[k] / semua) * 100) + "%";
        const jumlah = document.createElement("strong");
        jumlah.textContent = "Rp " + formatSingkat(total[k]);
        li.append(titik, nama, pct, jumlah);
        list.appendChild(li);
    }
}

function tampilkanBulan() {
    const sekarang = bulanIni();
    if (bulanLihat > sekarang) bulanLihat = sekarang;

    $("bulan-label").textContent = labelBulan(bulanLihat);
    $("bulan-prev").disabled = bulanLihat <= bulanTerawal();
    $("bulan-next").disabled = bulanLihat >= sekarang;

    const inc = incomes.filter(i => i.date && i.date.slice(0, 7) === bulanLihat);
    const exp = expenses.filter(e => e.date && e.date.slice(0, 7) === bulanLihat);
    const totalIn = inc.reduce((s, i) => s + i.amount, 0);
    const totalEx = exp.reduce((s, e) => s + e.amount, 0);
    const selisih = totalIn - totalEx;

    $("in-total").textContent = "+ " + formatRupiah(totalIn);
    $("out-total").textContent = "- " + formatRupiah(totalEx);
    const sel = $("selisih-total");
    sel.textContent = (selisih >= 0 ? "+ " : "- ") + formatRupiah(Math.abs(selisih));
    sel.className = selisih >= 0 ? "hijau" : "merah";

    // budget cuma masuk akal buat bulan berjalan (nilainya bisa berubah tiap bulan)
    const bulanBerjalan = bulanLihat === sekarang;
    $("kartu-budget").hidden = !(bulanBerjalan && budget > 0);
    $("atur-budget").hidden = !bulanBerjalan;
    $("atur-budget").textContent = budget > 0 ? "Ubah budget" : "+ Atur budget bulanan";
    if (bulanBerjalan && budget > 0) isiBudget(totalEx);

    tampilkanGrafik(exp);
    isiKategori(exp);

    const semua = [
        ...[...inc].reverse().map(item => ({ jenis: "income", item })),
        ...[...exp].reverse().map(item => ({ jenis: "expense", item }))
    ].sort((a, b) => b.item.date.localeCompare(a.item.date));

    $("bulan-kosong").hidden = semua.length > 0;
    const list = $("bulan-list");
    list.innerHTML = "";
    for (const t of semua) {
        list.appendChild(buatBaris(t, labelTglPendek(t.item.date)));
    }
}

$("bulan-prev").addEventListener("click", function () {
    bulanLihat = geserBulan(bulanLihat, -1);
    tampilkanBulan();
});

$("bulan-next").addEventListener("click", function () {
    bulanLihat = geserBulan(bulanLihat, 1);
    tampilkanBulan();
});

// ===== GOALS =====
function estimasiGoal(goal) {
    if (goal.done) return "";
    if (goal.current >= goal.target) return "Target tercapai";
    if (!goal.mulai) return "";

    const hari = (Date.now() - new Date(goal.mulai).getTime()) / 86400000;
    const bulan = Math.max(1, hari / 30);
    const ritme = goal.current / bulan;
    if (ritme <= 0) return "";

    const sisaBulan = Math.ceil((goal.target - goal.current) / ritme);
    return `Sekitar ${sisaBulan} bulan lagi kalau ritme setor sama`;
}

function tampilkanGoals() {
    $("kartu-goals").hidden = goals.length === 0;
    $("goals-kosong").hidden = goals.length > 0;

    const goalList = $("goal-list");
    goalList.innerHTML = "";
    for (const goal of goals) {
        const persen = Math.min(100, Math.round((goal.current / goal.target) * 100));

        const li = document.createElement("li");
        li.className = goal.done ? "goal-item done" : "goal-item";

        const atas = document.createElement("div");
        atas.className = "baris";
        const nama = document.createElement("strong");
        nama.textContent = goal.name;
        const angka = document.createElement("span");
        angka.textContent = `${formatSingkat(goal.current)} / ${formatSingkat(goal.target)}`;
        atas.append(nama, angka);

        const bar = document.createElement("div");
        bar.className = "bar goal-bar";
        const isi = document.createElement("div");
        isi.style.width = persen + "%";
        bar.appendChild(isi);

        const eta = document.createElement("p");
        eta.className = "goal-eta";
        eta.textContent = estimasiGoal(goal);

        li.append(atas, bar, eta);
        li.addEventListener("click", function () {
            bukaAksiGoal(goal);
        });
        goalList.appendChild(li);
    }
}

function tampilkanSemua() {
    perbaruiLayar();
    tampilkanHome();
    tampilkanBulan();
    tampilkanGoals();
}

// ===== TAB BAWAH =====
function pindahTab(nama) {
    for (const t of document.querySelectorAll(".tab")) {
        t.hidden = t.id !== "tab-" + nama;
    }
    for (const b of document.querySelectorAll("#tab-bar button")) {
        b.classList.toggle("aktif", b.dataset.tab === nama);
    }
    window.scrollTo(0, 0);
}

for (const b of document.querySelectorAll("#tab-bar button")) {
    b.addEventListener("click", function () {
        pindahTab(b.dataset.tab);
    });
}

$("minggu-semua").addEventListener("click", function () {
    bulanLihat = bulanIni();
    tampilkanBulan();
    pindahTab("insight");
});

$("atur-budget").addEventListener("click", function () {
    bukaPanel("panel-budget", "Atur budget");
});

$("goal-baru").addEventListener("click", function () {
    bukaPanel("panel-goal", "Tambah goal");
});

// ===== POP-UP =====
const modal = $("modal");
const panels = document.querySelectorAll(".panel");
const modalJudul = $("modal-title");

function bukaPanel(id, judul) {
    for (const p of panels) p.hidden = (p.id !== id);
    modalJudul.textContent = judul;
    if (id === "panel-budget") {
        $("budget-target").value = budget > 0 ? formatAngka(budget) : "";
    }
    if (!modal.open) modal.showModal();
}

function tutupModal() {
    if (modal.open) modal.close();
}

$("modal-close").addEventListener("click", tutupModal);

// ===== QUICK ADD =====
const quickInput = $("quick-input");
let quickMode = "expense";
let quickModeManual = false;
let quickKat = "lainnya";
let quickKatManual = false;
let quickKunci = "";

function tebakMode(desc) {
    const kunci = desc.toLowerCase().trim();
    if (kataBelajar[kunci]) return "expense";
    if (kataBelajarMasuk[kunci]) return "income";
    // pindah ke pemasukan hanya kalau cocok kata pemasukan DAN tidak cocok kata pengeluaran
    return cariKategori(desc, KATA_MASUK) && !cariKategori(desc, KATA_KUNCI) ? "income" : "expense";
}

function tebakKategori(desc, mode) {
    const kunci = desc.toLowerCase().trim();
    const masuk = mode === "income";
    const belajar = masuk ? kataBelajarMasuk : kataBelajar;
    const daftar = masuk ? KATEGORI_MASUK : KATEGORI;
    if (daftar[belajar[kunci]]) return belajar[kunci];
    return cariKategori(desc, masuk ? KATA_MASUK : KATA_KUNCI) || "lainnya";
}

function parseCepat(teks) {
    const m = teks.trim().match(/^(.*?)\s+([\d.,]+)\s*(rb|ribu|k|jt|juta)?$/i);
    if (!m || !m[1].trim()) return null;
    const satuan = (m[3] || "").toLowerCase();
    const mentah = satuan ? m[2].replace(",", ".") : m[2].replace(/[.,]/g, "");
    const kali = { rb: 1000, ribu: 1000, k: 1000, jt: 1000000, juta: 1000000 }[satuan] || 1;
    const amount = Math.round(Number(mentah) * kali);
    if (!amount || amount <= 0) return null;
    return { desc: m[1].trim(), amount };
}

function resetQuick(mode) {
    quickInput.value = "";
    quickMode = mode;
    quickModeManual = mode === "income";
    quickKat = "lainnya";
    quickKatManual = false;
    quickKunci = "";
    $("quick-date").max = hariIni();
    $("quick-date").value = hariIni();
    perbaruiQuick();
}

function bukaQuick(mode) {
    resetQuick(mode || "expense");
    bukaPanel("panel-quick", "Catat transaksi");
    quickInput.focus();
}

function perbaruiQuick() {
    let teks = quickInput.value;
    if (/^\s*\+/.test(teks)) {
        quickMode = "income";
        quickModeManual = true;
        teks = teks.replace(/^\s*\+\s*/, "");
    }
    const hasil = parseCepat(teks);

    if (hasil && !quickModeManual) quickMode = tebakMode(hasil.desc);

    for (const b of document.querySelectorAll("#quick-mode button")) {
        b.classList.toggle("aktif", b.dataset.mode === quickMode);
    }
    quickInput.placeholder = quickMode === "income" ? "gaji 3,8jt" : "makan siang 15rb";

    const masuk = quickMode === "income";
    const preview = $("quick-preview");
    preview.hidden = !hasil;
    preview.className = "quick-preview " + (masuk ? "masuk" : "keluar");
    $("quick-hint").hidden = !!hasil;
    if (!hasil) return;

    const kunci = quickMode + "|" + hasil.desc.toLowerCase();
    if (kunci !== quickKunci) {
        quickKunci = kunci;
        quickKatManual = false;
    }
    if (!quickKatManual) quickKat = tebakKategori(hasil.desc, quickMode);

    const kat = (masuk ? KATEGORI_MASUK : KATEGORI)[quickKat];
    $("quick-ikon").innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${kat.ikon}"/></svg>`;
    $("quick-nama").textContent = rapikan(hasil.desc);
    $("quick-kat").textContent = `${kat.nama} · ketuk ikon untuk ganti`;
    $("quick-jumlah").textContent = (masuk ? "+ " : "- ") + formatRupiah(hasil.amount);
}

quickInput.addEventListener("input", perbaruiQuick);

for (const b of document.querySelectorAll("#quick-mode button")) {
    b.addEventListener("click", function () {
        quickMode = b.dataset.mode;
        quickModeManual = true;
        quickInput.value = quickInput.value.replace(/^\s*\+\s*/, "");
        perbaruiQuick();
        quickInput.focus();
    });
}

$("quick-ikon").addEventListener("click", function () {
    const urut = quickMode === "income" ? URUT_MASUK : URUT_KELUAR;
    const i = urut.indexOf(quickKat);
    quickKat = urut[(i + 1) % urut.length];
    quickKatManual = true;
    perbaruiQuick();
});

$("quick-form").addEventListener("submit", function (event) {
    event.preventDefault();
    perbaruiQuick();

    const hasil = parseCepat(quickInput.value.replace(/^\s*\+\s*/, ""));
    if (!hasil) {
        alert("Format: nama lalu nominal. Contoh: makan siang 15rb");
        return;
    }

    let tgl = $("quick-date").value || hariIni();
    if (tgl > hariIni()) tgl = hariIni();

    if (quickMode === "income") {
        incomes.push({ desc: rapikan(hasil.desc), type: "income", category: quickKat, amount: hasil.amount, date: tgl });
        if (quickKatManual) {
            kataBelajarMasuk[hasil.desc.toLowerCase()] = quickKat;
            simpanKamus();
        }
    } else {
        if (hasil.amount > hitungSaldo()) {
            alert("Saldo tidak cukup.");
            return;
        }
        expenses.push({ date: tgl, desc: rapikan(hasil.desc), amount: hasil.amount, category: quickKat });
        if (quickKatManual) {
            kataBelajar[hasil.desc.toLowerCase()] = quickKat;
            simpanKamus();
        }
    }

    simpanData();
    tampilkanSemua();
    tutupModal();
});

$("fab").addEventListener("click", function () {
    bukaQuick("expense");
});

// ===== GOAL: BUAT BARU =====
$("add-goal").addEventListener("click", function () {
    const name = $("goal-name").value.trim();
    const target = ambilAngka($("goal-target").value);
    const setoran = ambilAngka($("goal-amount").value);

    if (name === "") {
        alert("Masukkan nama goal.");
        return;
    }
    if (target <= 0) {
        alert("Target goal harus lebih dari 0.");
        return;
    }
    if (setoran > hitungSaldo()) {
        alert("Saldo tidak cukup.");
        return;
    }

    const goalAda = goals.find(g => g.name.toLowerCase() === name.toLowerCase());

    if (goalAda) {
        if (goalAda.done) {
            alert("Goal ini sudah ditandai kebeli. Batalkan tandanya dulu.");
            return;
        }
        goalAda.target = target;
        if (setoran > 0) {
            if (!goalAda.current) goalAda.mulai = hariIni();
            goalAda.current += setoran;
        }
    } else {
        goals.push({
            name,
            target,
            current: setoran,
            done: false,
            mulai: setoran > 0 ? hariIni() : null
        });
    }

    simpanData();
    tampilkanSemua();

    $("goal-name").value = "";
    $("goal-target").value = "";
    $("goal-amount").value = "";
    tutupModal();
});

// ===== BUDGET =====
$("save-budget").addEventListener("click", function () {
    const nilai = ambilAngka($("budget-target").value);
    if (nilai <= 0) {
        alert("Budget harus lebih dari 0.");
        return;
    }
    budget = nilai;
    localStorage.removeItem("budgetContoh");
    simpanData();
    tampilkanSemua();
    tutupModal();
});

// ===== POP-UP NOMINAL (pengganti prompt) =====
let aksiNominal = null;

function mintaNominal(judul, label, awal, aksi) {
    const input = $("nominal-input");
    $("nominal-label").textContent = label;
    input.value = awal > 0 ? formatAngka(awal) : "";
    aksiNominal = aksi;
    bukaPanel("panel-nominal", judul);
    input.focus();
}

$("nominal-simpan").addEventListener("click", function () {
    const nilai = ambilAngka($("nominal-input").value);
    if (nilai <= 0) {
        alert("Nominal harus lebih dari 0.");
        return;
    }
    if (aksiNominal && aksiNominal(nilai) === false) return;
    tutupModal();
});

// ===== AKSI GOAL (ketuk goal) =====
let goalAktif = null;

function bukaAksiGoal(goal) {
    goalAktif = goal;
    $("goal-aksi-info").textContent = `Terkumpul ${formatRupiah(goal.current)} dari ${formatRupiah(goal.target)}`;

    const tombolKebeli = $("aksi-kebeli");
    const labelKebeli = goal.done ? "Batalkan tanda kebeli" : "Tandai sudah kebeli";
    tombolKebeli.setAttribute("aria-label", labelKebeli);
    tombolKebeli.setAttribute("title", labelKebeli);

    $("aksi-divider").hidden = goal.done;
    $("aksi-setor").hidden = goal.done;
    $("aksi-hapus").hidden = goal.done;
    bukaPanel("panel-goal-aksi", goal.name);
}

$("aksi-setor").addEventListener("click", function () {
    const goal = goalAktif;
    mintaNominal(`Setor ke ${goal.name}`, "Setoran (Rp)", 0, function (setoran) {
        if (setoran > hitungSaldo()) {
            alert("Saldo tidak cukup.");
            return false;
        }
        if (!goal.current) goal.mulai = hariIni();
        goal.current += setoran;
        simpanData();
        tampilkanSemua();
    });
});

$("aksi-kebeli").addEventListener("click", function () {
    goalAktif.done = !goalAktif.done;
    simpanData();
    tampilkanSemua();
    tutupModal();
});

$("aksi-hapus").addEventListener("click", function () {
    const ok = confirm(`Hapus goal "${goalAktif.name}"? Uang ${formatRupiah(goalAktif.current)} akan kembali ke saldo.`);
    if (!ok) return;
    goals.splice(goals.indexOf(goalAktif), 1);
    simpanData();
    tampilkanSemua();
    tutupModal();
});

// ===== AKSI TRANSAKSI (ketuk baris) =====
let transaksiAktif = null;

function bukaAksiTransaksi(t) {
    transaksiAktif = t;
    $("transaksi-info").textContent = `${t.item.date || "Tanpa tanggal"} · ${formatRupiah(t.item.amount)}`;
    bukaPanel("panel-transaksi-aksi", t.item.desc);
}

$("transaksi-edit").addEventListener("click", function () {
    const t = transaksiAktif;
    mintaNominal(`Edit ${t.item.desc}`, "Nominal baru (Rp)", t.item.amount, function (baru) {
        const selisih = t.jenis === "income" ? baru - t.item.amount : t.item.amount - baru;
        if (hitungSaldo() + selisih < 0) {
            alert("Saldo jadi minus, nominal tidak bisa diubah ke angka ini.");
            return false;
        }
        t.item.amount = baru;
        simpanData();
        tampilkanSemua();
    });
});

$("transaksi-hapus").addEventListener("click", function () {
    const t = transaksiAktif;
    if (t.jenis === "income" && hitungSaldo() - t.item.amount < 0) {
        alert("Pemasukan ini nggak bisa dihapus, saldo jadi minus.");
        return;
    }
    if (!confirm(`Hapus "${t.item.desc}"?`)) return;
    const daftar = t.jenis === "income" ? incomes : expenses;
    daftar.splice(daftar.indexOf(t.item), 1);
    simpanData();
    tampilkanSemua();
    tutupModal();
});

// ===== MENU TITIK TIGA =====
const menuBtn = $("menu-btn");
const menuPop = $("menu-pop");

function toggleMenu(buka) {
    menuPop.hidden = !buka;
    menuBtn.setAttribute("aria-expanded", String(buka));
}

menuBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    toggleMenu(menuPop.hidden);
});

document.addEventListener("click", function () {
    toggleMenu(false);
});

// ===== RESET =====
$("reset-all").addEventListener("click", function () {
    const ok = confirm("Hapus SEMUA data (pemasukan, goal, pengeluaran, budget)? Tidak bisa di-undo.");
    if (!ok) return;
    for (const k of ["incomes", "goals", "expenses", "budget", "budgetContoh", "kataBelajar", "kataBelajarMasuk"]) {
        localStorage.removeItem(k);
    }
    location.reload();
});

// ===== EXPORT =====
function unduhFiles(teks, namaFile) {
    const blob = new Blob([teks], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = namaFile;
    a.click();

    URL.revokeObjectURL(url);
}

$("export-data").addEventListener("click", function () {
    const data = { incomes, goals, expenses, budget, kataBelajar, kataBelajarMasuk };
    const teks = JSON.stringify(data, null, 2);
    const namaFile = `money-tracker-${hariIni()}.json`;

    const file = new File([teks], namaFile, { type: "application/json" });
    const fileTeks = new File([teks], namaFile, { type: "text/plain" });
    const yangBisa = [file, fileTeks].find(f => navigator.canShare && navigator.canShare({ files: [f] }));

    if (!yangBisa) {
        unduhFiles(teks, namaFile);
        return;
    }

    navigator.share({ files: [yangBisa] }).catch(function (err) {
        if (err.name === "AbortError") return;
        unduhFiles(teks, namaFile);
    });
});

// ===== IMPORT =====
$("import-btn").addEventListener("click", function () {
    $("import-data").click();
});

function petaValid(p) {
    return p && typeof p === "object" && !Array.isArray(p);
}

$("import-data").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
        try {
            const data = JSON.parse(reader.result);
            if (!Array.isArray(data.incomes) || !Array.isArray(data.goals) || !Array.isArray(data.expenses)) {
                throw new Error("format salah");
            }
            if (!confirm("Data sekarang akan DITIMPA isi file. Lanjut?")) return;

            incomes.length = 0;
            incomes.push(...data.incomes);
            goals.length = 0;
            goals.push(...data.goals);
            expenses.length = 0;
            expenses.push(...data.expenses);
            budget = Number(data.budget) || 0;
            if (petaValid(data.kataBelajar)) kataBelajar = data.kataBelajar;
            if (petaValid(data.kataBelajarMasuk)) kataBelajarMasuk = data.kataBelajarMasuk;

            simpanData();
            simpanKamus();
            bulanLihat = bulanIni();
            tampilkanSemua();
        } catch {
            alert("File tidak valid");
        }
    };
    reader.readAsText(file);
    event.target.value = "";
});

// ===== FORMAT NOMINAL OTOMATIS =====
for (const input of document.querySelectorAll(".uang")) {
    input.addEventListener("input", function () {
        const angka = ambilAngka(input.value);
        input.value = angka > 0 ? formatAngka(angka) : "";
    });
}

// ===== LAYAR KOSONG =====
for (const b of document.querySelectorAll(".ajak")) {
    b.addEventListener("click", function () {
        if (b.dataset.panel === "panel-quick") {
            bukaQuick(b.dataset.mode);
        } else {
            bukaPanel(b.dataset.panel, b.dataset.judul);
        }
    });
}

// ===== DATA CONTOH =====
function isiDataContoh() {
    incomes.push(
        { desc: "Gaji bulanan", type: "income", category: "gaji", amount: 3800000, date: hariIni(), contoh: true },
        { desc: "Proyek freelance", type: "income", category: "freelance", amount: 750000, date: hariIni(), contoh: true }
    );
    goals.push(
        { name: "Sepeda", target: 5500000, current: 700000, done: false, mulai: tanggalMundur(60), contoh: true },
        { name: "Kamera", target: 4000000, current: 1200000, done: false, mulai: tanggalMundur(60), contoh: true }
    );

    const pengeluaran = [
        [0, "Makan siang", 30000, "makan"],
        [0, "Bensin", 25000, "transport"],
        [0, "Kopi", 18000, "makan"],
        [1, "Belanja bulanan", 185000, "belanja"],
        [2, "Makan malam", 45000, "makan"],
        [3, "Pulsa", 50000, "lainnya"],
        [4, "Langganan streaming", 60000, "lainnya"],
        [5, "Nonton bioskop", 60000, "lainnya"],
        [6, "Makan siang", 28000, "makan"]
    ];
    for (const [hari, desc, amount, category] of pengeluaran) {
        expenses.push({ date: tanggalMundur(hari), desc, amount, category, contoh: true });
    }

    if (budget <= 0) {
        budget = 2000000;
        localStorage.setItem("budgetContoh", "1");
    }

    simpanData();
    tampilkanSemua();
}

function hapusDataContoh() {
    for (const daftar of [incomes, goals, expenses]) {
        for (let i = daftar.length - 1; i >= 0; i--) {
            if (daftar[i].contoh) daftar.splice(i, 1);
        }
    }
    if (localStorage.getItem("budgetContoh") === "1") {
        budget = 0;
        localStorage.removeItem("budgetContoh");
    }
    simpanData();
    tampilkanSemua();
}

$("contoh-kosong").addEventListener("click", isiDataContoh);

$("hapus-contoh").addEventListener("click", function () {
    if (!confirm("Hapus semua data contoh? Setoran yang kamu tambah ke goal contoh ikut hilang.")) return;
    hapusDataContoh();
});

// ===== MULAI =====
tampilkanSemua();

// refresh pas app dibuka lagi (ganti hari tanpa reload)
document.addEventListener("visibilitychange", function () {
    if (!document.hidden) tampilkanSemua();
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}