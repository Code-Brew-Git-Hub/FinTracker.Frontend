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