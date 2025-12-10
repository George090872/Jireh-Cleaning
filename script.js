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
});
