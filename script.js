document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.innerHTML = navLinks.classList.contains('active') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.nav-links li a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });

    // Smooth Scrolling for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Adjust for fixed header offset
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Form Submission is now handled natively by FormSubmit.co via the form 'action' attribute.
    // We can verify if the URL has a success parameter if we used a specific redirect, but for now we let FormSubmit handle the success screen.
    // AJAX Form Submission for Quote Form
    const quoteForm = document.getElementById('quoteForm');
    const formMessage = document.getElementById('formMessage');

    if (quoteForm) {
        quoteForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Show loading state
            const submitBtn = quoteForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Sending...';
            submitBtn.disabled = true;

            const formData = new FormData(quoteForm);

            fetch(quoteForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
                .then(response => {
                    if (response.ok) {
                        // Success: Replace form with Thank You message
                        quoteForm.innerHTML = `
                        <div class="success-message" style="text-align: center; padding: 40px;">
                            <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--primary-color); margin-bottom: 20px;"></i>
                            <h3 style="color: var(--primary-color); margin-bottom: 15px;">Thank You!</h3>
                            <p style="font-size: 1.2rem; color: var(--text-dark);">We have received your request and will get back to you within 24 hours.</p>
                        </div>
                    `;
                        // Scroll to message
                        quoteForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        // Error handling
                        alert('There was a problem sending your request. Please try again later.');
                        submitBtn.innerText = originalBtnText;
                        submitBtn.disabled = false;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('There was a problem sending your request. Please try again later.');
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }

    // Initialize Flatpickr for date selection
    const dateInput = document.getElementById('preferred_dates');
    if (dateInput) {
        flatpickr(dateInput, {
            mode: "multiple",
            minDate: "today",
            dateFormat: "Y-m-d",
            maxDates: 2,
            disable: [
                function (date) {
                    // return true to disable
                    // Disable Mon(1), Tue(2), Wed(3), Thu(4)
                    return (date.getDay() === 1 || date.getDay() === 2 || date.getDay() === 3 || date.getDay() === 4);
                }
            ],
            locale: {
                firstDayOfWeek: 1 // Start week on Monday
            }
        });
    }

    // Scroll Animation (Fade in on scroll)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.service-card, .gallery-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Add class for the animation style
    const style = document.createElement('style');
    style.innerHTML = `
        .fade-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Portal Login Logic (Mock) - Keeping it if needed, or we can remove if user didn't ask for it specifically.
    // Preserving it as it was in the file, just ensuring no conflicts.
    const loginForm = document.getElementById('loginForm');
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Logging in...';
            btn.disabled = true;

            setTimeout(() => {
                if (loginView && dashboardView) {
                    loginView.style.display = 'none';
                    dashboardView.style.display = 'grid';
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            }, 1000);
        });
    }

    // Reviews Slideshow (Responsive)
    const track = document.getElementById('reviewsTrack');
    const prevBtn = document.getElementById('prevReviewBtn');
    const nextBtn = document.getElementById('nextReviewBtn');
    const dotsContainer = document.getElementById('reviewsDots');

    if (track && prevBtn && nextBtn && dotsContainer) {
        const cards = Array.from(track.querySelectorAll('.review-card'));
        let currentIndex = 0;

        // Determine how many cards are visible based on viewport width
        function getCardsVisible() {
            if (window.innerWidth >= 1024) return 3;
            if (window.innerWidth >= 600) return 2;
            return 1;
        }

        // Set the CSS custom property on each card so widths are computed correctly
        function setCardWidths() {
            const visible = getCardsVisible();
            const gap = 24; // px — must match the CSS gap value
            const containerWidth = track.parentElement.offsetWidth;
            const cardWidth = (containerWidth - (visible - 1) * gap) / visible;
            cards.forEach(card => {
                card.style.width = cardWidth + 'px';
                card.style.flexShrink = '0';
            });
        }

        // Total number of "pages" (steps) you can scroll to
        function getTotalSteps() {
            return Math.ceil(cards.length / getCardsVisible());
        }

        // Build / rebuild the dot indicators
        function buildDots() {
            dotsContainer.innerHTML = '';
            const steps = getTotalSteps();
            for (let i = 0; i < steps; i++) {
                const dot = document.createElement('button');
                dot.classList.add('dot');
                dot.setAttribute('aria-label', 'Go to review page ' + (i + 1));
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goTo(i));
                dotsContainer.appendChild(dot);
            }
        }

        // Move the track to the given step index
        function goTo(index) {
            const steps = getTotalSteps();
            // Clamp
            currentIndex = Math.max(0, Math.min(index, steps - 1));

            const visible = getCardsVisible();
            const gap = 24;
            const cardWidth = cards[0] ? cards[0].offsetWidth : 0;
            const offset = currentIndex * visible * (cardWidth + gap);
            track.style.transform = `translateX(-${offset}px)`;

            // Update dots
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));

            // Disable/enable buttons at boundaries
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= steps - 1;
            prevBtn.style.opacity = prevBtn.disabled ? '0.4' : '1';
            nextBtn.style.opacity = nextBtn.disabled ? '0.4' : '1';
        }

        prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
        nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

        // Touch / swipe support for mobile
        let touchStartX = 0;
        track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) goTo(currentIndex + 1);
                else goTo(currentIndex - 1);
            }
        }, { passive: true });

        // Re-layout on resize (debounced)
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                setCardWidths();
                buildDots();
                goTo(0); // reset to start on resize
            }, 150);
        });

        // Initial render
        setCardWidths();
        buildDots();
        goTo(0);
    }
});
