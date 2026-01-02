(function () {
    // 1. Inject HTML (Floating Widget)
    const widgetHTML = `
    <!-- Toggle Button -->
    <button id="jab-toggle-btn" aria-label="Accessibility Menu" title="Accessibility Options">
        <i class="fas fa-universal-access"></i>
    </button>

    <!-- Popup Menu -->
    <div id="jab-menu" aria-hidden="true" style="display:none;">
        <div class="jab-header">
            <h3>Accessibility</h3>
            <button id="jab-close-menu" title="Close">×</button>
        </div>
        <div class="jab-controls">
            <button id="jab-btn-increase"><i class="fas fa-plus"></i> Text Size</button>
            <button id="jab-btn-decrease"><i class="fas fa-minus"></i> Text Size</button>
            <button id="jab-btn-contrast"><i class="fas fa-adjust"></i> Contrast</button>
            <button id="jab-btn-links"><i class="fas fa-link"></i> Links</button>
            <button id="jab-btn-reader"><i class="fas fa-volume-up"></i> Reader</button>
        </div>
        <button id="jab-btn-reset">Reset All</button>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // 2. Element References
    const toggleBtn = document.getElementById('jab-toggle-btn');
    const menu = document.getElementById('jab-menu');
    const closeBtn = document.getElementById('jab-close-menu');

    const btnIncrease = document.getElementById('jab-btn-increase');
    const btnDecrease = document.getElementById('jab-btn-decrease');
    const btnContrast = document.getElementById('jab-btn-contrast');
    const btnLinks = document.getElementById('jab-btn-links');
    const btnReader = document.getElementById('jab-btn-reader');
    const btnReset = document.getElementById('jab-btn-reset');

    // 3. State
    let state = {
        fontSize: 0,
        contrast: false,
        links: false,
        reader: false
    };

    // Load State
    const saved = localStorage.getItem('jireh_acc_prefs');
    if (saved) {
        state = { ...state, ...JSON.parse(saved) };
        state.reader = false; // Always start off
        applyState();
    }

    // 4. Logic & Listeners

    // Menu Toggle
    function toggleMenu() {
        const isHidden = menu.style.display === 'none';
        if (isHidden) {
            menu.style.display = 'block';
            toggleBtn.setAttribute('aria-expanded', 'true');
            menu.setAttribute('aria-hidden', 'false');
        } else {
            menu.style.display = 'none';
            toggleBtn.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
        }
    }

    toggleBtn.onclick = toggleMenu;
    closeBtn.onclick = toggleMenu;

    // Features
    btnIncrease.onclick = () => { if (state.fontSize < 2) state.fontSize++; applyState(); };
    btnDecrease.onclick = () => { if (state.fontSize > 0) state.fontSize--; applyState(); };
    btnContrast.onclick = () => { state.contrast = !state.contrast; applyState(); };
    btnLinks.onclick = () => { state.links = !state.links; applyState(); };

    btnReader.onclick = () => {
        state.reader = !state.reader;
        if (state.reader) speak("Reader Enabled.");
        else { speak("Reader Disabled."); window.speechSynthesis.cancel(); }
        applyState();
    };

    btnReset.onclick = () => {
        state = { fontSize: 0, contrast: false, links: false, reader: false };
        window.speechSynthesis.cancel();
        applyState();
    };

    // Reader Interaction
    document.addEventListener('click', (e) => {
        if (!state.reader) return;
        if (e.target.closest('#jab-menu') || e.target.closest('#jab-toggle-btn')) return;

        const text = e.target.innerText || e.target.alt || e.target.getAttribute('aria-label');
        if (text && text.trim().length > 0) {
            e.preventDefault();
            e.stopPropagation();
            speak(text);

            // Visual feedback
            const originalColor = e.target.style.backgroundColor;
            e.target.style.backgroundColor = 'yellow';
            e.target.style.color = 'black';
            setTimeout(() => {
                e.target.style.backgroundColor = originalColor;
                e.target.style.color = '';
            }, 1000);
        }
    });

    // 5. Apply
    function applyState() {
        const html = document.documentElement;
        const body = document.body;

        // Font
        html.classList.remove('jab-font-large', 'jab-font-xlarge');
        if (state.fontSize === 1) html.classList.add('jab-font-large');
        if (state.fontSize === 2) html.classList.add('jab-font-xlarge');

        // Contrast
        body.classList.toggle('jab-high-contrast', state.contrast);
        btnContrast.classList.toggle('active', state.contrast);

        // Links
        body.classList.toggle('jab-highlight-links', state.links);
        btnLinks.classList.toggle('active', state.links);

        // Reader
        if (state.reader) {
            body.style.cursor = 'help';
            btnReader.classList.add('active');
        } else {
            body.style.cursor = '';
            btnReader.classList.remove('active');
        }

        localStorage.setItem('jireh_acc_prefs', JSON.stringify(state));
    }

    function speak(text) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }

})();
