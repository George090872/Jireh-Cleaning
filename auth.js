import { auth, RecaptchaVerifier, signInWithPhoneNumber, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut, db, doc, collection, addDoc, query, where, getDocs } from "./firebase-config.js";

// DOM Elements
const authModal = document.getElementById("authModal");
const closeModal = document.querySelector(".close-modal");
const tabBtns = document.querySelectorAll(".tab-btn");
const phoneTab = document.getElementById("phone-tab");
const emailTab = document.getElementById("email-tab");
const signupForm = document.getElementById("signup-form");
const showSignupBtn = document.getElementById("show-signup-btn");
const showLoginBtn = document.getElementById("show-login-btn");
const clientLoginLink = document.querySelector('a[href="portal.html"]'); // Existing link in nav

// Buttons
const sendCodeBtn = document.getElementById("send-code-btn");
const verifyCodeBtn = document.getElementById("verify-code-btn");
const emailLoginBtn = document.getElementById("email-login-btn");
const emailSignupBtn = document.getElementById("email-signup-btn");
const logoutBtn = document.getElementById("logout-btn");

// Inputs
const loginPhoneInput = document.getElementById("login-phone");
const verificationCodeInput = document.getElementById("verification-code");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const signupNameInput = document.getElementById("signup-name");
const signupEmailInput = document.getElementById("signup-email");
const signupPasswordInput = document.getElementById("signup-password");

// Global State
let confirmationResult = null;

// Initialize Recaptcha
window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    'size': 'normal',
    'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
    },
    'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
    }
});

// Event Listeners

// Open Modal logic
if (clientLoginLink) {
    clientLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        // Check if already logged in? 
        // For now, just open modal if not handled by auth state observer
        const user = auth.currentUser;
        if (!user) {
            authModal.style.display = "block";
        } else {
            // Scroll to dashboard if already logged in
            document.getElementById("dashboard").scrollIntoView({ behavior: "smooth" });
        }
    });
}

// Close Modal
closeModal.addEventListener("click", () => {
    authModal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target == authModal) {
        authModal.style.display = "none";
    }
});

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        // Remove active class from all
        tabBtns.forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
        signupForm.style.display = "none"; // Hide signup if open

        // Add active to clicked
        btn.classList.add("active");
        const tabId = btn.getAttribute("data-tab");
        if (tabId === "phone") {
            phoneTab.classList.add("active");
            emailTab.classList.remove("active");
        } else {
            emailTab.classList.add("active");
            phoneTab.classList.remove("active");
        }
    });
});

// Toggle Signup/Login
showSignupBtn.addEventListener("click", () => {
    emailTab.style.display = "none";
    signupForm.style.display = "block";
});

showLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    signupForm.style.display = "none";
    emailTab.style.display = "block";
});

// --- Phone Auth ---

sendCodeBtn.addEventListener("click", async () => {
    const phoneNumber = loginPhoneInput.value;
    const appVerifier = window.recaptchaVerifier;

    if (!phoneNumber) {
        alert("Please enter a phone number.");
        return;
    }

    try {
        confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        // SMS sent. Prompt user to type the code from the message.
        document.getElementById("verification-section").style.display = "block";
        sendCodeBtn.style.display = "none";
        alert("Verification code sent!");
    } catch (error) {
        console.error("Error sending code:", error);
        alert("Error sending code. Please check the number and try again.");
        window.recaptchaVerifier.render().then(function (widgetId) {
            grecaptcha.reset(widgetId);
        });
    }
});

verifyCodeBtn.addEventListener("click", async () => {
    const code = verificationCodeInput.value;
    if (!code) {
        alert("Please enter both verification code.");
        return;
    }

    try {
        const result = await confirmationResult.confirm(code);
        const user = result.user;
        console.log("Phone login success:", user);
        authModal.style.display = "none";
        // Check if user has a profile doc, if not create one? 
        // For phone auth, we might not have a name immediately if new.
        // We can prompt for name later or just let them be "Client".
    } catch (error) {
        console.error("Error verifying code:", error);
        alert("Invalid code. Please try again.");
    }
});

// --- Email Auth ---

emailLoginBtn.addEventListener("click", async () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        authModal.style.display = "none";
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed: " + error.message);
    }
});

emailSignupBtn.addEventListener("click", async () => {
    const name = signupNameInput.value;
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;

    if (!name || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile with name
        await updateProfile(user, {
            displayName: name
        });

        // Store additional user info in Firestore if needed
        // await addDoc(collection(db, "users"), {
        //     uid: user.uid,
        //     name: name,
        //     email: email
        // });

        console.log("Signup success:", user);
        authModal.style.display = "none";
    } catch (error) {
        console.error("Signup error:", error);
        alert("Signup failed: " + error.message);
    }
});

// --- Auth State Listener ---

// Name Modal Elements
const nameModal = document.getElementById("nameModal");
const profileNameInput = document.getElementById("profile-name-input");
const saveNameBtn = document.getElementById("save-name-btn");

// Handle Name Saving
if (saveNameBtn) {
    saveNameBtn.addEventListener("click", async () => {
        const name = profileNameInput.value;
        if (!name) {
            alert("Please enter your name.");
            return;
        }

        const user = auth.currentUser;
        if (user) {
            try {
                await updateProfile(user, {
                    displayName: name
                });

                // Close modal and update UI
                nameModal.style.display = "none";
                document.getElementById("user-name").textContent = name;

                // Refresh dashboard logic (optional, but good practice)
                window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user: user } }));

            } catch (error) {
                console.error("Error saving name:", error);
                alert("Error saving name. Please try again.");
            }
        }
    });
}

onAuthStateChanged(auth, (user) => {
    const dashboardSection = document.getElementById("dashboard");
    const userNameSpan = document.getElementById("user-name");
    const navLoginLink = document.querySelector('a[href="portal.html"]');

    // Landing Page Sections to hide
    const heroSection = document.querySelector(".hero");
    const servicesSection = document.getElementById("services");
    const gallerySection = document.getElementById("gallery");
    const aboutSection = document.getElementById("about");
    const contactSection = document.getElementById("contact");

    if (user) {
        // User is signed in.

        // Hide Landing Page
        if (heroSection) heroSection.style.display = "none";
        if (servicesSection) servicesSection.style.display = "none";
        if (gallerySection) gallerySection.style.display = "none";
        if (aboutSection) aboutSection.style.display = "none";
        if (contactSection) contactSection.style.display = "none";

        // Show Dashboard
        dashboardSection.style.display = "block";
        window.scrollTo(0, 0); // Scroll to top

        // Name Logic
        if (user.displayName) {
            userNameSpan.textContent = user.displayName;
        } else {
            userNameSpan.textContent = user.phoneNumber || "Client";
            // Show Name Modal if no display name (e.g. first time phone login)
            if (nameModal) nameModal.style.display = "block";
        }

        if (navLoginLink) {
            navLoginLink.textContent = "My Dashboard";
            navLoginLink.href = "#dashboard";
            navLoginLink.classList.add("btn-primary");
            navLoginLink.classList.remove("btn-secondary");
            // Remove click listener that opens auth modal if it was added dynamically? 
            // In original code, the listener checks `if (!user)`. So it will verify `user` exists and do the else block (scroll to dashboard).
            // But since dashboard is now the ONLY thing visible, the link acts more like a "Home" or "Refresh".
        }

        // Trigger dashboard data load
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user: user } }));

    } else {
        // User is signed out.

        // Show Landing Page
        if (heroSection) heroSection.style.display = "block"; // or flex depending on css? Hero usually block/flex
        if (servicesSection) servicesSection.style.display = "block";
        if (gallerySection) gallerySection.style.display = "block";
        if (aboutSection) aboutSection.style.display = "block";
        if (contactSection) contactSection.style.display = "block"; // or whatever original display was

        // Restore Hero display if it was flex (Check CSS logic potentially, but block usually works for sections unless flex container)
        // Actually .hero might be flex. Let's assume block is safe or check CSS if issues.
        // If the css defined display:flex for .hero, inline style="display:block" might break layout.
        // Safer to set style.display = "" to revert to CSS file rule.
        if (heroSection) heroSection.style.display = "";
        if (servicesSection) servicesSection.style.display = "";
        if (gallerySection) gallerySection.style.display = "";
        if (aboutSection) aboutSection.style.display = "";
        if (contactSection) contactSection.style.display = "";


        dashboardSection.style.display = "none";
        if (nameModal) nameModal.style.display = "none";

        if (navLoginLink) {
            navLoginLink.textContent = "Client Login";
            navLoginLink.href = "portal.html";
            navLoginLink.classList.add("btn-secondary");
            navLoginLink.classList.remove("btn-primary");
        }
    }
});

// Logout
logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        alert("Logged out successfully.");
        // Reload or reset UI handled by onAuthStateChanged
    } catch (error) {
        console.error("Logout error:", error);
    }
});
