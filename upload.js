const navLinks = document.querySelectorAll('.nav a');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(el => el.classList.remove('active'));
        link.classList.add('active');
    });
});

const homeButton = document.querySelector('.nav a:first-child');

homeButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});

const chooseBtn = document.querySelector(".choose-btn");
const fileInput = document.querySelector("#fileInput");

const tableBody = document.querySelector("tbody");

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

chooseBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", async () => {

    const file = fileInput.files[0];

    console.log(file);

    if (!file) {
        return;
    }

    const formData = new FormData();
    formData.append("files", file);

    try {

        const response = await fetch(
            "http://localhost:5009/api/import",
            {
                method: "POST",
                body: formData
            }
        );

        const responseData = await response.json();

        console.log("Ответ сервера:", responseData);

        if (!responseData.success) {
            alert(responseData.error);
            return;
        }

        const importResult = responseData.data[0];
        console.log(importResult);

        if (!importResult.success) {
            alert(importResult.error);
            return;
        }

        const result = importResult.result;

        console.log(result);

        /*
            =========================
            СТАТИСТИКА
            =========================
        */

        transactionsCount.textContent =
            result.total;

        incomeCount.textContent =
            result.incomeCount;

        expenseCount.textContent =
            result.expenseCount;

        /*
            =========================
            ПЕРИОД
            =========================
        */

        if (result.period) {

            const from = new Date(result.period.from);
            const to = new Date(result.period.to);

            const fromText =
                from.toLocaleDateString("ru-RU");

            const toText =
                to.toLocaleDateString("ru-RU");

            periodText.innerHTML =
                `${fromText} –<br>${toText}`;
        }

        /*
            =========================
            КАТЕГОРИИ
            =========================
        */

        if (result.categories?.length > 0) {

            categoryTags.innerHTML = "";

            result.categories.forEach((category, index) => {

                const colors = [
                    "blue-tag",
                    "orange-tag",
                    "green-tag",
                    "gray-tag"
                ];

                const colorClass =
                    colors[index % colors.length];

                const tag = `
                    <div class="tag ${colorClass}">
                        ${category.name} × ${category.count}
                    </div>
                `;

                categoryTags.innerHTML += tag;
            });
        }

        /*
            =========================
            ТАБЛИЦА
            =========================
        */

        if (result.preview?.length > 0) {

            tableBody.innerHTML = "";

            result.preview.forEach(transaction => {

                console.log(transaction);

                /*
                    ДАТА
                */

                let formattedDate = "—";

                if (transaction.dateUtc) {

                    const date =
                        new Date(transaction.dateUtc);

                    if (!isNaN(date.getTime())) {

                        formattedDate =
                            date.toLocaleDateString("ru-RU");
                    }
                }

                /*
                    СУММА
                */

                const amount =
                    Number(transaction.amount);

                const formattedAmount =
                    amount > 0
                        ? `+${amount} ₽`
                        : `${amount} ₽`;

                /*
                    ЦВЕТ
                */

                let categoryClass = "gray-tag";

                if (amount > 0) {
                    categoryClass = "green-tag";
                }

                if (amount < 0) {
                    categoryClass = "orange-tag";
                }

                /*
                    СТРОКА
                */

                const row = `
                    <tr>

                        <td>
                            ${formattedDate}
                        </td>

                        <td>
                            ${transaction.description || "Без описания"}
                        </td>

                        <td>
                            ${formattedAmount}
                        </td>

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

        console.error("Ошибка:", error);

    }

});