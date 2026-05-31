const navLinks = document.querySelectorAll(".nav a");

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        navLinks.forEach(el => el.classList.remove("active"));
        link.classList.add("active");
    });
});

const homeButton =
    document.querySelector(".go-home");

const transactionsLink =
    document.querySelector(".go-transactions");

const uploadHeaderButton =
    document.querySelector(".go-upload");

const chooseBtn =
    document.querySelector(".choose-btn");

const fileInput =
    document.querySelector("#fileInput");

const dropzone =
    document.querySelector("#dropzone");

const importButton =
    document.querySelector(".import-btn");

const cancelButton =
    document.querySelector(".cancel-btn");

const tableBody =
    document.querySelector("tbody");

const transactionsCount =
    document.querySelector(".transactions-count");

const incomeCount =
    document.querySelector(".income-count");

const expenseCount =
    document.querySelector(".expense-count");

const periodText =
    document.querySelector(".period-text");

const categoryTags =
    document.querySelector(".category-tags");

/*
    =========================
    НАВИГАЦИЯ
    =========================
*/

homeButton.addEventListener("click", () => {
    window.location.href = "index.html";
});

if (transactionsLink) {
    transactionsLink.addEventListener("click", () => {
        const imported =
            localStorage.getItem("transactionsImported");

        if (imported === "true") {
            window.location.href = "transactions.html";
        } else {
            alert("Сначала импортируйте хотя бы один файл");
        }
    });
}

if (uploadHeaderButton) {
    uploadHeaderButton.addEventListener("click", () => {
        window.location.href = "upload.html";
    });
}

if (cancelButton) {
    cancelButton.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

/*
    =========================
    ВЫБОР ФАЙЛА
    =========================
*/

chooseBtn.addEventListener("click", () => {
    fileInput.click();
});

/*
    =========================
    DRAG & DROP
    =========================
*/

if (dropzone) {
    dropzone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropzone.style.borderColor = "#2F80ED";
        dropzone.style.background = "#EDF5FF";
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.style.borderColor = "#B9D4FA";
        dropzone.style.background = "#F5F9FF";
    });

    dropzone.addEventListener("drop", async (event) => {
        event.preventDefault();

        dropzone.style.borderColor = "#B9D4FA";
        dropzone.style.background = "#F5F9FF";

        const files = event.dataTransfer.files;

        if (!files.length) {
            return;
        }

        await uploadFiles(files);
    });
}

/*
    =========================
    ЗАГРУЗКА ФАЙЛОВ
    =========================
*/

async function uploadFiles(files) {
    const formData = new FormData();

    for (const file of files) {
        console.log(file);
        formData.append("files", file);
    }

    try {
        const response = await fetch(
            "http://localhost:5009/api/import",
            {
                method: "POST",
                body: formData
            }
        );

        const responseData =
            await response.json();

        console.log("Ответ сервера:", responseData);

        if (!responseData.success) {
            alert(responseData.error);
            return;
        }

        const imports =
            responseData.data;

        const importResult =
            imports[imports.length - 1];

        if (!importResult.success) {
            alert(importResult.error);
            return;
        }

        const result =
            importResult.result;

        localStorage.setItem(
            "transactionsImported",
            "true"
        );

        transactionsCount.textContent =
            result.total;

        incomeCount.textContent =
            result.incomeCount;

        expenseCount.textContent =
            result.expenseCount;

        if (result.period) {
            const from =
                new Date(result.period.from);

            const to =
                new Date(result.period.to);

            periodText.innerHTML =
                `${from.toLocaleDateString("ru-RU")} –<br>${to.toLocaleDateString("ru-RU")}`;
        }

        if (result.categories?.length > 0) {
            categoryTags.innerHTML = "";

            result.categories.forEach((category, index) => {
                const colors = [
                    "blue-tag",
                    "orange-tag",
                    "green-tag",
                    "gray-tag"
                ];

                const tag = `
                    <div class="tag ${colors[index % colors.length]}">
                        ${category.name} × ${category.count}
                    </div>
                `;

                categoryTags.innerHTML += tag;
            });
        }

        if (result.preview?.length > 0) {
            tableBody.innerHTML = "";

            const lastTransactions =
                result.preview.slice(0, 5);

            lastTransactions.forEach(transaction => {
                let formattedDate = "—";

                if (transaction.dateUtc) {
                    formattedDate =
                        new Date(
                            transaction.dateUtc
                        ).toLocaleDateString("ru-RU");
                }

                const amount =
                    Number(transaction.amount);

                const formattedAmount =
                    amount > 0
                        ? `+${amount.toLocaleString("ru-RU")} ₽`
                        : `${amount.toLocaleString("ru-RU")} ₽`;

                let categoryClass =
                    "gray-tag";

                if (amount > 0) {
                    categoryClass =
                        "green-tag";
                }

                if (amount < 0) {
                    categoryClass =
                        "orange-tag";
                }

                const row = `
                    <tr>
                        <td>${formattedDate}</td>

                        <td>${transaction.description || "Без описания"}</td>

                        <td>${formattedAmount}</td>

                        <td>
                            <span class="table-tag ${categoryClass}">
                                ${transaction.category}
                            </span>
                        </td>
                    </tr>
                `;

                tableBody.innerHTML += row;
            });
        }

    } catch (error) {
        console.error(error);
        alert("Ошибка загрузки файла");
    }
}

/*
    =========================
    INPUT FILE
    =========================
*/

fileInput.addEventListener("change", async () => {
    const files =
        fileInput.files;

    if (!files.length) {
        return;
    }

    await uploadFiles(files);

    fileInput.value = "";
});

/*
    =========================
    КНОПКА ИМПОРТА
    =========================
*/

if (importButton) {
    importButton.addEventListener("click", () => {
        const imported =
            localStorage.getItem("transactionsImported");

        if (imported === "true") {
            window.location.href = "transactions.html";
        } else {
            alert("Сначала загрузите файл");
        }
    });
}