<<<<<<< HEAD
<<<<<<< HEAD
const navLinks = document.querySelectorAll('.nav a');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(el => el.classList.remove('active'));
        link.classList.add('active');
    });
});

// переход на страницу загрузки

const uploadButtons = document.querySelectorAll('.open-upload');

uploadButtons.forEach(button => {
    button.addEventListener('click', () => {
        window.location.href = 'upload.html';
    });
=======
const navLinks = document.querySelectorAll('.nav a');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // убираем active у всех
        navLinks.forEach(el => el.classList.remove('active'));
        
        // добавляем к текущему
        link.classList.add('active');
    });
>>>>>>> b171436541a1ae5f86f0e15ef7486c2c3582935f
});
=======
const navLinks = document.querySelectorAll('.nav a');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(el => el.classList.remove('active'));
        link.classList.add('active');
    });
});

// переход на страницу загрузки

const uploadButtons = document.querySelectorAll('.open-upload');

uploadButtons.forEach(button => {
    button.addEventListener('click', () => {
        window.location.href = 'upload.html';
    });
});
>>>>>>> b2f09bad7dfa3eb933fdae4d935860bd3723f31b
