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
}

function tampilkanPemasukan() {
    incomeList.innerHTML = "";
    for (const item of incomes) {
        const li = document.createElement("li");
        li.textContent = `${item.desc} (${item.category}) - ${formatRupiah(item.amount)}`;
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
            const input = prompt("Nominal baru:", e.amount);
            if (input === null) return;
            const baru = Number(input);
            if (isNaN(baru) || baru <= 0) {
                alert("Nominal harus angka lebih dari 0." );
                return;
            }
            if (hitungSaldo() + e.amount - baru < 0) {
                alert("Saldo jadi minus, nominal terlalu besar.");
                return;
            }
            e.amount = baru;
            simpanData();
            tampilkanPengeluaran();
            tampilkanBudget();
            tampilkanSaldo();
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
        budgetInfo.textContent = `Budget belum diatur. Terpakai periode ini: ${formatRupiah(terpakai)}`;
        budgetBar.style.width = "0%";
        return;
    }

    const persen = Math.round((terpakai / budget) * 100);
    const sisa = budget - terpakai;
    budgetBar.style.width = Math.min(100, persen) + "%";

    if (sisa >= 0) {
        budgetInfo.textContent = `Terpakai ${formatRupiah(terpakai)} dari ${formatRupiah(budget)} (${persen}%). Sisa ${formatRupiah(sisa)}.`;
        if (persen >= 80) budgetBar.className = "warn";
    } else {
        budgetInfo.textContent = `Over budget ${formatRupiah(-sisa)} ! Terpakai ${formatRupiah(terpakai)} dari ${formatRupiah(budget)}.`;
        budgetBar.className = "over";
        kartuBudget.classList.add("over-card");
    }
}

function tampilkanGoals() {
    goalList.innerHTML = "";
    goals.forEach(function (goal, i) {
        const row = document.createElement("tr");
        if (goal.done) row.className = "done";

        const persen = Math.min(100, Math.round((goal.current / goal.target) * 100));
        const isiKolom = [
            goal.name,
            formatRupiah(goal.target),
            formatRupiah(goal.current),
            persen + "%"
        ];
        for (const isi of isiKolom) {
            const td = document.createElement("td");
            td.textContent = isi;
            row.appendChild(td);
        }

        // kolom checkbox "kebeli"
        const tdCek = document.createElement("td");
        const cek = document.createElement("input");
        cek.type = "checkbox";
        cek.checked = Boolean(goal.done);
        cek.addEventListener("change", function () {
            goal.done = cek.checked;
            simpanData();
            tampilkanGoals();
        });
        tdCek.appendChild(cek);
        row.appendChild(tdCek);

        // kolom hapus (hanya untuk goal yang belum kebeli)
        const tdHapus = document.createElement("td");
        if (!goal.done) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = "Hapus";
            btn.className = "small danger";
            btn.addEventListener("click", function () {
                const ok = confirm(`Hapus goal "${goal.name}"? Uang ${formatRupiah(goal.current)} akan kembali ke saldo.`);
                if (!ok) return;
                goals.splice(i, 1);
                simpanData();
                tampilkanGoals();
                tampilkanSaldo();
            });

            const btnSetor = document.createElement("button");
            btnSetor.type ="button";
            btnSetor.textContent = "+ Setor";
            btnSetor.className = "small";
            btnSetor.addEventListener("click", function () {
                const input = prompt(`Setor berapa ke "${goal.name}"?`);
                if (input === null) return;
                const setoran = Number(input);
                if (isNaN(setoran) || setoran <= 0) {
                    alert("Setoran harus angka lebih dari 0.");
                    return;
                }
                if (setoran > hitungSaldo()) {
                    alert("Saldo tidak cukup.");
                    return;
                }
                goal.current += setoran;
                simpanData();
                tampilkanGoals();
                tampilkanSaldo();
            });
            tdHapus.appendChild(btnSetor);
            tdHapus.appendChild(btn);
        }
        row.appendChild(tdHapus);

        goalList.appendChild(row);
    });
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
    const amount = Number(document.getElementById("income-amount").value);

    if (desc === "" || amount <= 0) {
        alert("Isi deskripsi dan jumlah (harus lebih dari 0).");
        return;
    }

    incomes.push({ desc, category, type, amount });
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
    const target = Number(document.getElementById("goal-target").value);
    const setoran = Number(document.getElementById( "goal-amount").value);

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
    const amount = Number(document.getElementById("expense-amount").value);

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
document.getElementById("budget-target").value = budget > 0 ? budget : "";

document.getElementById("save-budget").addEventListener("click", function () {
    const nilai = Number(document.getElementById("budget-target").value);
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
document.getElementById("export-data").addEventListener("click", function () {
    const data = { incomes, goals, expenses, budget };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json" });
    const file = new File([JSON.stringify(data, null, 2)], `money-tracker-${hariIni()}.json`, { type: "application/json"});
    const fileTeks = new File([JSON.stringify(data, null, 2)], `money-tracker-${hariIni()}.json`, { type: "text/plain" });

    const yangBisa = [file, fileTeks].find(f => navigator.canShare && navigator.canShare({ files: [f] }));
    
    if (yangBisa) {
        navigator.share({ files: [yangBisa] }).catch(function (err) {
            if (err.name !== "AbortError") alert("Share gagal: " + err.name);
        });
        return;
    };
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `money-tracker-${hariIni()}.json`;
    a.click();

    URL.revokeObjectURL(url);
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

            document.getElementById("budget-target").value = budget > 0 ? budget : "";
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
const pilihan = document.getElementById("pilihan");
const panels = document.querySelectorAll(".panel");
const modalJudul = document.getElementById("modal-title");
const modalBack = document.getElementById("modal-back");

function tampilkanPilihan() {
    pilihan.hidden = false;
    for (const p of panels) p.hidden = true;
    modalJudul.textContent = "Mau Tambah Apa?";
    modalBack.hidden = true;
}

function tampilkanPanel(id, judul) {
    pilihan.hidden = true;
    for(const p of panels) p.hidden = (p.id !== id);
    modalJudul.textContent = judul;
    modalBack.hidden = false;
    if(id === "panel-expense") {
        document.getElementById("expense-date").value = hariIni()
    }
}

function tutupModal() {
    modal.close();
}

document.getElementById("fab").addEventListener("click", function () {
    tampilkanPilihan();
    modal.showModal();
});

document.getElementById("modal-close").addEventListener("click", tutupModal);
modalBack.addEventListener("click", tampilkanPilihan);

for (const tombol of pilihan.querySelectorAll("button")) {
    tombol.addEventListener("click", function () {
        tampilkanPanel(tombol.dataset.panel, "Tambah " + tombol.querySelector(".label").textContent);
    });
}

tampilkanSemua();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}