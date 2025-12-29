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

// Form Submission Logic removed as we are now using Tally Embed which handles its own submission.
// New appointments will not automatically sync to dashboard in this version.

// Schedule Button Scroll - Removed as Tally Popup handles it via data attributes.
/*
if (scheduleBtn) {
    scheduleBtn.addEventListener("click", () => {
        document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
    });
}
*/
