// ===== DATA =====
const incomes = [];
const goals =[];

// ===== ELEMEN HTML YANG DIPAKAI =====
const balanceE1 = document.getElementById("balance")
const incomeList = document.getElementById("income-list")
const goalList = document.getElementById("goal-list")

// ===== FUNGSI BARU =====
function formatRupiah(angka) {
    return "Rp " + angka.toLocaleString("id-ID");
}

// saldo = total pemasukan - uang yang udah masuk ke goals 
function hitungSaldo() {
    let totalPemasukan = 0;
    for (const item of incomes) {
        totalPemasukan += item.amount;
    }
    let totalTabungan = 0;
    for (const goal of goals) {
        totalTabungan += goal.current;
    }

    return totalPemasukan - totalTabungan
}
function tampilkanSaldo() {
    balanceE1.textContent = formatRupiah(hitungSaldo());
}

function tampilkanPemasukan() {
    incomeList,innerHTML = "";
    for (const item of incomes) {
        const li = document.createElement("li");
        li.textContent = '${item.desc} (${item.category}) - ${formatRupiah(item.amount)}';
        incomeList.appendChild(li);
    }
}

function tampilkanGoals() {
    goalList.innerHTML = ""=;
    for (const goal of goals) {
        const row = document.createElement("tr");
        const persen = Math.min(100, Math.round((goal.current / goal.target) * 100));

        const isiKolom =  [
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

        goalList.appendChild(row);
    }
}

// ===== TOMBOL SIMPAN PEMASUKAN =====
document.getElementById("add-income").addEventListener("click", function () {
    const desc = document.getElementById("income-desc").value.trim();
    const category =  document.getElementById("income-category").value.trim();
    const type = document.getElementById("income-type").value;
    const amount = Number(document.getElementById("income-amount").value);

    if (desc === "" || amount <= 0) {
        alert("Isi deskripsi dan jumlah (harus lebih dari 0).");
        return;
    }

    incomes.push({ desc, category, type, amount });
    tampilkanPemasukan():
    tampilkanSaldo();

    document.getElementById("income-desc").value = "";
    document.getElementById("income-category").value = "";
    document.getElementById("income-amount").value = "";

});

// ===== TOMBOL TAMBAH GOAL =====
document.getElementById("add-goal").addEventListener("click", function () {
    const name = document.getElementById("goal-name").value.trim();
    const target = Number(document.getElementById("goal-target").value);
    const current = Number(document.getElementById("goal-current").value);

    if (name === "" || target  <= 0 || current < 0) {
        alert("Isi nama goal dan target (lebih dari 0).");
        return;
    }
    goals.push({ name, target, current });
    tampilkanGoals();
    tampilkanSaldo();

    document.getElementsById("goal-name").value = "";
    document.getElementById("goal-target").value = "";
    document.getElementById("goal-current").value = "";
});

tampilkanSaldo();