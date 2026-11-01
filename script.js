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
const incomeList = document.getElementById("income-list");
const goalList =  document.getElementById("goal-list");
const expenseList = document.getElementById("expense-list");
const budgetInfo = document.getElementById("budget-info");
const budgetBar =  document.getElementById("budget-bar");
const kartuBudget = document.querySelector(".budget");

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

    document.getElementById("kartu-income").hidden = incomes.length === 0;
    document.getElementById("kartu-goals").hidden = goals.length === 0;
    document.getElementById("kartu-expense").hidden = expenses.length === 0;
    document.getElementById("kartu-budget").hidden = budget <= 0;
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

function tampilkanPemasukan() {
    incomeList.innerHTML =  "";
    const urut = [...incomes].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    for (const item of urut) {
        const li = document.createElement("li");

        const kategori = item.category ? ` (${item.category})` : "";
        const tipe = item.type === "other" ? " [Lainnya]" : "";
        const tanggal = item.date ? `${item.date} | ` : "";
        const teks = document.createElement("span");
        teks.textContent = `${tanggal}${item.desc}${kategori}${tipe} - ${formatRupiah(item.amount)}`;

        const btnHapus = document.createElement("button");
        btnHapus.type = "button";
        btnHapus.textContent = "Hapus";
        btnHapus.className = "small danger";
        btnHapus.addEventListener("click", function () {
            if (hitungSaldo() - item.amount < 0) {
                alert("Pemasukan ini nggak bisa dihapus, saldo jadi minus.");
                return;
            }
            if (!confirm(`Hapus "${item.desc}"?`)) return;
            incomes.splice(incomes.indexOf(item), 1);
            simpanData();
            tampilkanPemasukan();
            tampilkanSaldo();
        });

        li.append(teks, btnHapus);
        incomeList.appendChild(li);
    }
}

function hitungPengeluaranBulanIni() {
    let total = 0;
    for (const e of expenses) {
        if (!e.archived) total += e.amount;
    }
    return total;
}

function tampilkanPengeluaran() {
    expenseList.innerHTML = "";
    let totalHariIni = 0;
    for (const e of expenses) {
        if (!e.archived && e.date === hariIni ()) totalHariIni += e.amount;
    }
    document.getElementById("expense-today").textContent = `Pengeluaran hari ini: ${formatRupiah(totalHariIni)}`;
    const urut = expenses.filter (e => !e.archived).sort ((a, b) => b.date.localeCompare(a.date));
    for (const e of urut) {
        const li = document.createElement("li");

        const teks = document.createElement("span");
        teks.textContent = `${e.date} | ${e.desc} - ${formatRupiah(e.amount)}`;

        const btnEdit = document.createElement("button");
        btnEdit.type = "button";
        btnEdit.textContent = "Edit";
        btnEdit.className = "small";
        btnEdit.addEventListener("click", function () {
            mintaNominal("Edit Pengeluaran", "Nominal baru (Rp)", e.amount, function (baru) {
                if (hitungSaldo() + e.amount - baru < 0) {
                    alert("Saldo jadi minus, nominal terlalu besar.");
                    return false;
                }
                e.amount = baru;
                simpanData();
                tampilkanPengeluaran();
                tampilkanBudget();
                tampilkanSaldo();
            });
        });
        
            

            const btnHapus = document.createElement("button");
            btnHapus.type = "button";
            btnHapus.textContent = "Hapus";
            btnHapus.className = "small danger";
            btnHapus.addEventListener("click", function () {
                if (!confirm(`Hapus "${e.desc}"?`)) return;
                expenses.splice(expenses.indexOf(e), 1);
                simpanData();
                tampilkanPengeluaran();
                tampilkanBudget();
                tampilkanSaldo();
            });

            li.append(teks, btnEdit, btnHapus);
            expenseList.appendChild(li);
    }
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
    tampilkanPemasukan();
    tampilkanGoals();
    tampilkanPengeluaran();
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
    tampilkanPemasukan();
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
    tampilkanPengeluaran();
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

// ===== RESET PENGELUARAN =====
document.getElementById("reset-expenses").addEventListener("click", function () {
    if (!confirm("Mulai periode baru? Pengeluaran  lama disembunyikan, saldo tetap.")) return;
    for (const e of expenses) e.archived = true;
    simpanData();
    tampilkanPengeluaran();
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