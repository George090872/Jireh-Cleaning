// Accessibility Widget Logic

(function () {
    function initAccessibility() {
        console.log('Accessibility Widget Initializing...');
        // Debug alert removed

        // State
        const state = {
            fontSize: 'normal', // normal, large, x-large
            highContrast: false,
            highlightLinks: false,
            textReader: false
        };

        // ... existing code ...

        // Event Listeners
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                // Temporary debug alert
                // alert("Button Clicked!"); 
                menu.classList.toggle('active');
                toggleBtn.setAttribute('aria-expanded', menu.classList.contains('active'));
            });
        }

        // Load preferences
        loadPreferences();

        // Create Widget HTML if it doesn't exist (in case we want to inject it via JS, but for now assuming HTML is in index.html or we inject it here)
        // For this implementation, I will inject the HTML dynamically so it's self-contained in this script eventually, 
        // but the plan said to modify index.html. However, to make it cleaner, I'll adding the event listeners to the elements.

        // UI References (assuming these IDs will be in index.html)
        const toggleBtn = document.getElementById('accessibility-toggle-btn');
        const menu = document.getElementById('accessibility-menu');
        const closeBtn = document.getElementById('accessibility-close-btn');

        // Feature Buttons
        const btnIncreaseText = document.getElementById('acc-btn-increase-text');
        const btnDecreaseText = document.getElementById('acc-btn-decrease-text');
        const btnContrast = document.getElementById('acc-btn-contrast');
        const btnHighlight = document.getElementById('acc-btn-highlight');
        const btnReader = document.getElementById('acc-btn-reader');
        const btnReset = document.getElementById('acc-btn-reset');

        // Event Listeners
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                // Debugging click
                alert("Button Clicked! Attempting to open menu...");
                console.log("Toggle button clicked");

                menu.classList.toggle('active');
                const isActive = menu.classList.contains('active');
                toggleBtn.setAttribute('aria-expanded', isActive);

                // Force display
                if (isActive) {
                    menu.style.display = 'flex';
                    // Temporary visibility force
                    menu.style.opacity = '1';
                    menu.style.zIndex = '9999999';
                } else {
                    menu.style.display = '';
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                menu.classList.remove('active');
                toggleBtn.setAttribute('aria-expanded', 'false');
            });
        }

        if (btnIncreaseText) btnIncreaseText.addEventListener('click', () => changeFontSize(1));
        if (btnDecreaseText) btnDecreaseText.addEventListener('click', () => changeFontSize(-1));
        if (btnContrast) btnContrast.addEventListener('click', toggleContrast);
        if (btnHighlight) btnHighlight.addEventListener('click', toggleHighlightLinks);
        if (btnReader) btnReader.addEventListener('click', toggleTextReader);
        if (btnReset) btnReset.addEventListener('click', resetSettings);

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (menu && menu.classList.contains('active') &&
                !menu.contains(e.target) &&
                !toggleBtn.contains(e.target)) {
                menu.classList.remove('active');
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Functions

        function loadPreferences() {
            const saved = JSON.parse(localStorage.getItem('jireh_accessibility_prefs'));
            if (saved) {
                state.fontSize = saved.fontSize || 'normal';
                state.highContrast = saved.highContrast || false;
                state.highlightLinks = saved.highlightLinks || false;
                // We usually don't persist 'textReader' active state as it might be annoying on reload
            }
            applySettings();
        }

        function savePreferences() {
            localStorage.setItem('jireh_accessibility_prefs', JSON.stringify({
                fontSize: state.fontSize,
                highContrast: state.highContrast,
                highlightLinks: state.highlightLinks
            }));
        }

        function applySettings() {
            // Font Size
            document.documentElement.classList.remove('acc-font-large', 'acc-font-xlarge');
            if (state.fontSize === 'large') document.documentElement.classList.add('acc-font-large');
            if (state.fontSize === 'x-large') document.documentElement.classList.add('acc-font-xlarge');

            // Contrast
            if (state.highContrast) document.body.classList.add('acc-high-contrast');
            else document.body.classList.remove('acc-high-contrast');

            // Highlight Links
            if (state.highlightLinks) document.body.classList.add('acc-highlight-links');
            else document.body.classList.remove('acc-highlight-links');

            // Update UI button states
            updateButtonStates();
        }

        function updateButtonStates() {
            if (btnContrast) btnContrast.classList.toggle('active', state.highContrast);
            if (btnHighlight) btnHighlight.classList.toggle('active', state.highlightLinks);
            // Reader is handled separately in its toggle function
        }

        function changeFontSize(direction) {
            const sizes = ['normal', 'large', 'x-large'];
            let currentIndex = sizes.indexOf(state.fontSize);

            let newIndex = currentIndex + direction;
            if (newIndex < 0) newIndex = 0;
            if (newIndex >= sizes.length) newIndex = sizes.length - 1;

            state.fontSize = sizes[newIndex];
            applySettings();
            savePreferences();
        }

        function toggleContrast() {
            state.highContrast = !state.highContrast;
            applySettings();
            savePreferences();
        }

        function toggleHighlightLinks() {
            state.highlightLinks = !state.highlightLinks;
            applySettings();
            savePreferences();
        }

        function resetSettings() {
            state.fontSize = 'normal';
            state.highContrast = false;
            state.highlightLinks = false;
            stopSpeech();
            state.textReader = false;
            if (btnReader) btnReader.classList.remove('active');

            applySettings();
            savePreferences();
        }

        // Text Reader Functionality
        let speechUtterance = null;

        function toggleTextReader() {
            state.textReader = !state.textReader;
            if (btnReader) btnReader.classList.toggle('active', state.textReader);

            if (state.textReader) {
                enableTextReader();
            } else {
                disableTextReader();
            }
        }

        function enableTextReader() {
            document.body.style.cursor = 'help';
            document.addEventListener('mouseover', hoverReadHandler);
            document.addEventListener('click', clickReadHandler);
            speak("Text reader enabled. Hover over or click text to hear it.");
        }

        function disableTextReader() {
            document.body.style.cursor = '';
            document.removeEventListener('mouseover', hoverReadHandler);
            document.removeEventListener('click', clickReadHandler);
            stopSpeech();
        }

        let hoverTimeout;
        function hoverReadHandler(e) {
            // Simple debouncing to avoid reading everything as you scroll
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                if (shouldRead(e.target)) {
                    // Determine text to read
                    let text = getReadableText(e.target);
                    if (text) {
                        // Highlight element temporarily?
                        // e.target.style.outline = '2px solid yellow';
                        // speak(text);
                        // setTimeout(() => e.target.style.outline = '', 1000);
                    }
                }
            }, 500);
        }

        function clickReadHandler(e) {
            if (!state.textReader) return;

            // Prevent default action if it's just text, but maybe allow links if they want to navigate?
            // For compliance, we shouldn't block navigation unless using a specific mode. 
            // Let's just read and let the event bubble unless it's strictly a reader mode. 
            // Better UX: Just read on click for blocks.
            if (shouldRead(e.target)) {
                let text = getReadableText(e.target);
                if (text) speak(text);
            }
        }

        function shouldRead(element) {
            // Avoid reading the widget itself
            if (element.closest('#accessibility-menu') || element.closest('#accessibility-toggle-btn')) return false;
            return true;
        }

        function getReadableText(element) {
            // Try to get text content, alt text, or aria-label
            return element.innerText || element.alt || element.getAttribute('aria-label') || '';
        }

        function speak(text) {
            stopSpeech();
            if (!text || text.trim() === '') return;

            speechUtterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(speechUtterance);
        }

        function stopSpeech() {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccessibility);
    } else {
        initAccessibility();
    }
})();
