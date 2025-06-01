// Minimal Text Editor JavaScript

function format(command) {
    document.execCommand(command, false, null);
}

function setColor(color) {
    document.execCommand("foreColor", false, color);
}

function align(direction) {
    const commandMap = {
        left: 'justifyLeft',
        center: 'justifyCenter',
        right: 'justifyRight',
        justify: 'justifyFull'
    };
    document.execCommand(commandMap[direction], false, null);
}

function undo() {
    document.execCommand("undo", false, null);
}

function redo() {
    document.execCommand("redo", false, null);
}

window.onload = function() {
    document.getElementById('boldBtn').addEventListener('click', () => format('bold'));
    document.getElementById('italicBtn').addEventListener('click', () => format('italic'));
    document.getElementById('underlineBtn').addEventListener('click', () => format('underline'));

    document.getElementById('colorPicker').addEventListener('change', (e) => setColor(e.target.value));

    document.getElementById('alignLeftBtn').addEventListener('click', () => align('left'));
    document.getElementById('alignCenterBtn').addEventListener('click', () => align('center'));
    document.getElementById('alignRightBtn').addEventListener('click', () => align('right'));
    document.getElementById('alignJustifyBtn').addEventListener('click', () => align('justify'));

    document.getElementById('undoBtn').addEventListener('click', () => undo());
    document.getElementById('redoBtn').addEventListener('click', () => redo());
};
