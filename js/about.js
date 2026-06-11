document.addEventListener("DOMContentLoaded", () => {
    const uploadButton =
        document.querySelector(".btn");

    if (uploadButton) {
        uploadButton.addEventListener("click", () => {
            window.location.href = "upload.html";
        });
    }
});