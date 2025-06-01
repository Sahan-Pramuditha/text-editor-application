// Text Editor JavaScript
class TextEditor {
    constructor() {
        this.editor = document.getElementById('textEditor');
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 100;
        
        this.initializeEditor();
        this.bindEvents();
        this.saveState();
    }

    initializeEditor() {
        // Set initial focus
        this.editor.focus();
        
        // Enable rich text editing
        document.execCommand('styleWithCSS', false, true);
    }

    bindEvents() {
        // Toolbar button events
        document.getElementById('boldBtn').addEventListener('click', () => this.toggleBold());
        document.getElementById('underlineBtn').addEventListener('click', () => this.toggleUnderline());
        document.getElementById('italicBtn').addEventListener('click', () => this.toggleItalic());
        document.getElementById('colorPicker').addEventListener('change', (e) => this.changeColor(e.target.value));
        
        // Alignment buttons
        document.getElementById('alignLeftBtn').addEventListener('click', () => this.setAlignment('left'));
        document.getElementById('alignCenterBtn').addEventListener('click', () => this.setAlignment('center'));
        document.getElementById('alignRightBtn').addEventListener('click', () => this.setAlignment('right'));
        document.getElementById('alignJustifyBtn').addEventListener('click', () => this.setAlignment('justify'));
        
        // Undo/Redo buttons
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        
        // Editor events
        this.editor.addEventListener('input', () => this.handleInput());
        this.editor.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.editor.addEventListener('mouseup', () => this.updateToolbarState());
        this.editor.addEventListener('keyup', () => this.updateToolbarState());
        
        // Save state periodically
        setInterval(() => this.saveState(), 1000);
        
        // Initial stats update
        this.updateStats();
    }

    handleInput() {
        // Update stats in real-time
        this.updateStats();
        
        // Debounce state saving
        clearTimeout(this.inputTimeout);
        this.inputTimeout = setTimeout(() => {
            this.saveState();
        }, 500);
    }

    handleKeydown(e) {
        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    this.toggleBold();
                    break;
                case 'i':
                    e.preventDefault();
                    this.toggleItalic();
                    break;
                case 'u':
                    e.preventDefault();
                    this.toggleUnderline();
                    break;
                case 'z':
                    if (!e.shiftKey) {
                        e.preventDefault();
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
            }
        }
        
        // Save state after certain keys
        if (['Enter', 'Backspace', 'Delete'].includes(e.key)) {
            setTimeout(() => this.saveState(), 100);
        }
    }

    toggleBold() {
        document.execCommand('bold', false, null);
        this.updateToolbarState();
        this.saveState();
    }

    toggleUnderline() {
        document.execCommand('underline', false, null);
        this.updateToolbarState();
        this.saveState();
    }

    toggleItalic() {
        document.execCommand('italic', false, null);
        this.updateToolbarState();
        this.saveState();
    }

    changeColor(color) {
        const selection = window.getSelection();
        if (selection.toString().length > 0) {
            document.execCommand('foreColor', false, color);
            this.saveState();
        } else {
            // If no text is selected, set color for future typing
            this.editor.style.color = color;
        }
    }

    setAlignment(alignment) {
        // Remove existing alignment classes
        this.editor.classList.remove('align-left', 'align-center', 'align-right', 'align-justify');
        
        // Add new alignment class
        this.editor.classList.add(`align-${alignment}`);
        
        // Update button states
        this.updateAlignmentButtons(alignment);
        this.saveState();
    }

    updateAlignmentButtons(activeAlignment) {
        const alignButtons = ['alignLeftBtn', 'alignCenterBtn', 'alignRightBtn', 'alignJustifyBtn'];
        const alignments = ['left', 'center', 'right', 'justify'];
        
        alignButtons.forEach((btnId, index) => {
            const btn = document.getElementById(btnId);
            if (alignments[index] === activeAlignment) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateToolbarState() {
        // Update formatting button states based on current selection
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');
        const underlineBtn = document.getElementById('underlineBtn');
        
        boldBtn.classList.toggle('active', document.queryCommandState('bold'));
        italicBtn.classList.toggle('active', document.queryCommandState('italic'));
        underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
        
        // Update undo/redo button states
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        undoBtn.disabled = this.undoStack.length <= 1;
        redoBtn.disabled = this.redoStack.length === 0;
        
        undoBtn.style.opacity = undoBtn.disabled ? '0.5' : '1';
        redoBtn.style.opacity = redoBtn.disabled ? '0.5' : '1';
    }

    saveState() {
        const currentState = {
            content: this.editor.innerHTML,
            timestamp: Date.now()
        };
        
        // Don't save if content hasn't changed
        if (this.undoStack.length > 0 && 
            this.undoStack[this.undoStack.length - 1].content === currentState.content) {
            return;
        }
        
        this.undoStack.push(currentState);
        
        // Limit undo stack size
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        // Clear redo stack when new state is saved
        this.redoStack = [];
        
        this.updateToolbarState();
    }

    undo() {
        if (this.undoStack.length <= 1) return;
        
        const currentState = this.undoStack.pop();
        this.redoStack.push(currentState);
        
        const previousState = this.undoStack[this.undoStack.length - 1];
        this.editor.innerHTML = previousState.content;
        
        this.updateToolbarState();
        this.updateStats();
        this.restoreSelection();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        
        const stateToRestore = this.redoStack.pop();
        this.undoStack.push(stateToRestore);
        
        this.editor.innerHTML = stateToRestore.content;
        
        this.updateToolbarState();
        this.updateStats();
        this.restoreSelection();
    }

    restoreSelection() {
        // Place cursor at the end of content after undo/redo
        const range = document.createRange();
        const selection = window.getSelection();
        
        try {
            range.selectNodeContents(this.editor);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        } catch (e) {
            // Fallback: just focus the editor
            this.editor.focus();
        }
    }

    // Utility method to get selected text
    getSelectedText() {
        const selection = window.getSelection();
        return selection.toString();
    }

    // Utility method to check if text is selected
    hasSelection() {
        const selection = window.getSelection();
        return selection.toString().length > 0;
    }

    // Method to clear all formatting
    clearFormatting() {
        if (this.hasSelection()) {
            document.execCommand('removeFormat', false, null);
            this.saveState();
        }
    }

    // Method to get editor statistics
    getStats() {
        const text = this.editor.innerText || this.editor.textContent;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        
        return {
            characters: text.length,
            charactersNoSpaces: text.replace(/\s/g, '').length,
            words: words.length > 0 && text.trim() !== '' ? words.length : 0
        };
    }

    // Method to update stats display
    updateStats() {
        const stats = this.getStats();
        
        const charCountEl = document.getElementById('charCount');
        const wordCountEl = document.getElementById('wordCount');
        // Removed paragraphCountEl since paragraph count is removed
        
        if (charCountEl) charCountEl.textContent = stats.characters;
        if (wordCountEl) wordCountEl.textContent = stats.words;
        // Removed updating paragraphCount element
    }
}

// Initialize the text editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const textEditor = new TextEditor();
    
    // Add some helpful features
    console.log('Text Editor initialized successfully!');
    
    // Optional: Add word count display (you can uncomment this to add word count feature)
    /*
    setInterval(() => {
        const stats = textEditor.getStats();
        console.log(`Words: ${stats.words}, Characters: ${stats.characters}`);
    }, 2000);
    */
});

// Additional utility functions
function insertText(text) {
    document.execCommand('insertText', false, text);
}

function insertHTML(html) {
    document.execCommand('insertHTML', false, html);
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextEditor;
}