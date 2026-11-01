// ===== DATA (dimuat dari localStorage) =====
function muatData(kunci) {
    try {
        return JSON.parse(localStorage.getItem(kunci)) || [];
    } catch {
        return [];
    }
}

function simpanData() {
    localStorage.setItem("incomes", JSON.stringify(incomes));
    localStorage.setItem("goals", JSON.stringify(goals));
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("budget", String(budget));
}

const incomes = muatData("incomes");
const goals = muatData("goals");
const expenses = muatData("expenses");
let budget = Number(localStorage.getItem("budget")) || 0;

// ===== ELEMEN =====
const balanceEl = document.getElementById("balance");
const goalList =  document.getElementById("goal-list");
const budgetInfo = document.getElementById("budget-info");
const budgetBar =  document.getElementById("budget-bar");
const kartuBudget = document.querySelector(".budget");
const terakhirList = document.getElementById("terakhir-list");
const chartEl = document.getElementById("chart");

// ===== FUNGSI BANTU =====
function formatRupiah(angka) {
    return "Rp " + angka.toLocaleString("id-ID"); 
}

function hariIni() {
    return new Date().toLocaleDateString("sv-SE"); // format YYYY-MM-DD
}

function formatAngka(n) {
    return n.toLocaleString("id-ID");
}

function ambilAngka(teks) {
    return Number(teks.replace(/\D/g, ""));
}

function formatSingkat(n) {
    if (n >= 1000000) {
        return (n / 1000000).toLocaleString("id-ID", {maximumFractionDigits: 1 }) + "jt";
    }
    if (n >= 1000) {
        return Math.round(n / 1000).toLocaleString("id-ID") + "rb";
    }
    return String(n);
}

// saldo = pemasukan - setoran goal - pengeluaran
function hitungSaldo() {
    let total = 0;
    for (const item of incomes) total += item.amount;
    for (const goal of goals) total -= goal.current;
    for (const e of expenses) total -= e.amount;
    return total;
}
// tampilkan/sembunyikan kartu sesuai isi data
function perbaruiLayar() {
    const adaData = incomes.length > 0 || goals.length > 0 || expenses.length > 0 || budget > 0;
    document.getElementById("empty-state").hidden = adaData;
    document.getElementById("konten").hidden = !adaData;

    document.getElementById("kartu-goals").hidden = goals.length === 0;
    document.getElementById("kartu-budget").hidden = budget <= 0;
    document.getElementById("kartu-chart").hidden = expenses.length === 0;
    document.getElementById("kartu-terakhir").hidden = incomes.length === 0 && expenses.length === 0;
}

// pengeluaran bulan lama otomatis disembunyikan (archived) saat masuk bulan baru
function arsipkanBulanLama() {
    const bulanIni = hariIni().slice(0, 7); 
    let berubah = false;
    for (const e of expenses) {
        if (!e.archived && e.date.slice(0, 7) < bulanIni) {
            e.archived = true;
            berubah = true;
        }
    }
    if (berubah) simpanData();
}

// ===== TAMPILAN =====//
function tampilkanSaldo() {
    perbaruiLayar();
    balanceEl.textContent = formatRupiah(hitungSaldo());

    const bulan = new Date().toLocaleDateString("id-ID", { month: "long" });
    document.getElementById("saldo-label").textContent = `Saldo · ${bulan}`;

    const bulanIni = hariIni().slice(0, 7);
    let totalIncome = 0;
    for (const item of incomes) {
        if (item.date && item.date.slice(0, 7) === bulanIni) totalIncome += item.amount;
    }

    document.getElementById("stat-income").textContent = "+ " + formatAngka(totalIncome);
    document.getElementById("stat-expense").textContent = "- " + formatAngka(hitungPengeluaranBulanIni());
}

function hitungPengeluaranBulanIni() {
    let total = 0;
    for (const e of expenses) {
        if (!e.archived) total += e.amount;
    }
    return total;
}

function tampilkanTransaksi() {
    tampilkanTerakhir();
    tampilkanGrafik();
}

function tampilkanTerakhir() {
    terakhirList.innerHTML = "";
    const semua = [
        ...[...incomes].reverse().map(item => ({ jenis: "income", item })),
        ...[...expenses].reverse().filter(e => !e.archived).map(item => ({ jenis: "expense", item}))
    ];
    semua.sort((a, b) => (b.item.date || "").localeCompare(a.item.date ||  ""));

    for (const t of semua.slice(0, 10)) {
        const li = document.createElement("li");

        const nama = document.createElement("span");
        nama.textContent  = t.item.desc;

        const jumlah = document.createElement("strong");
        if (t.jenis === "income") {
            jumlah.textContent = "+ " + formatRupiah(t.item.amount);
        }

        li.append(nama, jumlah);
        li.addEventListener("click", function () {
            bukaAksiTransaksi(t);
        });
        terakhirList.appendChild(li);
    }
}

function tampilkanGrafik() {
    chartEl.innerHTML = "";
    const namaHari = ["M", "S", "S", "R", "K", "J", "S"];

    const hari = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        hari.push(d);
    }

    const total = hari.map(function (d) {
        const tgl = d.toLocaleDateString("sv-SE");
        let t = 0;
        for (const e of expenses) {
            if (e.date === tgl) t += e.amount;
        }
        return t;
    });
    const maks = Math.max(...total, 1);

    hari.forEach(function (d, i) {
        const kolom = document.createElement("div");
        kolom.className = i === 6 ? "kolom hari-ini" : "kolom";

        const area = document.createElement("div");
        area.className = "area";
        const batang = document.createElement("div");
        batang.className = "batang";
        batang.style.height = Math.max(10, Math.round((total[i] / maks) * 10)) + "%";
        batang.title = formatRupiah(total[i]);
        area.appendChild(batang);

        const label = document.createElement("span");
        label.textContent = namaHari[d.getDay()];

        kolom.append(area, label);
        chartEl.appendChild(kolom);
    });
}

function tampilkanBudget() {
    perbaruiLayar();
    const terpakai = hitungPengeluaranBulanIni();
    budgetBar.className = "";
    kartuBudget.classList.remove("over-card");

    if (budget <= 0) {
        budgetBar.style.width = "0%";
        return;
    }

    const persen = Math.round((terpakai / budget) * 100);
    const sisa = budget - terpakai;
    budgetBar.style.width = Math.min(100, persen) + "%";

    if (sisa >= 0) {
        budgetInfo.textContent = `Sisa Rp ${formatSingkat(sisa)}`;
        if (persen >= 80) budgetBar.className = "warn";
    } else {
        budgetInfo.textContent = `Over Rp ${formatSingkat(-sisa)}`;
        budgetBar.className = "over";
        kartuBudget.classList.add("over-card");
    }
}

function tampilkanGoals() {
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

        li.append(atas, bar);
        li.addEventListener("click", function () {
            bukaAksiGoal(goal);
        });
        goalList.appendChild(li);
    }

}


function tampilkanSemua() {
    arsipkanBulanLama();
    tampilkanSaldo();
    tampilkanTransaksi();
    tampilkanGoals();
    tampilkanTransaksi();
    tampilkanBudget();
}

// ===== PEMASUKAN =====
document.getElementById("add-income").addEventListener("click", function () {
    const desc =document.getElementById("income-desc").value.trim();
    const category = document.getElementById("income-category").value.trim();
    const type = document.getElementById("income-type").value;
    const date = document.getElementById("income-date").value;
    const amount = ambilAngka(document.getElementById("income-amount").value);

    if (date === "" || desc === "" || amount <= 0) {
        alert("Isi tanggal, deskripsi, dan jumlah (harus lebih dari 0).");
        return;
    }

    incomes.push({ desc, category, type, amount, date });
    simpanData();
    tampilkanTransaksi();
    tampilkanSaldo();

    document.getElementById("income-desc").value = "";
    document.getElementById("income-category").value = "";
    document.getElementById("income-amount").value = "";
    tutupModal();
});

// ===== GOAL =====
document.getElementById("add-goal").addEventListener("click", function () {
    const name = document.getElementById("goal-name").value.trim();
    const target = ambilAngka(document.getElementById("goal-target").value);
    const setoran = ambilAngka(document.getElementById( "goal-amount").value);

    if (name === "" || setoran <= 0) {
        alert("Isi nama goal dan setoran (lebih dari 0).");
        return;
    }
    if (setoran > hitungSaldo()) {
        alert("Saldo tidak cukup.");
        return;
    }

    const goalAda = goals.find(g => g.name.toLowerCase() === name.toLowerCase());

    if (goalAda) {
        if (goalAda.done) {
            alert("Goal ini sudah ditandai kebeli. Uncheck dulu kalau mau nambah setoran.");
            return;
        }
        goalAda.current += setoran;
        if (target > 0) goalAda.target = target;
    } else {
        if (target <= 0) {
            alert("Goal baru butuh target (lebih dari 0).");
            return;
        }
        goals.push({ name, target, current: setoran, done: false });
    }

    simpanData();
    tampilkanGoals();
    tampilkanSaldo();

    document.getElementById("goal-name").value = "";
    document.getElementById("goal-target").value = "";
    document.getElementById("goal-amount").value = "";
    tutupModal();
});

// ===== PENGELUARAN =====
document.getElementById("expense-date").value = hariIni();

document.getElementById("add-expense").addEventListener("click", function () {
    const date = document.getElementById("expense-date").value;
    const desc = document.getElementById("expense-desc").value.trim();
    const amount = ambilAngka(document.getElementById("expense-amount").value);

    if (date === "" || desc === "" || amount <= 0) {
        alert("Isi tanggal, deskripsi, dan jumlah(lebih dari 0).");
        return;
    }
    if (amount > hitungSaldo()) {
        alert("Saldo tidak cukup.");
        return;
    }
    expenses.push({ date, desc, amount, archived: false });
    simpanData();
    tampilkanTransaksi();
    tampilkanBudget();
    tampilkanSaldo();

    document.getElementById("expense-desc").value = "";
    document.getElementById("expense-amount").value = "";
    tutupModal();
});

// ===== BUDGET  =====
document.getElementById("budget-target").value = budget > 0 ? formatAngka(budget) : "";

document.getElementById("save-budget").addEventListener("click", function () {
    const nilai = ambilAngka(document.getElementById("budget-target").value);
    if (nilai <= 0) {
        alert("Budget harus lebih dari 0.");
        return;
    }
    budget = nilai;
    simpanData();
    tampilkanBudget();
    tutupModal();
});

// ===== RESET =====
document.getElementById("reset-all").addEventListener("click", function () {
const ok = confirm("Hapus SEMUA data (pemasukan, goal, pengeluaran, budget)? Tidak bisa di-undo.");
if (!ok) return;
localStorage.removeItem("incomes");
localStorage.removeItem("goals");
localStorage.removeItem("expenses");
localStorage.removeItem("budget");
location.reload();
});

// ===== EXPORT =====
function unduhFiles(teks, namaFile) {
    const blob = new Blob([teks], {type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = namaFile;
    a.click();

    URL.revokeObjectURL(url);
}

document.getElementById("export-data").addEventListener("click", function () {
    const data = { incomes, goals, expenses, budget };
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
document.getElementById("import-btn").addEventListener("click", function () {
    document.getElementById("import-data").click();
});

document.getElementById("import-data").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
        try {
            const data = JSON.parse(reader.result);
            if (!Array.isArray(data.incomes) || !Array.isArray(data.goals) || !Array.isArray(data.expenses)) {
                throw new Error("format salah");
            }
            if (!confirm("Data sekarang akan DITIMPA isi file. Lanjut")) return;

            incomes.length = 0;
            incomes.push(...data.incomes);
            goals.length = 0;
            goals.push(...data.goals);
            expenses.length = 0;
            expenses.push(...data.expenses);
            budget = Number(data.budget) || 0;

            document.getElementById("budget-target").value = budget > 0 ? formatAngka(budget) : "";
            simpanData();
            tampilkanSemua();
        } catch {
            alert("File tidak valid");
        }
    };
    reader.readAsText(file);
    event.target.value = "";
});

// ===== PERIODE BARU =====
document.getElementById("periode-baru").addEventListener("click", function () {
    if (!confirm("Mulai periode baru? Pengeluaran lama disembunyikan, saldo tetap.")) return;
    for (const e of expenses) e.archived = true;
    simpanData();
    tampilkanTransaksi();
    tampilkanBudget();
    tampilkanSaldo();
});

// ===== POP-UP TAMBAH DATA =====
const modal = document.getElementById("modal");
const panels = document.querySelectorAll(".panel");
const modalJudul = document.getElementById("modal-title");

function bukaPanel(id, judul) {
    for (const p of panels) p.hidden = (p.id !== id);
    modalJudul.textContent = judul;
    if (id === "panel-expense") {
        document.getElementById("expense-date").value = hariIni();
    }
    if (id === "panel-income") {
        document.getElementById("income-date").value = hariIni();
    }
    if (!modal.open) modal.showModal();
}

function tutupModal() {
    modal.close();
}

// ===== POP-UP NOMINAL (pengganti prompt) =====
let aksiNominal = null;

function mintaNominal(judul, label, awal, aksi) {
    const input = document.getElementById("nominal-input");
    document.getElementById("nominal-label").textContent = label;
    input.value = awal > 0 ? formatAngka(awal) : "";
    aksiNominal = aksi;
    bukaPanel("panel-nominal", judul);
    input.focus();
}

document.getElementById("nominal-simpan").addEventListener("click", function () {
    const nilai = ambilAngka(document.getElementById("nominal-input").value);
    if (nilai <= 0) {
        alert("Nominal harus lebih dari 0.");
        return;
    }
    if (aksiNominal && aksiNominal(nilai) === false) return;
    tutupModal();
})

document.getElementById("modal-close").addEventListener("click", tutupModal);

// ===== AKSI GOAL (ketuk goal) =====
let goalAktif = null;

function bukaAksiGoal(goal) {
    goalAktif = goal;
    document.getElementById("goal-aksi-info").textContent =
    `Terkumpul ${formatRupiah(goal.current)} dari ${formatRupiah(goal.target)}`;
    document.getElementById("aksi-kebeli").textContent = 
    goal.done ? "Batalkan tanda kebeli" : "Tandai sudah kebeli";
    document.getElementById("aksi-setor").hidden = goal.done;
    document.getElementById("aksi-hapus").hidden = goal.done;
    bukaPanel("panel-goal-aksi", goal.name);
}

document.getElementById("aksi-setor").addEventListener("click", function () {
    const goal = goalAktif;
    mintaNominal(`Setor ke ${goal.name}`, "Setoran (Rp)", 0, function (setoran) {
        if (setoran > hitungSaldo()) {
            alert("Saldo tidak cukup.")
            return false;
        }
        goal.current += setoran;
        simpanData();
        tampilkanGoals();
        tampilkanSaldo();
    });
});

document.getElementById("aksi-kebeli").addEventListener("click", function () {
    goalAktif.done = !goalAktif.done;
    simpanData();
    tampilkanGoals();
    tutupModal();
});

document.getElementById("aksi-hapus").addEventListener("click", function () {
    const ok = confirm(`Hapus goal "${goalAktif.name}"? Uang ${formatRupiah(goalAktif.current)} akan kembali ke saldo.`);
    if (!ok) return;
    goals.splice(goals.indexOf(goalAktif), 1);
    simpanData();
    tampilkanGoals();
    tampilkanSaldo();
    tutupModal();
});

// ===== AKSI TRANSAKSI (ketuk baris di "Terakhir") =====
let transaksiAktif = null;

function bukaAksiTransaksi(t) {
    transaksiAktif = t;
    document.getElementById("transaksi-info").textContent =
    `${t.item.date || "Tanpa tanggal"} · ${formatRupiah(t.item.amount)}`;
    bukaPanel("panel-transaksi-aksi", t.item.desc);
}

document.getElementById("transaksi-edit").addEventListener("click", function () {
    const t = transaksiAktif;
    mintaNominal(`Edit ${t.item.desc}`, "Nominal baru (Rp)", t.item.amount, function (baru) {
        const selisih = t.jenis === "income" ? baru = t.item.amount : t.item.amount - baru;
        if (hitungSaldo() + selisih < 0) {
            alert("Saldo jadi minus, nominal tidak bisa diubah ke angka ini.");
            return false;
        }
        t.item.amount = baru;
        simpanData();
        tampilkanTransaksi();
        tampilkanBudget();
        tampilkanSaldo();
    });
});

document.getElementById("transaksi-hapus").addEventListener("click", function () {
    const t = transaksiAktif;
    if (t.jenis === "income" && hitungSaldo() - t.item.amount < 0) {
        alert("Pemasukan ini nggak bisa dihapus, saldo jadi minus.");
        return;
    }
    if (!confirm(`Hapus "${t.item.desc}"?`)) return;
    const daftar = t.jenis === "income" ? incomes : expenses;
    daftar.splice(daftar.indexOf(t.item), 1);
    simpanData();
    tampilkanTransaksi();
    tampilkanBudget();
    tampilkanSaldo();
    tutupModal();
});

// ===== TOMBOL + (SPEED DIAL) =====
const fabMenu = document.getElementById("fab-menu");
const fabBackdrop = document.getElementById("fab-backdrop");

function toggleFab(buka) {
    fabMenu.classList.toggle("open", buka);
    fabBackdrop.classList.toggle("open", buka);
}

document.getElementById("fab").addEventListener("click", function () {
    toggleFab(!fabMenu.classList.contains("open"));
});

fabBackdrop.addEventListener("click", function () {
    toggleFab(false);
});

for (const item of document.querySelectorAll(".fab-item")) {
    item.addEventListener("click", function () {
        toggleFab(false);
        bukaPanel(item.dataset.panel, "Tambah " + item.querySelector(".label").textContent);
    });
}

// ===== MENU TITIK TIGA =====
const menuBtn = document.getElementById("menu-btn");
const menuPop = document.getElementById("menu-pop")

function  toggleMenu(buka) {
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

// ===== FORMAT NOMINAL OTOMATIS =====
for (const input of document.querySelectorAll(".uang")) {
    input.addEventListener("input", function () {
        const angka = ambilAngka(input.value);
        input.value = angka > 0 ? formatAngka(angka) : "";
    });
}

tampilkanSemua();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}