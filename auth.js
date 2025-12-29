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

onAuthStateChanged(auth, (user) => {
    const dashboardSection = document.getElementById("dashboard");
    const userNameSpan = document.getElementById("user-name");
    const navLoginLink = document.querySelector('a[href="portal.html"]');

    if (user) {
        // User is signed in.
        dashboardSection.style.display = "block";
        userNameSpan.textContent = user.displayName || user.phoneNumber || "Client";

        if (navLoginLink) {
            navLoginLink.textContent = "My Dashboard";
            navLoginLink.href = "#dashboard"; // Jump to dashboard
            navLoginLink.classList.add("btn-primary");
            navLoginLink.classList.remove("btn-secondary");
        }

        // Trigger dashboard data load (dispatched to dashboard.js via event or direct call logic if shared)
        // Since modules are separate, we can emit a custom event
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user: user } }));

    } else {
        // User is signed out.
        dashboardSection.style.display = "none";

        if (navLoginLink) {
            navLoginLink.textContent = "Client Login";
            navLoginLink.href = "portal.html"; // We keep it as is, preventing default via JS
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
