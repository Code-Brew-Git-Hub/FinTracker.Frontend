const navLinks = document.querySelectorAll('.nav a');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(el => el.classList.remove('active'));
        link.classList.add('active');
    });
});

const uploadButtons = document.querySelectorAll('.open-upload');

uploadButtons.forEach(button => {
    button.addEventListener('click', () => {
        window.location.href = 'upload.html';
    });
});