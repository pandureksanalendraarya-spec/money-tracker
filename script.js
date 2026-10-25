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

function hitungPengeluaranBulanIni() {
    const bulanIni = hariIni().slice(0, 7);  //YYYY-MM
    let total = 0;
    for (const e of expenses) {
        if (e.date.startsWith(bulanIni)) total += e.amount;
    }
    return total;
}

// ===== TAMPILAN =====//
function tampilkanSaldo() {
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

function tampilkanPengeluaran() {
    expenseList.innerHTML = "";
    const urut = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    for (const e of urut) {
        const li = document.createElement("li");
        li.textContent = `${e.date} | ${e.desc} - ${formatRupiah(e.amount)}`;
        expenseList.appendChild(li);
    }
}

function tampilkanBudget() {
    const terpakai = hitungPengeluaranBulanIni();
    budgetBar.className = "";

    if (budget <= 0) {
        budgetInfo.textContent = `Budget belum diatur. Terpakai bulan ini: ${formatRupiah(terpakai)}`;
        budgetBar.style.width = "0%";
        return;
    }

    const persen = Math.round((terpakai / budget) *100);
    const sisa = budget - terpakai;
    budgetBar.style.width = Math.min(100, persen) + "%";

    if (sisa >= 0) {
        budgetInfo.textContent = `Terpakai ${formatRupiah(terpakai)} dari ${formatRupiah(budget)} (${persen}%). Sisa ${formatRupiah(sisa)}.`;
        if (persen >= 80) budgetBar.className = "warn";
    } else {
        budgetInfo.textContent = `Over budget ${formatRupiah(-sisa)}! Terpakai ${formatRupiah(terpakai)} dari ${formatRupiah(budget)}.`;
        budgetBar.className = "over";
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
            tdHapus.appendChild(btn);
        }
        row.appendChild(tdHapus);

        goalList.appendChild(row);
    });
}

function tampilkanSemua() {
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
    expenses.push({ date, desc, amount });
    simpanData();
    tampilkanPengeluaran();
    tampilkanBudget();
    tampilkanSaldo();

    document.getElementById("expense-desc").value = "";
    document.getElementById("expense-amount").value = "";
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

tampilkanSemua();