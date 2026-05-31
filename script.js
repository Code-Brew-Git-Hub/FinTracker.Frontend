const navLinks = document.querySelectorAll(".nav a");
const uploadButtons = document.querySelectorAll(".open-upload");
const transactionsButton = document.querySelector(".go-transactions");

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        navLinks.forEach(el => el.classList.remove("active"));
        link.classList.add("active");
    });
});

uploadButtons.forEach(button => {
    button.addEventListener("click", () => {
        window.location.href = "upload.html";
    });
});

if (transactionsButton) {
    transactionsButton.addEventListener("click", () => {
        window.location.href = "transactions.html";
    });
}