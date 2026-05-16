<<<<<<< HEAD
<<<<<<< HEAD
// переключение пунктов меню

const navLinks = document.querySelectorAll('.nav a');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(el => el.classList.remove('active'));
        link.classList.add('active');
    });
});

// переключение импорт / вручную

const switchButtons = document.querySelectorAll('.switch-btn');

switchButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchButtons.forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
    });
});

// переход на главную

const homeButton = document.querySelector('.go-home');

homeButton.addEventListener('click', () => {
    window.location.href = 'index.html';
=======
// переключение пунктов меню

const navLinks = document.querySelectorAll('.nav a');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(el => el.classList.remove('active'));
        link.classList.add('active');
    });
});

// переключение импорт / вручную

const switchButtons = document.querySelectorAll('.switch-btn');

switchButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchButtons.forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
    });
>>>>>>> b171436541a1ae5f86f0e15ef7486c2c3582935f
});
=======
// переключение пунктов меню

const navLinks = document.querySelectorAll('.nav a');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(el => el.classList.remove('active'));
        link.classList.add('active');
    });
});

// переключение импорт / вручную

const switchButtons = document.querySelectorAll('.switch-btn');

switchButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchButtons.forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
    });
});

// переход на главную

const homeButton = document.querySelector('.go-home');

homeButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});
>>>>>>> b2f09bad7dfa3eb933fdae4d935860bd3723f31b
