import { db, collection, addDoc, query, where, getDocs, orderBy, deleteDoc, doc, auth } from "./firebase-config.js";

const upcomingList = document.getElementById("upcoming-list");
const historyList = document.getElementById("history-list");
const scheduleBtn = document.getElementById("dashboard-schedule-btn");
const quoteForm = document.getElementById("quoteForm");

// Listen for Auth Changes to Load Data
window.addEventListener('auth-state-changed', async (e) => {
    const user = e.detail.user;
    if (user) {
        await loadAppointments(user);
        // Pre-fill form
        if (quoteForm) {
            const nameInput = document.getElementById("name");
            const emailInput = document.getElementById("email");
            const phoneInput = document.getElementById("phone");

            if (user.displayName) nameInput.value = user.displayName;
            if (user.email) emailInput.value = user.email;
            if (user.phoneNumber) phoneInput.value = user.phoneNumber;
        }
    }
});

async function loadAppointments(user) {
    if (!user) return;

    // Determine query key (email or phone)
    // Note: This assumes we store appointments with 'email' or 'phone' matching the user.
    // Ideally, when they submit a quote, we should tag it with their UID if logged in.
    // For now, let's query by email if available, else phone.

    // Since the current form uses FormSubmit (email), we don't strictly have a database of appointments yet EXCEPT what we might save to Firestore manually upon submission if we intercept it.
    // FOR THIS DEMO: We will assume we are saving appointments to a 'appointments' collection in Firestore when they submit.
    // I need to intercept the form submission to save to Firestore.

    const q = query(collection(db, "appointments"), where("userId", "==", user.uid), orderBy("date", "desc"));

    try {
        const querySnapshot = await getDocs(q);

        upcomingList.innerHTML = "";
        historyList.innerHTML = "";

        let hasUpcoming = false;
        let hasHistory = false;

        const today = new Date();

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const apptDate = new Date(data.date); // Assumes ISO string or timestamp

            const card = createApptCard(doc.id, data);

            if (apptDate >= today) {
                upcomingList.appendChild(card);
                hasUpcoming = true;
            } else {
                historyList.appendChild(card);
                hasHistory = true;
            }
        });

        if (!hasUpcoming) upcomingList.innerHTML = "<p>No upcoming appointments.</p>";
        if (!hasHistory) historyList.innerHTML = "<p>No past appointments.</p>";

    } catch (error) {
        console.error("Error loading appointments:", error);
        // Might fail if index is missing or permissions.
        // Silently fail for now or show error.
    }
}

function createApptCard(id, data) {
    const div = document.createElement("div");
    div.classList.add("appt-card");

    div.innerHTML = `
        <div class="appt-info">
            <strong>${data.serviceType || "Cleaning Service"}</strong>
            <span><i class="fas fa-calendar"></i> ${data.date || "TBD"}</span>
            <span><i class="fas fa-clock"></i> ${data.frequency || "One-Time"}</span>
        </div>
        ${new Date(data.date) >= new Date() ? `<button class="btn-cancel" data-id="${id}">Cancel</button>` : ''}
    `;

    const cancelBtn = div.querySelector(".btn-cancel");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", async () => {
            if (confirm("Are you sure you want to cancel this appointment?")) {
                await cancelAppointment(id);
            }
        });
    }

    return div;
}

async function cancelAppointment(id) {
    try {
        await deleteDoc(doc(db, "appointments", id));
        alert("Appointment cancelled.");
        // Refresh
        const user = auth.currentUser;
        if (user) loadAppointments(user);
    } catch (error) {
        console.error("Error cancelling:", error);
        alert("Failed to cancel.");
    }
}

// Intercept Form Submission to Save to Firestore
if (quoteForm) {
    quoteForm.addEventListener("submit", async (e) => {
        // We want to allow the FormSubmit to happen, OR we handle it entirely via Firestore.
        // User asked for "FormSubmit" replacement previously, but now we have a dashboard.
        // Ideally we do BOTH: Send email via FormSubmit AND save to Firestore.
        // But FormSubmit redirects.

        // Strategy: AJAX submit to FormSubmit, THEN save to Firestore, THEN show success.
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) {
            // accessible to non-logged in users too? user request implied "once logged in, they can schedule".
            // If they are logged in, we save.
            alert("Please login to schedule and track your appointment.");
            // Or just submit normally if we allow guests? 
            // Let's assume for now we just submit normally if not logged in.
            e.target.submit();
            return;
        }

        const formData = new FormData(quoteForm);
        const data = Object.fromEntries(formData.entries());

        // Parse dates from "preferred_dates" (e.g. "2023-10-27, 2023-10-30")
        // We'll just take the first one as the "date" for sorting
        const dates = data.preferred_dates ? data.preferred_dates.split(",") : [];
        const mainDate = dates[0] ? dates[0].trim() : new Date().toISOString();

        const appointmentData = {
            userId: user.uid,
            userName: data.name,
            userEmail: data.email,
            userPhone: data.phone,
            serviceType: data.service_type,
            frequency: data.frequency,
            date: mainDate,
            details: data,
            status: "Requested",
            createdAt: new Date().toISOString()
        };

        try {
            // Save to Firestore
            await addDoc(collection(db, "appointments"), appointmentData);

            // Now submit the form to FormSubmit (or simulate it)
            // Since we prevented default, we can just submit() now, but that might re-trigger listener?
            // Actually, HTMLFormElement.submit() does NOT trigger 'submit' event.
            quoteForm.submit();

        } catch (error) {
            console.error("Error saving appointment:", error);
            alert("Error scheduling appointment. Please try again.");
        }
    });
}

// Schedule Button Scroll
if (scheduleBtn) {
    scheduleBtn.addEventListener("click", () => {
        document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
    });
}
