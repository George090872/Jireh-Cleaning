import { db, collection, addDoc, query, where, getDocs, orderBy, deleteDoc, doc, auth } from "./firebase-config.js";

const upcomingList = document.getElementById("upcoming-list");
const historyList = document.getElementById("history-list");
const scheduleBtn = document.getElementById("dashboard-schedule-btn");

// Admin Elements
const adminPanel = document.getElementById("admin-panel");
const adminClientEmail = document.getElementById("admin-client-email");
const adminCleanDate = document.getElementById("admin-clean-date");
const adminCleanTime = document.getElementById("admin-clean-time");
const adminServiceType = document.getElementById("admin-service-type");
const adminFrequency = document.getElementById("admin-frequency");
const adminAssignBtn = document.getElementById("admin-assign-btn");

// Listen for Auth Changes to Load Data
window.addEventListener('auth-state-changed', async (e) => {
    const user = e.detail.user;
    if (user) {
        checkAdmin(user);
        await loadAppointments(user);
    }
});

function checkAdmin(user) {
    // Hardcoded Admin Email
    const ADMIN_EMAIL = 'jirehinc81@gmail.com';

    if (user.email === ADMIN_EMAIL) {
        if (adminPanel) adminPanel.style.display = "block";
    } else {
        if (adminPanel) adminPanel.style.display = "none";
    }
}

// Admin Assign Button Logic
if (adminAssignBtn) {
    adminAssignBtn.addEventListener("click", async () => {
        const clientEmail = adminClientEmail.value.trim();
        const date = adminCleanDate.value;
        const time = adminCleanTime.value;
        const serviceType = adminServiceType.value;
        const frequency = adminFrequency.value;

        if (!clientEmail || !date || !time) {
            alert("Please fill in all fields (Email, Date, Time).");
            return;
        }

        try {
            // Add appointment to Firestore
            await addDoc(collection(db, "appointments"), {
                clientEmail: clientEmail,
                date: date, // YYYY-MM-DD
                time: time,
                serviceType: serviceType,
                frequency: frequency,
                status: "Scheduled",
                createdAt: new Date(),
                assignedBy: auth.currentUser.email
            });

            alert(`Appointment assigned to ${clientEmail} successfully!`);

            // Clear inputs
            adminClientEmail.value = "";
            adminCleanDate.value = "";
            adminCleanTime.value = "";

            // If admin assigned to themselves, reload
            if (clientEmail === auth.currentUser.email) {
                loadAppointments(auth.currentUser);
            }

        } catch (error) {
            console.error("Error assigning appointment:", error);
            alert("Failed to assign appointment: " + error.message);
        }
    });
}

async function loadAppointments(user) {
    if (!user) return;

    // Query appointments where clientEmail matches the logged-in user's email
    // This allows the admin to assign cleans to an email, and the user to see them.
    // Fallback: If user has no email (phone auth only), this won't show email-linked apts.
    // They would need to update their profile with an email (not currently implemented fully).

    if (!user.email) {
        // If phone login without email, maybe just return or handle differently.
        // For now, we assume email linkage is key.
        console.log("User has no email, cannot load email-linked appointments.");
        upcomingList.innerHTML = "<p>Please link an email to your account to view appointments.</p>";
        historyList.innerHTML = "<p>No history found.</p>";
        return;
    }

    const q = query(collection(db, "appointments"), where("clientEmail", "==", user.email), orderBy("date", "desc"));

    try {
        const querySnapshot = await getDocs(q);

        upcomingList.innerHTML = "";
        historyList.innerHTML = "";

        let hasUpcoming = false;
        let hasHistory = false;

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare just dates

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Parse date string YYYY-MM-DD
            const parts = data.date.split('-');
            const apptDate = new Date(parts[0], parts[1] - 1, parts[2]);

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
        upcomingList.innerHTML = "<p>Error loading appointments.</p>";
    }
}

function createApptCard(id, data) {
    const div = document.createElement("div");
    div.classList.add("appt-card");

    div.innerHTML = `
        <div class="appt-info">
            <strong>${data.serviceType || "Cleaning Service"}</strong>
            <span><i class="fas fa-calendar"></i> ${data.date} at ${data.time || "TBD"}</span>
            <span><i class="fas fa-repeat"></i> ${data.frequency || "One-Time"}</span>
        </div>
        ${isFuture(data.date) ? `<button class="btn-cancel" data-id="${id}">Cancel</button>` : ''}
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

function isFuture(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = dateString.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date >= today;
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
