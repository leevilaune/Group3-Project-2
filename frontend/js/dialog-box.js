const dialogdiv = document.getElementById('dialog-box');

setInterval(() => {
    dialogdiv.style.display = dialog.open ? 'block' : 'none';
}, 100);

