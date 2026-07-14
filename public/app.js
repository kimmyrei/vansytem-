/* VanSystem localStorage connection file
   This is for testing on Netlify without database.
   Data is saved only in the same browser/device.
*/

const VS = {
    parentsKey: "vansystem_parents",
    childrenKey: "vansystem_children",
    paymentsKey: "vansystem_payments",
    announcementsKey: "vansystem_announcements",
    currentParentKey: "vansystem_current_parent",
    adminKey: "vansystem_admin_logged_in"
};

function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix) {
    return prefix + Date.now().toString().slice(-7) + Math.floor(Math.random() * 99);
}

function getParents() {
    return getData(VS.parentsKey);
}

function saveParents(parents) {
    saveData(VS.parentsKey, parents);
}

function getChildren() {
    return getData(VS.childrenKey);
}

function saveChildren(children) {
    saveData(VS.childrenKey, children);
}

function getPayments() {
    return getData(VS.paymentsKey);
}

function savePayments(payments) {
    saveData(VS.paymentsKey, payments);
}

function getAnnouncements() {
    const saved = getData(VS.announcementsKey);

    if (saved.length === 0) {
        const defaultAnnouncements = [
            {
                id: makeId("ANN"),
                title: "Payment Reminder",
                type: "Payment Reminder",
                priority: "Important",
                message: "Please upload your monthly payment receipt before the 5th of every month.",
                date: new Date().toLocaleDateString("en-GB"),
                status: "Active"
            },
            {
                id: makeId("ANN"),
                title: "Delay Notice",
                type: "Delay Notice",
                priority: "Urgent",
                message: "The van may be late by 10 minutes due to traffic. Thank you for your patience.",
                date: new Date().toLocaleDateString("en-GB"),
                status: "Active"
            }
        ];

        saveData(VS.announcementsKey, defaultAnnouncements);
        return defaultAnnouncements;
    }

    return saved;
}

function saveAnnouncements(announcements) {
    saveData(VS.announcementsKey, announcements);
}




function requireParentLogin() {
    const parent = getCurrentParent();

    if (!parent) {
        alert("Please login first.");
        window.location.href = "parent-login.html";
        return null;
    }

    return parent;
}

function parentLogout() {
    localStorage.removeItem(VS.currentParentKey);
    window.location.href = "index.html";
}

function adminLogout() {
    localStorage.removeItem(VS.adminKey);
    window.location.href = "index.html";
}

async function registerParent(event) {
    event.preventDefault();

    const submitButton = event.target.querySelector("button[type='submit']");
    const originalText = submitButton ? submitButton.innerText : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Registering...";
    }

    const parentData = {
        name: document.getElementById("parentName").value.trim(),
        phone: document.getElementById("parentPhone").value.trim(),
        email: document.getElementById("parentEmail").value.trim(),
        password: document.getElementById("parentPassword").value
    };

    try {
        const response = await fetch("/api/register-parent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(parentData)
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Registration failed.");
            return;
        }

        alert("Parent account registered successfully. You can now login.");
        window.location.href = "parent-login.html";
    } catch (error) {
        alert("Registration error: " + error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
    }
}

async function parentLogin(event) {
    event.preventDefault();

    const submitButton = event.target.querySelector("button[type='submit']");
    const originalText = submitButton ? submitButton.innerText : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Logging in...";
    }

    const loginData = {
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value
    };

    try {
        const response = await fetch("/api/login-parent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Invalid email or password.");
            return;
        }

        localStorage.setItem(VS.currentParentKey, JSON.stringify(result.parent));

        alert("Login successful.");
        window.location.href = "parent-dashboard.html";
    } catch (error) {
        alert("Login error: " + error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
    }
}





async function saveChild(event) {
    event.preventDefault();

    const parent = requireParentLogin();
    if (!parent) return;

    const submitButton = event.target.querySelector("button[type='submit']");
    const originalText = submitButton ? submitButton.innerText : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Saving...";
    }

    const childData = {
        parentId: parent.id,
        name: document.getElementById("studentName").value.trim(),
        school: document.getElementById("schoolName").value,
        classYear: document.getElementById("classYear").value.trim(),
        session: document.getElementById("session").value,
        homeAddress: document.getElementById("homeAddress").value.trim(),
        pickupLocation: document.getElementById("pickupLocation").value.trim(),
        notes: document.getElementById("notes") ? document.getElementById("notes").value.trim() : ""
    };

    try {
        const response = await fetch("/api/add-student", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(childData)
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to save child details.");
            return;
        }

        alert("Child details saved successfully in MongoDB. Waiting for admin approval.");
        window.location.href = "parent-dashboard.html";
    } catch (error) {
        alert("Add child error: " + error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
    }
}


function getStudentStatusBadgeClass(status) {
    if (status === "Active") return "paid";
    if (status === "Accepted") return "morning";
    if (status === "Rejected") return "rejected";
    if (status === "Pending Review") return "pending";
    return "unpaid";
}

function getAnnouncementCategoryBadgeClass(type) {
    if (type === "Emergency Notice") return "rejected";
    if (type === "Delay Notice") return "pending";
    if (type === "Payment Reminder") return "morning";
    if (type === "Holiday Notice") return "afternoon";
    if (type === "Route Update") return "paid";
    return "unpaid";
}





async function loadParentDashboard() {
    const parent = requireParentLogin();
    if (!parent) return;

    const announcementBox = document.getElementById("announcementList");
    const table = document.getElementById("childrenTable");

    if (announcementBox) {
        announcementBox.innerHTML = `<div class="announcement announcement-card-pro"><strong>Loading announcements...</strong></div>`;
    }

    if (table) {
        table.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">Loading dashboard data...</td>
            </tr>
        `;
    }

    try {
        const response = await fetch(`/api/parent-dashboard?parentId=${encodeURIComponent(parent.id)}`);
        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to load dashboard.");
            return;
        }

        const currentParent = result.parent || parent;
        const children = result.children || [];
        const payments = result.payments || [];
        const announcements = result.announcements || [];

        localStorage.setItem(VS.currentParentKey, JSON.stringify(currentParent));

        document.getElementById("parentNameDisplay").innerText = currentParent.name;
        document.getElementById("totalChildren").innerText = children.length;

        const pendingCount = payments.filter(payment => payment.status === "Pending").length;
        const paidAmount = payments
            .filter(payment => payment.status === "Paid")
            .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

        document.getElementById("pendingPayment").innerText = pendingCount;
        document.getElementById("totalPaid").innerText = "RM" + paidAmount;

        if (announcementBox) {
            announcementBox.innerHTML = "";

            announcements.slice(0, 3).forEach(item => {
                const categoryClass = getAnnouncementCategoryBadgeClass(item.type);

                announcementBox.innerHTML += `
                    <div class="announcement announcement-card-pro">
                        <div class="announcement-top-row">
                            <span class="badge ${categoryClass}">${item.type}</span>
                            <small>${item.date || ""}</small>
                        </div>
                        <strong>📢 ${item.title}</strong>
                        <p>${item.message}</p>
                    </div>
                `;
            });

            if (announcements.length === 0) {
                announcementBox.innerHTML = `
                    <div class="announcement announcement-card-pro">
                        <strong>No announcements yet.</strong>
                        <p>Updates from admin will appear here.</p>
                    </div>
                `;
            }
        }

        if (!table) return;

        table.innerHTML = "";

        if (children.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-row">
                        No child registered yet. Click <strong>Register Child</strong> to register your child.
                    </td>
                </tr>
            `;
        } else {
            children.forEach(child => {
                const latestPayment = payments
                    .filter(payment => payment.studentId === child.id)
                    .sort((a, b) => new Date(b.createdSort) - new Date(a.createdSort))[0];

                const paymentStatus = latestPayment ? latestPayment.status : (child.paymentStatus || "Unpaid");
                const badgeClass = paymentStatus === "Paid" ? "paid" : paymentStatus === "Pending" ? "pending" : paymentStatus === "Rejected" ? "rejected" : "unpaid";
                const studentStatusClass = getStudentStatusBadgeClass(child.status || "Pending Review");

                table.innerHTML += `
                    <tr>
                        <td><strong>${child.name}</strong><br><small>${child.id}</small></td>
                        <td>${child.school}</td>
                        <td>${child.classYear}</td>
                        <td>${child.session}</td>
                        <td>${child.pickupLocation}</td>
                        <td><span class="badge ${studentStatusClass}">${child.status || "Pending Review"}</span></td>
                        <td><span class="badge ${badgeClass}">${paymentStatus}</span></td>
                        <td>
                            <button class="small-btn danger" onclick="deleteChild('${child.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            });
        }

        loadParentPaymentHistory(payments);
    } catch (error) {
        alert("Dashboard error: " + error.message);

        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-row">Failed to load dashboard data.</td>
                </tr>
            `;
        }
    }
}




function deleteChild(childId) {
    alert("Delete child from MongoDB will be connected in a later admin step. For now, please manage this record from MongoDB if needed.");
}






















function getPaymentBadgeClass(status) {
    if (status === "Paid") return "paid";
    if (status === "Pending") return "pending";
    if (status === "Rejected") return "rejected";
    return "unpaid";
}



















function clearAllDemoData() {
    const confirmClear = confirm("This will delete all localStorage data in this browser. Continue?");
    if (!confirmClear) return;

    localStorage.removeItem(VS.parentsKey);
    localStorage.removeItem(VS.childrenKey);
    localStorage.removeItem(VS.paymentsKey);
    localStorage.removeItem(VS.announcementsKey);
    localStorage.removeItem(VS.currentParentKey);

    alert("All local data cleared.");
    window.location.href = "index.html";
}


function toggleFAQ(button) {
    const card = button.closest(".faq-card-pro");
    const isOpen = card.classList.contains("open");

    document.querySelectorAll(".faq-card-pro").forEach(item => {
        item.classList.remove("open");
        const icon = item.querySelector(".faq-question strong");
        if (icon) icon.innerText = "+";
    });

    if (!isOpen) {
        card.classList.add("open");
        const icon = card.querySelector(".faq-question strong");
        if (icon) icon.innerText = "−";
    }
}




function toggleMobileMenu() {
    const menu = document.getElementById("mobileMenu");
    if (!menu) return;
    menu.classList.toggle("show-mobile-menu");
}

document.addEventListener("click", function(event) {
    const menu = document.getElementById("mobileMenu");
    const button = document.querySelector(".mobile-menu-btn");

    if (!menu || !button) return;

    const clickedInsideMenu = menu.contains(event.target);
    const clickedButton = button.contains(event.target);

    if (!clickedInsideMenu && !clickedButton) {
        menu.classList.remove("show-mobile-menu");
    }
});



const RULES_KEY = "vansystem_rules";




































function closeParentDetails() {
    const modal = document.getElementById("parentDetailModal");

    if (modal) {
        modal.classList.remove("show");
    }
}

window.addEventListener("click", function(event) {
    const modal = document.getElementById("parentDetailModal");

    if (!modal) return;

    if (event.target === modal) {
        closeParentDetails();
    }
});

function getCurrentParent() {
    const savedParent = localStorage.getItem(VS.currentParentKey);

    if (!savedParent) {
        return null;
    }

    try {
        const parent = JSON.parse(savedParent);

        if (parent && parent.id) {
            return parent;
        }
    } catch (error) {
        return getParents().find(parent => parent.id === savedParent) || null;
    }

    return null;
}

async function loadPaymentUploadPage() {
    const parent = requireParentLogin();
    if (!parent) return;

    const select = document.getElementById("paymentStudent");
    const notice = document.getElementById("paymentNotice");

    if (!select) return;

    select.innerHTML = `<option value="">Loading students from MongoDB...</option>`;

    try {
        const response = await fetch(`/api/parent-dashboard?parentId=${encodeURIComponent(parent.id)}&email=${encodeURIComponent(parent.email || "")}`);
        const result = await response.json();

        console.log("PAYMENT PAGE DASHBOARD RESULT:", result);

        if (!result.success) {
            select.innerHTML = `<option value="">No student found</option>`;
            if (notice) {
                notice.innerHTML = `<strong>Error:</strong> ${result.message || "Failed to load students."}`;
            }
            return;
        }

        const children = result.children || [];

        select.innerHTML = `<option value="">Select student</option>`;

        children.forEach(child => {
            select.innerHTML += `<option value="${child.id}">${child.name} - ${child.school} (${child.status || "Pending Review"})</option>`;
        });

        if (children.length === 0 && notice) {
            notice.innerHTML = `
                <strong>No child found.</strong>
                This page checked MongoDB but no child is linked to this parent account.
                Please make sure you are logged in with the same parent email used when registering the child.
            `;
        } else if (notice) {
            notice.innerHTML = `
                <strong>${children.length} child found.</strong>
                Select the student and upload payment proof.
            `;
        }
    } catch (error) {
        select.innerHTML = `<option value="">Failed to load students</option>`;
        if (notice) {
            notice.innerHTML = `<strong>Error:</strong> ${error.message}`;
        }
    }
}







function connectPaymentButtons() {
    const actionButtons = document.querySelectorAll(".payment-action-btn");

    actionButtons.forEach(button => {
        button.addEventListener("click", function () {
            const paymentId = this.dataset.id;
            const status = this.dataset.status;
            updatePaymentStatus(paymentId, status);
        });
    });

    const receiptButtons = document.querySelectorAll(".receipt-button");

    receiptButtons.forEach(button => {
        button.addEventListener("click", function () {
            const receipt = this.dataset.receipt || "No receipt file name";
            const note = this.dataset.note || "No note";

            alert("Receipt file: " + receipt + "\nPayment note: " + note);
        });
    });
}

async function updatePaymentStatus(paymentId, status) {
    try {
        const response = await fetch("/api/update-payment-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                paymentId,
                status
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to update payment.");
            return;
        }

        alert("Payment has been updated to " + status + " in MongoDB.");
        loadAdminPayments();
    } catch (error) {
        alert("Update payment error: " + error.message);
    }
}

async function loadAdminDashboard() {
    const recentTable = document.getElementById("recentPaymentsTable");

    if (recentTable) {
        recentTable.innerHTML = `<tr><td colspan="5" class="empty-row">Loading dashboard from MongoDB...</td></tr>`;
    }

    try {
        const response = await fetch("/api/admin-dashboard");
        const result = await response.json();

        console.log("ADMIN DASHBOARD RESULT:", result);

        if (!result.success) {
            alert(result.message || "Failed to load admin dashboard.");
            return;
        }

        const summary = result.summary || {};
        const recentPayments = result.recentPayments || [];

        const totalParentsEl = document.getElementById("totalParents");
        const totalStudentsEl = document.getElementById("totalStudents");
        const morningCountEl = document.getElementById("morningCount");
        const afternoonCountEl = document.getElementById("afternoonCount");
        const pendingPaymentsEl = document.getElementById("pendingPayments");
        const totalPaidMonthEl = document.getElementById("totalPaidMonth");

        if (totalParentsEl) totalParentsEl.innerText = summary.totalParents || 0;
        if (totalStudentsEl) totalStudentsEl.innerText = summary.totalStudents || 0;
        if (morningCountEl) morningCountEl.innerText = summary.morningCount || 0;
        if (afternoonCountEl) afternoonCountEl.innerText = summary.afternoonCount || 0;
        if (pendingPaymentsEl) pendingPaymentsEl.innerText = summary.pendingPayments || 0;
        if (totalPaidMonthEl) totalPaidMonthEl.innerText = "RM" + (summary.totalPaidMonth || 0);

        if (!recentTable) return;

        recentTable.innerHTML = "";

        if (recentPayments.length === 0) {
            recentTable.innerHTML = `<tr><td colspan="5" class="empty-row">No payment submitted yet.</td></tr>`;
            return;
        }

        recentPayments.forEach(payment => {
            const badgeClass = getPaymentBadgeClass(payment.status || "Pending");

            recentTable.innerHTML += `
                <tr>
                    <td><strong>${payment.parentName || "-"}</strong><br><small>${payment.parentPhone || ""}</small></td>
                    <td>${payment.studentName || "-"}</td>
                    <td>${payment.month || "-"}</td>
                    <td><strong>RM${payment.amount || 0}</strong></td>
                    <td><span class="badge ${badgeClass}">${payment.status || "Pending"}</span></td>
                </tr>
            `;
        });
    } catch (error) {
        alert("Admin dashboard error: " + error.message);

        if (recentTable) {
            recentTable.innerHTML = `<tr><td colspan="5" class="empty-row">Failed to load dashboard.</td></tr>`;
        }
    }
}







async function loadAdminAnnouncements() {
    const table = document.getElementById("announcementTable");
    const preview = document.getElementById("announcementPreviewList");

    if (table) {
        table.innerHTML = `<tr><td colspan="6" class="empty-row">Loading announcements from MongoDB...</td></tr>`;
    }

    try {
        const response = await fetch("/api/admin-dashboard?action=announcements");
        const result = await response.json();

        console.log("ADMIN ANNOUNCEMENTS RESULT:", result);

        if (!result.success) {
            alert(result.message || "Failed to load announcements.");
            if (table) {
                table.innerHTML = `<tr><td colspan="6" class="empty-row">Failed to load announcements.</td></tr>`;
            }
            return;
        }

        const announcements = result.announcements || [];
        const summary = result.summary || {};

        const totalEl = document.getElementById("announcementTotal");
        const monthEl = document.getElementById("announcementMonth");
        const importantEl = document.getElementById("announcementImportant");
        const generalEl = document.getElementById("announcementGeneral");

        if (totalEl) totalEl.innerText = summary.totalAnnouncements || 0;
        if (monthEl) monthEl.innerText = summary.thisMonth || 0;
        if (importantEl) importantEl.innerText = summary.importantNotices || 0;
        if (generalEl) generalEl.innerText = summary.generalUpdates || 0;

        if (table) table.innerHTML = "";
        if (preview) preview.innerHTML = "";

        if (announcements.length === 0) {
            if (table) {
                table.innerHTML = `<tr><td colspan="6" class="empty-row">No announcements posted yet.</td></tr>`;
            }

            if (preview) {
                preview.innerHTML = `
                    <div class="announcement announcement-card-pro normal-box">
                        <strong>No announcement yet.</strong>
                        <p>Announcements posted here will appear on the parent dashboard.</p>
                    </div>
                `;
            }

            return;
        }

        announcements.forEach(item => {
            const priorityClass = item.priority === "Urgent" ? "rejected" : item.priority === "Important" ? "pending" : "morning";
            const categoryClass = getAnnouncementCategoryBadgeClass(item.type);
            const statusClass = item.status === "Active" ? "paid" : "unpaid";
            const nextStatus = item.status === "Active" ? "Inactive" : "Active";

            if (table) {
                table.innerHTML += `
                    <tr>
                        <td><strong>${item.title}</strong><br><small>${item.message}</small></td>
                        <td><span class="badge ${categoryClass}">${item.type}</span></td>
                        <td><span class="badge ${priorityClass}">${item.priority}</span></td>
                        <td>${item.date || ""}</td>
                        <td><span class="badge ${statusClass}">${item.status}</span></td>
                        <td>
                            <button class="small-btn edit" onclick="updateAnnouncementStatus('${item.id}', '${nextStatus}')">${nextStatus}</button>
                            <button class="small-btn danger" onclick="deleteAnnouncement('${item.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            }

            if (preview && item.status === "Active") {
                preview.innerHTML += `
                    <div class="announcement announcement-card-pro ${item.priority === "Urgent" ? "urgent-box" : item.priority === "Important" ? "important-box" : "normal-box"}">
                        <div class="announcement-top-row">
                            <span class="badge ${categoryClass}">${item.type}</span>
                            <small>${item.date || ""}</small>
                        </div>
                        <strong>📢 ${item.title}</strong>
                        <p>${item.message}</p>
                    </div>
                `;
            }
        });

        if (preview && preview.innerHTML.trim() === "") {
            preview.innerHTML = `
                <div class="announcement announcement-card-pro normal-box">
                    <strong>No active announcement.</strong>
                    <p>Inactive announcements will not appear on the parent dashboard.</p>
                </div>
            `;
        }
    } catch (error) {
        alert("Announcements error: " + error.message);
        if (table) {
            table.innerHTML = `<tr><td colspan="6" class="empty-row">Failed to load announcements.</td></tr>`;
        }
    }
}

async function postAnnouncement(event) {
    event.preventDefault();

    const submitButton = event.target.querySelector("button[type='submit']");
    const originalText = submitButton ? submitButton.innerText : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Posting...";
    }

    const announcementData = {
        action: "post-announcement",
        title: document.getElementById("announcementTitle").value.trim(),
        type: document.getElementById("announcementType").value,
        priority: document.getElementById("announcementPriority").value,
        message: document.getElementById("announcementMessage").value.trim()
    };

    try {
        const response = await fetch("/api/admin-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(announcementData)
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to post announcement.");
            return;
        }

        alert("Announcement posted successfully in MongoDB.");
        document.getElementById("announcementForm").reset();
        loadAdminAnnouncements();
    } catch (error) {
        alert("Post announcement error: " + error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
    }
}

async function updateAnnouncementStatus(id, status) {
    try {
        const response = await fetch("/api/admin-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "update-announcement-status",
                announcementId: id,
                status
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to update announcement.");
            return;
        }

        alert("Announcement status changed to " + status + ".");
        loadAdminAnnouncements();
    } catch (error) {
        alert("Update announcement error: " + error.message);
    }
}

async function deleteAnnouncement(id) {
    const confirmDelete = confirm("Delete this announcement from MongoDB?");
    if (!confirmDelete) return;

    try {
        const response = await fetch("/api/admin-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "delete-announcement",
                announcementId: id
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to delete announcement.");
            return;
        }

        alert("Announcement deleted successfully.");
        loadAdminAnnouncements();
    } catch (error) {
        alert("Delete announcement error: " + error.message);
    }
}

function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read receipt file."));

        reader.readAsDataURL(file);
    });
}

function showReceiptInfo(receiptName, note, receiptDataUrl) {
    const name = receiptName || "No receipt file";
    const paymentNote = note || "No note";

    if (receiptDataUrl && receiptDataUrl.startsWith("data:")) {
        const win = window.open("", "_blank");

        if (win) {
            win.document.write(`
                <html>
                    <head>
                        <title>${name}</title>
                        <style>
                            body {
                                margin: 0;
                                padding: 24px;
                                font-family: Arial, sans-serif;
                                background: #f5f5f5;
                                color: #222;
                            }
                            .receipt-box {
                                max-width: 900px;
                                margin: auto;
                                background: white;
                                padding: 20px;
                                border-radius: 16px;
                                box-shadow: 0 10px 30px rgba(0,0,0,0.12);
                            }
                            img {
                                max-width: 100%;
                                height: auto;
                                display: block;
                                margin-top: 16px;
                                border-radius: 12px;
                            }
                            iframe {
                                width: 100%;
                                height: 80vh;
                                border: none;
                                margin-top: 16px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="receipt-box">
                            <h2>Payment Receipt</h2>
                            <p><strong>File:</strong> ${name}</p>
                            <p><strong>Note:</strong> ${paymentNote}</p>
                            ${
                                receiptDataUrl.startsWith("data:application/pdf")
                                    ? `<iframe src="${receiptDataUrl}"></iframe>`
                                    : `<img src="${receiptDataUrl}" alt="Payment receipt">`
                            }
                        </div>
                    </body>
                </html>
            `);
            win.document.close();
            return;
        }
    }

    alert("Receipt file: " + name + "\nPayment note: " + paymentNote + "\n\nActual receipt image is not available for this older payment record.");
}

async function submitPayment(event) {
    event.preventDefault();

    const parent = requireParentLogin();
    if (!parent) return;

    const studentId = document.getElementById("paymentStudent").value;

    if (!studentId) {
        alert("Please choose a student.");
        return;
    }

    const submitButton = event.target.querySelector("button[type='submit']");
    const originalText = submitButton ? submitButton.innerText : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Uploading...";
    }

    const receiptFile = document.getElementById("receiptFile").files[0];

    if (!receiptFile) {
        alert("Please upload a receipt image or PDF.");
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
        return;
    }

    const maxSize = 1.5 * 1024 * 1024;

    if (receiptFile.size > maxSize) {
        alert("Receipt file is too large. Please upload an image/PDF below 1.5MB.");
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
        return;
    }

    try {
        const receiptDataUrl = await fileToDataURL(receiptFile);

        const paymentData = {
            parentId: parent.id,
            parentEmail: parent.email || "",
            studentId,
            month: document.getElementById("paymentMonth").value,
            amount: Number(document.getElementById("paymentAmount").value),
            datePaid: document.getElementById("paymentDate").value,
            receiptName: receiptFile.name,
            receiptType: receiptFile.type || "",
            receiptSize: receiptFile.size || 0,
            receiptDataUrl,
            note: document.getElementById("paymentNote") ? document.getElementById("paymentNote").value.trim() : ""
        };

        const response = await fetch("/api/upload-payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to upload payment.");
            return;
        }

        alert("Payment proof and receipt image saved successfully in MongoDB. Waiting for admin approval.");
        window.location.href = "parent-dashboard.html";
    } catch (error) {
        alert("Payment upload error: " + error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
    }
}

function loadParentPaymentHistory(payments) {
    const historyTable = document.getElementById("paymentHistoryTable");
    const historyCount = document.getElementById("paymentHistoryCount");

    if (!historyTable) return;

    window.parentPaymentReceiptMap = {};

    historyTable.innerHTML = "";

    if (historyCount) {
        historyCount.innerText = payments.length;
    }

    if (payments.length === 0) {
        historyTable.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">No payment history yet.</td>
            </tr>
        `;
        return;
    }

    payments.slice().reverse().forEach(payment => {
        window.parentPaymentReceiptMap[payment.id] = payment;

        const badgeClass = payment.status === "Paid" ? "paid" : payment.status === "Pending" ? "pending" : payment.status === "Rejected" ? "rejected" : "unpaid";

        historyTable.innerHTML += `
            <tr>
                <td>${payment.month}</td>
                <td>${payment.studentName}</td>
                <td>RM${payment.amount}</td>
                <td><span class="badge ${badgeClass}">${payment.status}</span></td>
                <td>
                    <button class="receipt-button" onclick="viewParentReceipt('${payment.id}')">View</button>
                </td>
            </tr>
        `;
    });
}

function viewParentReceipt(paymentId) {
    const payment = (window.parentPaymentReceiptMap || {})[paymentId];

    if (!payment) {
        alert("Receipt record not found. Please refresh the dashboard.");
        return;
    }

    showReceiptInfo(payment.receiptName, payment.note, payment.receiptDataUrl);
}

async function loadAdminPayments() {
    const table = document.getElementById("adminPaymentsTable");

    if (table) {
        table.innerHTML = `<tr><td colspan="7" class="empty-row">Loading payments from MongoDB...</td></tr>`;
    }

    try {
        const response = await fetch("/api/admin-payments");
        const result = await response.json();

        console.log("ADMIN PAYMENTS RESULT:", result);

        if (!result.success) {
            alert(result.message || "Failed to load payments.");
            if (table) {
                table.innerHTML = `<tr><td colspan="7" class="empty-row">Failed to load payments.</td></tr>`;
            }
            return;
        }

        const payments = result.payments || [];
        const summary = result.summary || {
            totalCollection: 0,
            paidCount: 0,
            pendingCount: 0,
            unpaidCount: 0
        };

        window.adminPaymentReceiptMap = {};

        const totalCollectionEl = document.getElementById("paymentTotalCollection");
        const paidCountEl = document.getElementById("paymentPaidCount");
        const pendingCountEl = document.getElementById("paymentPendingCount");
        const unpaidCountEl = document.getElementById("paymentUnpaidCount");

        if (totalCollectionEl) totalCollectionEl.innerText = "RM" + summary.totalCollection;
        if (paidCountEl) paidCountEl.innerText = summary.paidCount;
        if (pendingCountEl) pendingCountEl.innerText = summary.pendingCount;
        if (unpaidCountEl) unpaidCountEl.innerText = summary.unpaidCount;

        if (!table) return;

        table.innerHTML = "";

        if (payments.length === 0) {
            table.innerHTML = `<tr><td colspan="7" class="empty-row">No payment proof uploaded yet.</td></tr>`;
            return;
        }

        payments.forEach(payment => {
            window.adminPaymentReceiptMap[payment.id] = payment;

            const badgeClass = getPaymentBadgeClass(payment.status);
            const isPaid = payment.status === "Paid";
            const isRejected = payment.status === "Rejected";

            table.innerHTML += `
                <tr>
                    <td><strong>${payment.parentName || "-"}</strong><br><small>${payment.parentPhone || ""}</small></td>
                    <td>${payment.studentName || "-"}</td>
                    <td>${payment.month || "-"}</td>
                    <td><strong>RM${payment.amount || 0}</strong></td>
                    <td>
                        <button class="receipt-button" onclick="viewAdminReceipt('${payment.id}')">
                            View Receipt
                        </button>
                        <br><small>${payment.receiptName || "No receipt file"}</small>
                    </td>
                    <td><span class="badge ${badgeClass}">${payment.status || "Pending"}</span></td>
                    <td>
                        <div class="action-row">
                            <button class="small-btn edit payment-action-btn" data-id="${payment.id}" data-status="Paid" ${isPaid ? "disabled" : ""}>
                                Approve
                            </button>
                            <button class="small-btn danger payment-action-btn" data-id="${payment.id}" data-status="Rejected" ${isRejected ? "disabled" : ""}>
                                Reject
                            </button>
                            <button class="small-btn warning payment-action-btn" data-id="${payment.id}" data-status="Pending" ${payment.status === "Pending" ? "disabled" : ""}>
                                Pending
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        connectPaymentButtons();
    } catch (error) {
        alert("Admin payments error: " + error.message);
        if (table) {
            table.innerHTML = `<tr><td colspan="7" class="empty-row">Failed to load payments.</td></tr>`;
        }
    }
}

function viewAdminReceipt(paymentId) {
    const payment = (window.adminPaymentReceiptMap || {})[paymentId];

    if (!payment) {
        alert("Receipt record not found. Please refresh admin payments.");
        return;
    }

    showReceiptInfo(payment.receiptName, payment.note, payment.receiptDataUrl);
}

// MUTAHUS_STEP11_RECEIPT_IMAGE_UPLOAD_MONGODB


async function fetchRulesFromMongoDB() {
    const response = await fetch("/api/admin-dashboard?action=rules");
    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || "Failed to load rules.");
    }

    return result.rules || [];
}

async function loadPublicRules() {
    const list = document.getElementById("publicRulesList");

    if (!list) return;

    list.innerHTML = `
        <div class="normal-box">
            <strong>Loading rules...</strong>
            <p>Please wait while we load the latest service rules.</p>
        </div>
    `;

    try {
        const rules = await fetchRulesFromMongoDB();

        list.innerHTML = "";

        if (rules.length === 0) {
            list.innerHTML = `
                <div class="normal-box">
                    <strong>No rules available yet.</strong>
                    <p>Rules added by admin will appear here.</p>
                </div>
            `;
            return;
        }

        rules.forEach((rule, index) => {
            list.innerHTML += `
                <div class="rule-card-pro">
                    <div class="rule-icon">${rule.icon || "✅"}</div>
                    <div>
                        <h3>${index + 1}. ${rule.title}</h3>
                        <p>${rule.description}</p>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        list.innerHTML = `
            <div class="normal-box">
                <strong>Failed to load rules.</strong>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function loadAdminRules() {
    const table = document.getElementById("adminRulesTable");

    if (!table) return;

    table.innerHTML = `<tr><td colspan="4" class="empty-row">Loading rules from MongoDB...</td></tr>`;

    try {
        const rules = await fetchRulesFromMongoDB();

        window.adminRulesData = rules;

        table.innerHTML = "";

        if (rules.length === 0) {
            table.innerHTML = `<tr><td colspan="4" class="empty-row">No rules added yet.</td></tr>`;
            return;
        }

        rules.forEach(rule => {
            table.innerHTML += `
                <tr>
                    <td>${rule.icon || "✅"}</td>
                    <td><strong>${rule.title}</strong></td>
                    <td>${rule.description}</td>
                    <td>
                        <button class="small-btn edit" onclick="editRule('${rule.id}')">Edit</button>
                        <button class="small-btn danger" onclick="deleteRule('${rule.id}')">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        table.innerHTML = `<tr><td colspan="4" class="empty-row">Failed to load rules: ${error.message}</td></tr>`;
    }
}

async function saveRuleFromAdmin(event) {
    event.preventDefault();

    const submitButton = event.target.querySelector("button[type='submit']");
    const originalText = submitButton ? submitButton.innerText : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Saving...";
    }

    const ruleData = {
        action: "save-rule",
        ruleId: document.getElementById("ruleId").value,
        icon: document.getElementById("ruleIcon").value,
        title: document.getElementById("ruleTitle").value.trim(),
        description: document.getElementById("ruleDescription").value.trim()
    };

    try {
        const response = await fetch("/api/admin-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(ruleData)
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to save rule.");
            return;
        }

        alert(result.message || "Rule saved successfully in MongoDB.");
        cancelRuleEdit();
        loadAdminRules();
    } catch (error) {
        alert("Save rule error: " + error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
    }
}

function editRule(id) {
    const rules = window.adminRulesData || [];
    const rule = rules.find(item => item.id === id);

    if (!rule) {
        alert("Rule not found. Please refresh the page.");
        return;
    }

    document.getElementById("ruleId").value = rule.id;
    document.getElementById("ruleIcon").value = rule.icon || "✅";
    document.getElementById("ruleTitle").value = rule.title || "";
    document.getElementById("ruleDescription").value = rule.description || "";

    const title = document.getElementById("ruleFormTitle");
    if (title) title.innerText = "Edit Rule";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelRuleEdit() {
    const form = document.getElementById("ruleForm");
    if (form) form.reset();

    const id = document.getElementById("ruleId");
    if (id) id.value = "";

    const title = document.getElementById("ruleFormTitle");
    if (title) title.innerText = "Add New Rule";
}

async function deleteRule(id) {
    const confirmDelete = confirm("Delete this rule from MongoDB?");

    if (!confirmDelete) return;

    try {
        const response = await fetch("/api/admin-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "delete-rule",
                ruleId: id
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to delete rule.");
            return;
        }

        alert("Rule deleted successfully.");
        loadAdminRules();
    } catch (error) {
        alert("Delete rule error: " + error.message);
    }
}

async function resetDefaultRules() {
    const confirmReset = confirm("Reset all rules to default in MongoDB? This will remove your edited rules.");

    if (!confirmReset) return;

    try {
        const response = await fetch("/api/admin-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "reset-rules"
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to reset rules.");
            return;
        }

        cancelRuleEdit();
        loadAdminRules();
        alert("Rules reset to default in MongoDB.");
    } catch (error) {
        alert("Reset rules error: " + error.message);
    }
}

// MUTAHUS_STEP12_RULES_MONGODB


async function loadAdminStudents() {
    const table = document.getElementById("adminStudentsTable");

    if (table) {
        table.innerHTML = `<tr><td colspan="8" class="empty-row">Loading students from MongoDB...</td></tr>`;
    }

    try {
        const response = await fetch("/api/admin-students");
        const result = await response.json();

        console.log("ADMIN STUDENTS RESULT:", result);

        if (!result.success) {
            alert(result.message || "Failed to load students.");
            if (table) {
                table.innerHTML = `<tr><td colspan="8" class="empty-row">Failed to load students.</td></tr>`;
            }
            return;
        }

        const children = result.students || [];
        const summary = result.summary || {
            totalStudents: children.length,
            morningCount: 0,
            afternoonCount: 0,
            totalSchools: 0
        };

        const totalEl = document.getElementById("adminTotalStudents");
        const morningEl = document.getElementById("adminMorningStudents");
        const afternoonEl = document.getElementById("adminAfternoonStudents");
        const schoolEl = document.getElementById("adminTotalSchools");

        if (totalEl) totalEl.innerText = summary.totalStudents || 0;
        if (morningEl) morningEl.innerText = summary.morningCount || 0;
        if (afternoonEl) afternoonEl.innerText = summary.afternoonCount || 0;
        if (schoolEl) schoolEl.innerText = summary.totalSchools || 0;

        if (!table) return;

        table.innerHTML = "";

        if (children.length === 0) {
            table.innerHTML = `<tr><td colspan="8" class="empty-row">No students added yet.</td></tr>`;
            return;
        }

        children.forEach(child => {
            const sessionClass = child.session === "Morning" ? "morning" : "afternoon";
            const status = child.status || "Pending Review";
            const statusClass = getStudentStatusBadgeClass(status);
            const paymentClass = getPaymentBadgeClass(child.paymentStatus || "Unpaid");

            table.innerHTML += `
                <tr>
                    <td>
                        <strong>${child.name || "-"}</strong>
                        <br><small>Student ID: ${child.id}</small>
                    </td>
                    <td>
                        ${child.parentName || "-"}
                        <br><small>${child.parentPhone || ""}</small>
                        <br><small>${child.parentEmail || ""}</small>
                    </td>
                    <td>${child.school || "-"}</td>
                    <td>${child.classYear || "-"}</td>
                    <td><span class="badge ${sessionClass}">${child.session || "-"}</span></td>
                    <td>${child.pickupLocation || "-"}</td>
                    <td>
                        <span class="badge ${statusClass}">${status}</span>
                        <br><small>Payment: <span class="badge ${paymentClass}">${child.paymentStatus || "Unpaid"}</span></small>
                    </td>
                    <td>
                        <div class="action-row">
                            <button class="small-btn edit" onclick="updateStudentStatus('${child.id}', 'Accepted')" ${status === "Accepted" ? "disabled" : ""}>Accept</button>
                            <button class="small-btn danger" onclick="updateStudentStatus('${child.id}', 'Rejected')" ${status === "Rejected" ? "disabled" : ""}>Reject</button>
                            <button class="small-btn warning" onclick="updateStudentStatus('${child.id}', 'Active')" ${status === "Active" ? "disabled" : ""}>Mark Active</button>
                            <button class="small-btn danger" onclick="removeStudent('${child.id}')">Remove</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        alert("Admin students error: " + error.message);

        if (table) {
            table.innerHTML = `<tr><td colspan="8" class="empty-row">Failed to load students.</td></tr>`;
        }
    }
}

async function updateStudentStatus(childId, status) {
    try {
        const response = await fetch("/api/update-student-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "update-status",
                studentId: childId,
                status
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to update student status.");
            return;
        }

        alert("Student status updated to " + status + " in MongoDB.");
        loadAdminStudents();
    } catch (error) {
        alert("Update student error: " + error.message);
    }
}

async function removeStudent(childId) {
    const confirmRemove = confirm("Are you sure you want to remove this student from MongoDB? Related payment records will also be removed.");

    if (!confirmRemove) return;

    try {
        const response = await fetch("/api/update-student-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "remove-student",
                studentId: childId
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to remove student.");
            return;
        }

        alert("Student removed successfully from MongoDB.");
        loadAdminStudents();
    } catch (error) {
        alert("Remove student error: " + error.message);
    }
}

// MUTAHUS_STEP13_ADMIN_STUDENTS_MONGODB_FINAL


async function loadAdminParents() {
    const table = document.getElementById("adminParentsTable");

    if (table) {
        table.innerHTML = `<tr><td colspan="7" class="empty-row">Loading parents from MongoDB...</td></tr>`;
    }

    try {
        const response = await fetch("/api/admin-parents");
        const result = await response.json();

        console.log("ADMIN PARENTS RESULT:", result);

        if (!result.success) {
            alert(result.message || "Failed to load parents.");
            if (table) {
                table.innerHTML = `<tr><td colspan="7" class="empty-row">Failed to load parents.</td></tr>`;
            }
            return;
        }

        const parents = result.parents || [];
        const summary = result.summary || {};

        window.adminParentsData = parents;

        const totalParentsEl = document.getElementById("parentTotalParents");
        const activeParentsEl = document.getElementById("parentActiveParents");
        const pendingParentsEl = document.getElementById("parentPendingParents");
        const totalChildrenEl = document.getElementById("parentTotalChildren");

        if (totalParentsEl) totalParentsEl.innerText = summary.totalParents || 0;
        if (activeParentsEl) activeParentsEl.innerText = summary.activeParents || 0;
        if (pendingParentsEl) pendingParentsEl.innerText = summary.pendingParents || 0;
        if (totalChildrenEl) totalChildrenEl.innerText = summary.totalChildren || 0;

        if (!table) return;

        table.innerHTML = "";

        if (parents.length === 0) {
            table.innerHTML = `<tr><td colspan="7" class="empty-row">No parents registered yet.</td></tr>`;
            return;
        }

        parents.forEach(parent => {
            const payStatus = parent.paymentStatus || "Unpaid";
            const payClass = getPaymentBadgeClass(payStatus);
            const parentStatus = parent.status || "Active";
            const parentStatusClass = parentStatus === "Pending" ? "pending" : parentStatus === "Rejected" ? "rejected" : "paid";

            table.innerHTML += `
                <tr>
                    <td>
                        <strong>${parent.name || "-"}</strong>
                        <br><small>Parent ID: ${parent.id}</small>
                    </td>
                    <td>${parent.phone || "-"}</td>
                    <td>${parent.email || "-"}</td>
                    <td>${parent.childrenCount || 0}</td>
                    <td><span class="badge ${payClass}">${payStatus}</span></td>
                    <td><span class="badge ${parentStatusClass}">${parentStatus}</span></td>
                    <td>
                        <div class="action-row">
                            <button class="small-btn view" onclick="viewParentDetails('${parent.id}')">View</button>
                            <button class="small-btn edit" onclick="updateParentStatus('${parent.id}', 'Active')" ${parentStatus === "Active" ? "disabled" : ""}>Active</button>
                            <button class="small-btn warning" onclick="updateParentStatus('${parent.id}', 'Pending')" ${parentStatus === "Pending" ? "disabled" : ""}>Pending</button>
                            <button class="small-btn danger" onclick="updateParentStatus('${parent.id}', 'Rejected')" ${parentStatus === "Rejected" ? "disabled" : ""}>Reject</button>
                            <button class="small-btn danger" onclick="removeParentAndRecords('${parent.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        alert("Admin parents error: " + error.message);
        if (table) {
            table.innerHTML = `<tr><td colspan="7" class="empty-row">Failed to load parents.</td></tr>`;
        }
    }
}

function viewParentDetails(parentId) {
    const parents = window.adminParentsData || [];
    const parent = parents.find(item => item.id === parentId);

    if (!parent) {
        alert("Parent record not found. Please refresh the page.");
        return;
    }

    const parentChildren = parent.children || [];
    const parentPayments = parent.payments || [];

    const modal = document.getElementById("parentDetailModal");
    const modalBody = document.getElementById("parentDetailBody");

    if (!modal || !modalBody) {
        alert("Parent detail modal is missing from this page.");
        return;
    }

    const paidTotal = parentPayments
        .filter(payment => payment.status === "Paid")
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const pendingCount = parentPayments.filter(payment => payment.status === "Pending").length;

    let childrenRows = "";

    if (parentChildren.length === 0) {
        childrenRows = `
            <tr>
                <td colspan="6" class="empty-row">No child registered under this parent.</td>
            </tr>
        `;
    } else {
        parentChildren.forEach(child => {
            const statusClass = getStudentStatusBadgeClass(child.status || "Pending Review");

            childrenRows += `
                <tr>
                    <td><strong>${child.name}</strong><br><small>${child.id}</small></td>
                    <td>${child.school}</td>
                    <td>${child.classYear}</td>
                    <td>${child.session}</td>
                    <td>${child.pickupLocation}</td>
                    <td><span class="badge ${statusClass}">${child.status || "Pending Review"}</span></td>
                </tr>
            `;
        });
    }

    let paymentRows = "";

    if (parentPayments.length === 0) {
        paymentRows = `
            <tr>
                <td colspan="5" class="empty-row">No payment submitted by this parent yet.</td>
            </tr>
        `;
    } else {
        parentPayments.forEach(payment => {
            const badgeClass = getPaymentBadgeClass(payment.status || "Pending");

            paymentRows += `
                <tr>
                    <td>${payment.month}</td>
                    <td>${payment.studentName}</td>
                    <td>RM${payment.amount}</td>
                    <td><span class="badge ${badgeClass}">${payment.status}</span></td>
                    <td>
                        <button class="receipt-button" onclick="showReceiptInfo('${payment.receiptName || ""}', '${payment.note || ""}', '${payment.receiptDataUrl || ""}')">View</button>
                    </td>
                </tr>
            `;
        });
    }

    modalBody.innerHTML = `
        <div class="parent-profile-card">
            <div class="profile-avatar">${(parent.name || "P").charAt(0).toUpperCase()}</div>
            <div>
                <h2>${parent.name}</h2>
                <p>${parent.phone || "-"} • ${parent.email || "-"}</p>
                <span class="badge paid">${parent.status || "Active"}</span>
            </div>
        </div>

        <div class="stats-grid mini-stats-grid">
            <div class="stat-card">
                <h3>Registered Children</h3>
                <h2>${parentChildren.length}</h2>
            </div>
            <div class="stat-card">
                <h3>Payment Records</h3>
                <h2>${parentPayments.length}</h2>
            </div>
            <div class="stat-card">
                <h3>Total Paid</h3>
                <h2>RM${paidTotal}</h2>
            </div>
            <div class="stat-card">
                <h3>Pending Payments</h3>
                <h2>${pendingCount}</h2>
            </div>
        </div>

        <h3>Children</h3>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Child</th>
                        <th>School</th>
                        <th>Class</th>
                        <th>Session</th>
                        <th>Pickup</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>${childrenRows}</tbody>
            </table>
        </div>

        <h3>Payments</h3>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Student</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Receipt</th>
                    </tr>
                </thead>
                <tbody>${paymentRows}</tbody>
            </table>
        </div>
    `;

    modal.classList.add("show");
}

async function updateParentStatus(parentId, status) {
    try {
        const response = await fetch("/api/admin-parents", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "update-parent-status",
                parentId,
                status
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to update parent status.");
            return;
        }

        alert("Parent status updated to " + status + " in MongoDB.");
        loadAdminParents();
    } catch (error) {
        alert("Update parent error: " + error.message);
    }
}

async function removeParentAndRecords(parentId) {
    const confirmRemove = confirm("Delete this parent from MongoDB? This will also delete their children and payment records.");

    if (!confirmRemove) return;

    try {
        const response = await fetch("/api/admin-parents", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "delete-parent",
                parentId
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to delete parent.");
            return;
        }

        alert("Parent, children and payment records deleted successfully.");
        loadAdminParents();
    } catch (error) {
        alert("Delete parent error: " + error.message);
    }
}

// MUTAHUS_STEP14_ADMIN_PARENTS_MONGODB_FINAL


async function adminLogin(event) {
    event.preventDefault();

    const submitButton = event.target.querySelector("button[type='submit']");
    const originalText = submitButton ? submitButton.innerText : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Logging in...";
    }

    const loginData = {
        action: "admin-login",
        username: document.getElementById("adminUsername").value.trim(),
        password: document.getElementById("adminPassword").value
    };

    try {
        const response = await fetch("/api/admin-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Invalid admin username or password.");
            return;
        }

        localStorage.setItem(VS.adminKey, JSON.stringify(result.admin));

        alert("Admin login successful.");
        window.location.href = "admin-dashboard.html";
    } catch (error) {
        alert("Admin login error: " + error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
    }
}

// MUTAHUS_STEP15_ADMIN_LOGIN_MONGODB


function getCurrentAdmin() {
    const savedAdmin = localStorage.getItem(VS.adminKey);

    if (!savedAdmin) {
        return null;
    }

    try {
        const admin = JSON.parse(savedAdmin);

        if (admin && admin.username && admin.status !== "Inactive") {
            return admin;
        }
    } catch (error) {
        if (savedAdmin === "true") {
            return {
                username: "admin",
                name: "Admin",
                role: "admin",
                status: "Active"
            };
        }
    }

    return null;
}

function requireAdminLogin() {
    const admin = getCurrentAdmin();

    if (!admin) {
        alert("Please login as admin first.");
        window.location.href = "admin-login.html";
        return null;
    }

    return admin;
}

function protectAdminPages() {
    const page = window.location.pathname.split("/").pop() || "index.html";

    const protectedAdminPages = [
        "admin-dashboard.html",
        "admin-students.html",
        "admin-parents.html",
        "admin-payments.html",
        "admin-announcements.html",
        "admin-rules.html"
    ];

    if (protectedAdminPages.includes(page)) {
        requireAdminLogin();
    }

    if (page === "admin-login.html" && getCurrentAdmin()) {
        window.location.href = "admin-dashboard.html";
    }
}

document.addEventListener("DOMContentLoaded", protectAdminPages);

// Wrap admin loader functions so direct page access is blocked before data loads.
if (typeof loadAdminDashboard === "function") {
    const originalLoadAdminDashboard = loadAdminDashboard;
    loadAdminDashboard = function () {
        if (!requireAdminLogin()) return;
        return originalLoadAdminDashboard();
    };
}

if (typeof loadAdminStudents === "function") {
    const originalLoadAdminStudents = loadAdminStudents;
    loadAdminStudents = function () {
        if (!requireAdminLogin()) return;
        return originalLoadAdminStudents();
    };
}

if (typeof loadAdminParents === "function") {
    const originalLoadAdminParents = loadAdminParents;
    loadAdminParents = function () {
        if (!requireAdminLogin()) return;
        return originalLoadAdminParents();
    };
}

if (typeof loadAdminPayments === "function") {
    const originalLoadAdminPayments = loadAdminPayments;
    loadAdminPayments = function () {
        if (!requireAdminLogin()) return;
        return originalLoadAdminPayments();
    };
}

if (typeof loadAdminAnnouncements === "function") {
    const originalLoadAdminAnnouncements = loadAdminAnnouncements;
    loadAdminAnnouncements = function () {
        if (!requireAdminLogin()) return;
        return originalLoadAdminAnnouncements();
    };
}

if (typeof loadAdminRules === "function") {
    const originalLoadAdminRules = loadAdminRules;
    loadAdminRules = function () {
        if (!requireAdminLogin()) return;
        return originalLoadAdminRules();
    };
}

// MUTAHUS_STEP16_ADMIN_PAGE_PROTECTION


function protectParentPages() {
    const page = window.location.pathname.split("/").pop() || "index.html";

    const protectedParentPages = [
        "parent-dashboard.html",
        "add-student.html",
        "upload-payment.html"
    ];

    if (protectedParentPages.includes(page)) {
        requireParentLogin();
    }

    if (page === "parent-login.html" && getCurrentParent()) {
        window.location.href = "parent-dashboard.html";
    }
}

document.addEventListener("DOMContentLoaded", protectParentPages);

// Extra protection before parent page data loads.
if (typeof loadParentDashboard === "function") {
    const originalLoadParentDashboard = loadParentDashboard;
    loadParentDashboard = function () {
        if (!requireParentLogin()) return;
        return originalLoadParentDashboard();
    };
}

if (typeof loadPaymentUploadPage === "function") {
    const originalLoadPaymentUploadPage = loadPaymentUploadPage;
    loadPaymentUploadPage = function () {
        if (!requireParentLogin()) return;
        return originalLoadPaymentUploadPage();
    };
}

// MUTAHUS_STEP17_PARENT_PAGE_PROTECTION


function csvEscape(value) {
    const text = String(value ?? "").replace(/"/g, '""');
    return `"${text}"`;
}

function downloadCSV(filename, rows) {
    if (!rows || rows.length === 0) {
        alert("No data available to export.");
        return;
    }

    const csvContent = rows.map(row => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function todayFileDate() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
}

async function exportStudentsCSV() {
    try {
        const response = await fetch("/api/admin-students");
        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to export students.");
            return;
        }

        const students = result.students || [];
        const rows = [
            [
                "Student ID",
                "Student Name",
                "Parent Name",
                "Parent Phone",
                "Parent Email",
                "School",
                "Class/Year",
                "Session",
                "Home Address",
                "Pickup Location",
                "Student Status",
                "Payment Status",
                "Created At"
            ]
        ];

        students.forEach(student => {
            rows.push([
                student.id,
                student.name,
                student.parentName,
                student.parentPhone,
                student.parentEmail,
                student.school,
                student.classYear,
                student.session,
                student.homeAddress,
                student.pickupLocation,
                student.status,
                student.paymentStatus,
                student.createdAt
            ]);
        });

        downloadCSV(`mutahus-students-${todayFileDate()}.csv`, rows);
    } catch (error) {
        alert("Export students error: " + error.message);
    }
}

async function exportParentsCSV() {
    try {
        const response = await fetch("/api/admin-parents");
        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to export parents.");
            return;
        }

        const parents = result.parents || [];
        const rows = [
            [
                "Parent ID",
                "Parent Name",
                "Phone",
                "Email",
                "Status",
                "Children Count",
                "Payment Status",
                "Created At"
            ]
        ];

        parents.forEach(parent => {
            rows.push([
                parent.id,
                parent.name,
                parent.phone,
                parent.email,
                parent.status,
                parent.childrenCount,
                parent.paymentStatus,
                parent.createdAt
            ]);
        });

        downloadCSV(`mutahus-parents-${todayFileDate()}.csv`, rows);
    } catch (error) {
        alert("Export parents error: " + error.message);
    }
}

async function exportPaymentsCSV() {
    try {
        const response = await fetch("/api/admin-payments");
        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to export payments.");
            return;
        }

        const payments = result.payments || [];
        const rows = [
            [
                "Payment ID",
                "Parent Name",
                "Parent Phone",
                "Parent Email",
                "Student Name",
                "Month",
                "Amount",
                "Date Paid",
                "Receipt Name",
                "Status",
                "Created At",
                "Reviewed At",
                "Note"
            ]
        ];

        payments.forEach(payment => {
            rows.push([
                payment.id,
                payment.parentName,
                payment.parentPhone,
                payment.parentEmail,
                payment.studentName,
                payment.month,
                payment.amount,
                payment.datePaid,
                payment.receiptName,
                payment.status,
                payment.createdAt,
                payment.reviewedAt,
                payment.note
            ]);
        });

        downloadCSV(`mutahus-payments-${todayFileDate()}.csv`, rows);
    } catch (error) {
        alert("Export payments error: " + error.message);
    }
}






// MUTAHUS_STEP18_ADMIN_EXPORT_REPORTS


// MUTAHUS_FIX_EXPORT_CSV_CLEAN_LAYOUT


async function loadParentProfilePage() {
    const parent = requireParentLogin();

    if (!parent) return;

    const nameInput = document.getElementById("profileName");
    const phoneInput = document.getElementById("profilePhone");
    const emailInput = document.getElementById("profileEmail");
    const infoBox = document.getElementById("profileInfoBox");

    if (nameInput) nameInput.value = parent.name || "";
    if (phoneInput) phoneInput.value = parent.phone || "";
    if (emailInput) emailInput.value = parent.email || "";

    try {
        const response = await fetch(`/api/parent-dashboard?parentId=${encodeURIComponent(parent.id)}&email=${encodeURIComponent(parent.email || "")}`);
        const result = await response.json();

        if (!result.success) {
            if (infoBox) infoBox.innerHTML = `<p>${result.message || "Failed to load profile."}</p>`;
            return;
        }

        const currentParent = result.parent || parent;

        localStorage.setItem(VS.currentParentKey, JSON.stringify(currentParent));

        if (nameInput) nameInput.value = currentParent.name || "";
        if (phoneInput) phoneInput.value = currentParent.phone || "";
        if (emailInput) emailInput.value = currentParent.email || "";

        if (infoBox) {
            infoBox.innerHTML = `
                <strong>${currentParent.name || "Parent"}</strong>
                <p>${currentParent.phone || "-"} • ${currentParent.email || "-"}</p>
                <span class="badge paid">${currentParent.status || "Active"}</span>
            `;
        }
    } catch (error) {
        if (infoBox) infoBox.innerHTML = `<p>Profile error: ${error.message}</p>`;
    }
}

async function updateParentProfile(event) {
    event.preventDefault();

    const parent = requireParentLogin();
    if (!parent) return;

    const submitButton = event.target.querySelector("button[type='submit']");
    const originalText = submitButton ? submitButton.innerText : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Saving...";
    }

    const profileData = {
        action: "update-parent-profile",
        parentId: parent.id,
        name: document.getElementById("profileName").value.trim(),
        phone: document.getElementById("profilePhone").value.trim(),
        email: document.getElementById("profileEmail").value.trim()
    };

    try {
        const response = await fetch("/api/parent-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(profileData)
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to update profile.");
            return;
        }

        localStorage.setItem(VS.currentParentKey, JSON.stringify(result.parent));

        alert("Profile updated successfully.");
        loadParentProfilePage();
    } catch (error) {
        alert("Update profile error: " + error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
    }
}

async function changeParentPassword(event) {
    event.preventDefault();

    const parent = requireParentLogin();
    if (!parent) return;

    const oldPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword.length < 6) {
        alert("New password must be at least 6 characters.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match.");
        return;
    }

    const submitButton = event.target.querySelector("button[type='submit']");
    const originalText = submitButton ? submitButton.innerText : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Changing...";
    }

    try {
        const response = await fetch("/api/parent-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "change-parent-password",
                parentId: parent.id,
                oldPassword,
                newPassword
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to change password.");
            return;
        }

        alert("Password changed successfully. Please login again.");
        localStorage.removeItem(VS.currentParentKey);
        window.location.href = "parent-login.html";
    } catch (error) {
        alert("Change password error: " + error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
    }
}

function protectParentProfilePage() {
    const page = window.location.pathname.split("/").pop() || "index.html";

    if (page === "parent-profile.html") {
        requireParentLogin();
    }
}

document.addEventListener("DOMContentLoaded", protectParentProfilePage);

// MUTAHUS_STEP19_PARENT_PROFILE_PASSWORD


async function resetParentPassword(event) {
    event.preventDefault();

    const email = document.getElementById("resetEmail").value.trim();
    const phone = document.getElementById("resetPhone").value.trim();
    const newPassword = document.getElementById("resetNewPassword").value;
    const confirmPassword = document.getElementById("resetConfirmPassword").value;

    if (newPassword.length < 6) {
        alert("New password must be at least 6 characters.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match.");
        return;
    }

    const submitButton = event.target.querySelector("button[type='submit']");
    const originalText = submitButton ? submitButton.innerText : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Resetting...";
    }

    try {
        const response = await fetch("/api/parent-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "reset-parent-password",
                email,
                phone,
                newPassword
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to reset password.");
            return;
        }

        alert("Password reset successfully. Please login with your new password.");
        window.location.href = "parent-login.html";
    } catch (error) {
        alert("Reset password error: " + error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
    }
}

// MUTAHUS_FIX_PARENT_PROFILE_LOGIN_FORGOT


function loadAdminSettingsPage() {
    const admin = requireAdminLogin();

    if (!admin) return;

    const nameBox = document.getElementById("adminNameDisplay");
    const usernameBox = document.getElementById("adminUsernameDisplay");
    const roleBox = document.getElementById("adminRoleDisplay");
    const statusBox = document.getElementById("adminStatusDisplay");

    if (nameBox) nameBox.innerText = admin.name || "Admin";
    if (usernameBox) usernameBox.innerText = admin.username || "admin";
    if (roleBox) roleBox.innerText = admin.role || "admin";
    if (statusBox) statusBox.innerText = admin.status || "Active";
}

async function changeAdminPasswordFromPage(event) {
    event.preventDefault();

    const admin = requireAdminLogin();

    if (!admin) return;

    const oldPassword = document.getElementById("adminCurrentPassword").value;
    const newPassword = document.getElementById("adminNewPassword").value;
    const confirmPassword = document.getElementById("adminConfirmPassword").value;

    if (newPassword.length < 6) {
        alert("New password must be at least 6 characters.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match.");
        return;
    }

    const submitButton = event.target.querySelector("button[type='submit']");
    const originalText = submitButton ? submitButton.innerText : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Changing...";
    }

    try {
        const response = await fetch("/api/admin-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "change-admin-password",
                username: admin.username || "admin",
                oldPassword,
                newPassword
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to change admin password.");
            return;
        }

        alert("Admin password changed successfully. Please login again.");
        localStorage.removeItem(VS.adminKey);
        window.location.href = "admin-login.html";
    } catch (error) {
        alert("Change admin password error: " + error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = originalText;
        }
    }
}

function protectAdminSettingsPage() {
    const page = window.location.pathname.split("/").pop() || "index.html";

    if (page === "admin-settings.html") {
        requireAdminLogin();
    }
}

document.addEventListener("DOMContentLoaded", protectAdminSettingsPage);

// MUTAHUS_STEP20_ADMIN_SETTINGS_PASSWORD_UI


function downloadJSON(filename, data) {
    const jsonText = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonText], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function todayBackupDate() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}-${hh}${min}`;
}

async function downloadSystemBackup() {
    const admin = requireAdminLogin();

    if (!admin) return;

    const confirmBackup = confirm("Download a JSON backup of parents, students, payments, announcements and rules?");

    if (!confirmBackup) return;

    try {
        const response = await fetch("/api/admin-dashboard?action=backup");
        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to download system backup.");
            return;
        }

        downloadJSON(`mutahus-backup-${todayBackupDate()}.json`, result.backup);

        alert("System backup downloaded successfully.");
    } catch (error) {
        alert("Backup download error: " + error.message);
    }
}

// MUTAHUS_STEP21_ADMIN_BACKUP_DOWNLOAD


function injectMutahusMobileFeatureStyles() {
    if (document.getElementById("mutahusMobileFeatureStyles")) return;

    const style = document.createElement("style");
    style.id = "mutahusMobileFeatureStyles";
    style.textContent = `
        .mutahus-mobile-feature-btn,
        .mutahus-mobile-feature-panel,
        .mutahus-mobile-feature-backdrop {
            display: none;
        }

        @media (max-width: 860px) {
            .mutahus-mobile-feature-btn {
                display: inline-flex;
                position: fixed;
                left: 14px;
                bottom: 88px;
                z-index: 9998;
                align-items: center;
                justify-content: center;
                gap: 8px;
                min-height: 48px;
                padding: 0 16px;
                border: none;
                border-radius: 999px;
                background: linear-gradient(180deg, #2873d1, #1657a9);
                color: #ffffff;
                font-weight: 800;
                box-shadow: 0 14px 30px rgba(16, 66, 135, 0.28);
                cursor: pointer;
            }

            .mutahus-mobile-feature-backdrop {
                display: none;
                position: fixed;
                inset: 0;
                z-index: 9996;
                background: rgba(6, 25, 52, 0.38);
                backdrop-filter: blur(3px);
            }

            .mutahus-mobile-feature-backdrop.show {
                display: block;
            }

            .mutahus-mobile-feature-panel {
                display: block;
                position: fixed;
                left: 12px;
                right: 12px;
                bottom: 12px;
                z-index: 9997;
                max-height: 78vh;
                overflow-y: auto;
                padding: 18px;
                border-radius: 26px;
                background: #ffffff;
                border: 1px solid #d9e5f5;
                box-shadow: 0 18px 45px rgba(13, 54, 105, 0.25);
                transform: translateY(115%);
                transition: transform 0.22s ease;
            }

            .mutahus-mobile-feature-panel.show {
                transform: translateY(0);
            }

            .mutahus-mobile-feature-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 14px;
            }

            .mutahus-mobile-feature-header strong {
                display: block;
                color: #123f73;
                font-size: 18px;
            }

            .mutahus-mobile-feature-header small {
                display: block;
                color: #6b7a90;
                margin-top: 3px;
                line-height: 1.4;
            }

            .mutahus-mobile-close-btn {
                border: none;
                background: #edf4ff;
                color: #123f73;
                width: 38px;
                height: 38px;
                border-radius: 14px;
                font-weight: 900;
                cursor: pointer;
            }

            .mutahus-mobile-feature-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
            }

            .mutahus-mobile-feature-grid a,
            .mutahus-mobile-feature-grid button {
                min-height: 50px;
                padding: 12px;
                border-radius: 16px;
                border: 1px solid #d9e5f5;
                background: #f8fbff;
                color: #163150;
                text-decoration: none;
                font-weight: 800;
                text-align: left;
                font-size: 14px;
                cursor: pointer;
            }

            .mutahus-mobile-feature-grid a.active {
                background: #e8f1ff;
                border-color: #9fc3f3;
                color: #1754a7;
            }

            .mutahus-mobile-feature-grid button.danger,
            .mutahus-mobile-feature-grid a.danger {
                background: #fff1f1;
                border-color: #ffd0d0;
                color: #c93434;
            }

            .mutahus-mobile-feature-grid button.primary {
                background: linear-gradient(180deg, #2873d1, #1657a9);
                color: #ffffff;
                border-color: #1657a9;
            }

            .mutahus-mobile-feature-note {
                margin-top: 12px;
                padding: 12px;
                border-radius: 16px;
                background: #fff8e6;
                color: #77510c;
                font-size: 13px;
                line-height: 1.45;
            }
        }
    `;

    document.head.appendChild(style);
}

function getMutahusMobileCurrentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
}

function isMutahusMobileAdminPage(page) {
    return page.startsWith("admin-") && page !== "admin-login.html";
}

function isMutahusMobileParentProtectedPage(page) {
    return [
        "parent-dashboard.html",
        "parent-profile.html",
        "add-student.html",
        "upload-payment.html"
    ].includes(page);
}

function isMutahusMobileParentAuthPage(page) {
    return [
        "parent-login.html",
        "parent-register.html",
        "parent-forgot-password.html"
    ].includes(page);
}

function mutahusMobileLink(href, icon, label, page) {
    const active = href === page ? " active" : "";
    return `<a class="${active}" href="${href}"><span>${icon}</span> ${label}</a>`;
}

function mutahusMobileButton(actionName, icon, label, extraClass = "") {
    return `<button type="button" class="${extraClass}" data-mobile-action="${actionName}"><span>${icon}</span> ${label}</button>`;
}

function buildMutahusMobileFeatureItems(page) {
    let items = "";
    let note = "";

    if (isMutahusMobileAdminPage(page)) {
        items += mutahusMobileLink("admin-dashboard.html", "📊", "Dashboard", page);
        items += mutahusMobileLink("admin-students.html", "🎒", "Students", page);
        items += mutahusMobileLink("admin-parents.html", "👨‍👩‍👧", "Parents", page);
        items += mutahusMobileLink("admin-payments.html", "💳", "Payments", page);
        items += mutahusMobileLink("admin-announcements.html", "📢", "Announcements", page);
        items += mutahusMobileLink("admin-rules.html", "📘", "Rules", page);
        items += mutahusMobileLink("admin-settings.html", "⚙️", "Settings", page);
        items += mutahusMobileLink("index.html", "🌐", "Main Website", page);

        if (page === "admin-students.html" && typeof exportStudentsCSV === "function") {
            items += mutahusMobileButton("exportStudentsCSV", "⬇️", "Export Students CSV", "primary");
        }

        if (page === "admin-parents.html" && typeof exportParentsCSV === "function") {
            items += mutahusMobileButton("exportParentsCSV", "⬇️", "Export Parents CSV", "primary");
        }

        if (page === "admin-payments.html" && typeof exportPaymentsCSV === "function") {
            items += mutahusMobileButton("exportPaymentsCSV", "⬇️", "Export Payments CSV", "primary");
        }

        if (page === "admin-settings.html" && typeof downloadSystemBackup === "function") {
            items += mutahusMobileButton("downloadSystemBackup", "🗄️", "Download Backup", "primary");
        }

        items += mutahusMobileButton("adminLogout", "🚪", "Logout", "danger");
        note = "All important desktop admin actions are available here for mobile view.";
    } else if (isMutahusMobileParentProtectedPage(page)) {
        items += mutahusMobileLink("parent-dashboard.html", "🏠", "Dashboard", page);
        items += mutahusMobileLink("parent-profile.html", "👤", "My Profile", page);
        items += mutahusMobileLink("add-student.html", "🎒", "Register Child", page);
        items += mutahusMobileLink("upload-payment.html", "💳", "Upload Payment", page);
        items += mutahusMobileLink("terms-rules.html", "📘", "Rules", page);
        items += mutahusMobileLink("index.html", "🌐", "Main Website", page);
        items += mutahusMobileButton("parentLogout", "🚪", "Logout", "danger");
        note = "All important desktop parent actions are available here for mobile view.";
    } else if (isMutahusMobileParentAuthPage(page)) {
        items += mutahusMobileLink("index.html", "🏠", "Home", page);
        items += mutahusMobileLink("parent-login.html", "🔐", "Parent Login", page);
        items += mutahusMobileLink("parent-register.html", "📝", "Create Account", page);
        items += mutahusMobileLink("parent-forgot-password.html", "🔑", "Forgot Password", page);
        items += mutahusMobileLink("terms-rules.html", "📘", "Rules", page);
        items += mutahusMobileLink("admin-login.html", "🛡️", "Admin Login", page);
        note = "Parent account actions are grouped here for mobile view.";
    } else {
        return null;
    }

    return { items, note };
}

function runMutahusMobileAction(actionName) {
    const actionMap = {
        adminLogout,
        parentLogout
    };

    if (typeof exportStudentsCSV === "function") actionMap.exportStudentsCSV = exportStudentsCSV;
    if (typeof exportParentsCSV === "function") actionMap.exportParentsCSV = exportParentsCSV;
    if (typeof exportPaymentsCSV === "function") actionMap.exportPaymentsCSV = exportPaymentsCSV;
    if (typeof downloadSystemBackup === "function") actionMap.downloadSystemBackup = downloadSystemBackup;

    if (actionMap[actionName]) {
        closeMutahusMobileFeatureMenu();
        actionMap[actionName]();
    }
}

function openMutahusMobileFeatureMenu() {
    const panel = document.getElementById("mutahusMobileFeaturePanel");
    const backdrop = document.getElementById("mutahusMobileFeatureBackdrop");

    if (panel) panel.classList.add("show");
    if (backdrop) backdrop.classList.add("show");
}

function closeMutahusMobileFeatureMenu() {
    const panel = document.getElementById("mutahusMobileFeaturePanel");
    const backdrop = document.getElementById("mutahusMobileFeatureBackdrop");

    if (panel) panel.classList.remove("show");
    if (backdrop) backdrop.classList.remove("show");
}

function createMutahusMobileFeatureMenu() {
    if (document.getElementById("mutahusMobileFeatureBtn")) return;

    const page = getMutahusMobileCurrentPage();
    const content = buildMutahusMobileFeatureItems(page);

    if (!content) return;

    injectMutahusMobileFeatureStyles();

    const backdrop = document.createElement("div");
    backdrop.id = "mutahusMobileFeatureBackdrop";
    backdrop.className = "mutahus-mobile-feature-backdrop";
    backdrop.addEventListener("click", closeMutahusMobileFeatureMenu);

    const button = document.createElement("button");
    button.id = "mutahusMobileFeatureBtn";
    button.type = "button";
    button.className = "mutahus-mobile-feature-btn";
    button.innerHTML = "☰ More";
    button.addEventListener("click", openMutahusMobileFeatureMenu);

    const panel = document.createElement("div");
    panel.id = "mutahusMobileFeaturePanel";
    panel.className = "mutahus-mobile-feature-panel";
    panel.innerHTML = `
        <div class="mutahus-mobile-feature-header">
            <div>
                <strong>Mobile Actions</strong>
                <small>Use this menu to access desktop features on phone.</small>
            </div>
            <button type="button" class="mutahus-mobile-close-btn" aria-label="Close menu">×</button>
        </div>

        <div class="mutahus-mobile-feature-grid">
            ${content.items}
        </div>

        <div class="mutahus-mobile-feature-note">
            ${content.note}
        </div>
    `;

    panel.querySelector(".mutahus-mobile-close-btn").addEventListener("click", closeMutahusMobileFeatureMenu);

    panel.querySelectorAll("[data-mobile-action]").forEach(button => {
        button.addEventListener("click", function () {
            runMutahusMobileAction(this.dataset.mobileAction);
        });
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(button);
    document.body.appendChild(panel);
}

function startMutahusMobileFeatureMenu() {
    createMutahusMobileFeatureMenu();
    setTimeout(createMutahusMobileFeatureMenu, 300);
    setTimeout(createMutahusMobileFeatureMenu, 1000);
}

document.addEventListener("DOMContentLoaded", startMutahusMobileFeatureMenu);
window.addEventListener("load", startMutahusMobileFeatureMenu);

// MUTAHUS_STEP22_MOBILE_ALL_DESKTOP_FEATURES


function injectMutahusFilterStyles() {
    if (document.getElementById("mutahusFilterStyles")) return;

    const style = document.createElement("style");
    style.id = "mutahusFilterStyles";
    style.textContent = `
        .mutahus-filter-panel {
            background: #ffffff;
            border: 1px solid #d9e5f5;
            border-radius: 22px;
            padding: 16px;
            margin: 18px 0;
            box-shadow: 0 8px 24px rgba(30,70,120,.05);
        }

        .mutahus-filter-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .mutahus-filter-header strong {
            color: #123f73;
            font-size: 17px;
        }

        .mutahus-filter-header small {
            color: #6b7a90;
        }

        .mutahus-filter-grid {
            display: grid;
            grid-template-columns: 1.4fr .8fr .8fr auto;
            gap: 10px;
            align-items: end;
        }

        .mutahus-filter-grid label {
            display: block;
            color: #123f73;
            font-weight: 800;
            font-size: 13px;
            margin-bottom: 6px;
        }

        .mutahus-filter-grid input,
        .mutahus-filter-grid select {
            width: 100%;
            min-height: 44px;
            border: 1px solid #d9e5f5;
            border-radius: 14px;
            padding: 0 12px;
            background: #fbfdff;
            color: #163150;
            outline: none;
        }

        .mutahus-filter-grid button {
            min-height: 44px;
            border: none;
            border-radius: 14px;
            padding: 0 14px;
            background: #edf4ff;
            color: #123f73;
            font-weight: 800;
            cursor: pointer;
        }

        .mutahus-filter-empty-row td {
            text-align: center;
            color: #6b7a90;
            font-weight: 700;
            padding: 20px !important;
        }

        @media (max-width: 760px) {
            .mutahus-filter-panel {
                border-radius: 18px;
                padding: 14px;
            }

            .mutahus-filter-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .mutahus-filter-grid {
                grid-template-columns: 1fr;
            }

            .mutahus-filter-grid button {
                width: 100%;
            }
        }
    `;

    document.head.appendChild(style);
}

function getCurrentAdminFilterPage() {
    return window.location.pathname.split("/").pop() || "index.html";
}

function createAdminFilterPanel(config) {
    injectMutahusFilterStyles();

    if (document.getElementById(config.panelId)) return;

    const panel = document.createElement("section");
    panel.id = config.panelId;
    panel.className = "mutahus-filter-panel";
    panel.innerHTML = `
        <div class="mutahus-filter-header">
            <div>
                <strong>${config.title}</strong><br>
                <small>${config.subtitle}</small>
            </div>
        </div>

        <div class="mutahus-filter-grid">
            <div>
                <label>Search</label>
                <input type="text" id="${config.searchId}" placeholder="${config.searchPlaceholder}">
            </div>

            <div>
                <label>${config.filterOneLabel}</label>
                <select id="${config.filterOneId}">
                    ${config.filterOneOptions}
                </select>
            </div>

            <div>
                <label>${config.filterTwoLabel}</label>
                <select id="${config.filterTwoId}">
                    ${config.filterTwoOptions}
                </select>
            </div>

            <button type="button" id="${config.resetId}">Reset</button>
        </div>
    `;

    const target =
        document.querySelector(".table-box-pro") ||
        document.querySelector(".table-card") ||
        document.querySelector(".panel-card.table-card") ||
        document.querySelector(".panel-card") ||
        document.querySelector(".app-main") ||
        document.querySelector(".admin-main") ||
        document.body;

    if (target && target.parentNode && target !== document.body) {
        target.insertAdjacentElement("beforebegin", panel);
    } else if (target && target !== document.body) {
        target.insertBefore(panel, target.firstChild);
    } else {
        document.body.insertBefore(panel, document.body.firstChild);
    }

    document.getElementById(config.searchId).addEventListener("input", config.applyFunction);
    document.getElementById(config.filterOneId).addEventListener("change", config.applyFunction);
    document.getElementById(config.filterTwoId).addEventListener("change", config.applyFunction);

    document.getElementById(config.resetId).addEventListener("click", function () {
        document.getElementById(config.searchId).value = "";
        document.getElementById(config.filterOneId).value = "";
        document.getElementById(config.filterTwoId).value = "";
        config.applyFunction();
    });
}

function removeFilterEmptyRow(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    table.querySelectorAll(".mutahus-filter-empty-row").forEach(row => row.remove());
}

function showFilterEmptyRow(tableId, colspan, message) {
    const table = document.getElementById(tableId);
    if (!table) return;

    removeFilterEmptyRow(tableId);

    const row = document.createElement("tr");
    row.className = "mutahus-filter-empty-row";
    row.innerHTML = `<td colspan="${colspan}">${message}</td>`;
    table.appendChild(row);
}

function filterRowsByText(tableId, options) {
    const table = document.getElementById(tableId);
    if (!table) return;

    removeFilterEmptyRow(tableId);

    const rows = Array.from(table.querySelectorAll("tr")).filter(row => !row.classList.contains("mutahus-filter-empty-row"));

    const search = (document.getElementById(options.searchId)?.value || "").trim().toLowerCase();
    const one = (document.getElementById(options.filterOneId)?.value || "").trim().toLowerCase();
    const two = (document.getElementById(options.filterTwoId)?.value || "").trim().toLowerCase();

    let visibleCount = 0;

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();

        const matchSearch = !search || text.includes(search);
        const matchOne = !one || text.includes(one);
        const matchTwo = !two || text.includes(two);

        const show = matchSearch && matchOne && matchTwo;

        row.style.display = show ? "" : "none";

        if (show) visibleCount++;
    });

    if (rows.length > 0 && visibleCount === 0) {
        showFilterEmptyRow(tableId, options.colspan, "No matching records found.");
    }
}

function setupStudentFilters() {
    createAdminFilterPanel({
        panelId: "studentFilterPanel",
        title: "Search & Filter Students",
        subtitle: "Find student records faster by name, parent, school, status or session.",
        searchId: "studentSearchInput",
        searchPlaceholder: "Search student / parent / school...",
        filterOneId: "studentStatusFilter",
        filterOneLabel: "Student Status",
        filterOneOptions: `
            <option value="">All Status</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Accepted">Accepted</option>
            <option value="Active">Active</option>
            <option value="Rejected">Rejected</option>
        `,
        filterTwoId: "studentSessionFilter",
        filterTwoLabel: "Session",
        filterTwoOptions: `
            <option value="">All Session</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
        `,
        resetId: "studentFilterReset",
        applyFunction: applyStudentFilters
    });

    applyStudentFilters();
}

function applyStudentFilters() {
    filterRowsByText("adminStudentsTable", {
        searchId: "studentSearchInput",
        filterOneId: "studentStatusFilter",
        filterTwoId: "studentSessionFilter",
        colspan: 8
    });
}

function setupParentFilters() {
    createAdminFilterPanel({
        panelId: "parentFilterPanel",
        title: "Search & Filter Parents",
        subtitle: "Find parent records faster by name, phone, email, payment or account status.",
        searchId: "parentSearchInput",
        searchPlaceholder: "Search parent / phone / email...",
        filterOneId: "parentStatusFilter",
        filterOneLabel: "Parent Status",
        filterOneOptions: `
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
        `,
        filterTwoId: "parentPaymentFilter",
        filterTwoLabel: "Payment Status",
        filterTwoOptions: `
            <option value="">All Payment</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Rejected">Rejected</option>
        `,
        resetId: "parentFilterReset",
        applyFunction: applyParentFilters
    });

    applyParentFilters();
}

function applyParentFilters() {
    filterRowsByText("adminParentsTable", {
        searchId: "parentSearchInput",
        filterOneId: "parentStatusFilter",
        filterTwoId: "parentPaymentFilter",
        colspan: 7
    });
}

function setupPaymentFilters() {
    createAdminFilterPanel({
        panelId: "paymentFilterPanel",
        title: "Search & Filter Payments",
        subtitle: "Find payment records by parent, student, month, amount, receipt or status.",
        searchId: "paymentSearchInput",
        searchPlaceholder: "Search payment / parent / student / month...",
        filterOneId: "paymentStatusFilter",
        filterOneLabel: "Payment Status",
        filterOneOptions: `
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="Unpaid">Unpaid</option>
        `,
        filterTwoId: "paymentMonthFilter",
        filterTwoLabel: "Month",
        filterTwoOptions: `
            <option value="">All Month</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
        `,
        resetId: "paymentFilterReset",
        applyFunction: applyPaymentFilters
    });

    applyPaymentFilters();
}

function applyPaymentFilters() {
    filterRowsByText("adminPaymentsTable", {
        searchId: "paymentSearchInput",
        filterOneId: "paymentStatusFilter",
        filterTwoId: "paymentMonthFilter",
        colspan: 7
    });
}

function startAdminSearchFilters() {
    const page = getCurrentAdminFilterPage();

    if (page === "admin-students.html") {
        setTimeout(setupStudentFilters, 500);
        setTimeout(applyStudentFilters, 1200);
    }

    if (page === "admin-parents.html") {
        setTimeout(setupParentFilters, 500);
        setTimeout(applyParentFilters, 1200);
    }

    if (page === "admin-payments.html") {
        setTimeout(setupPaymentFilters, 500);
        setTimeout(applyPaymentFilters, 1200);
    }
}

// Re-apply filter after existing table loaders finish.
if (typeof loadAdminStudents === "function") {
    const mutahusOriginalLoadAdminStudents = loadAdminStudents;
    loadAdminStudents = async function () {
        const result = await mutahusOriginalLoadAdminStudents();
        setTimeout(setupStudentFilters, 200);
        setTimeout(applyStudentFilters, 400);
        return result;
    };
}

if (typeof loadAdminParents === "function") {
    const mutahusOriginalLoadAdminParents = loadAdminParents;
    loadAdminParents = async function () {
        const result = await mutahusOriginalLoadAdminParents();
        setTimeout(setupParentFilters, 200);
        setTimeout(applyParentFilters, 400);
        return result;
    };
}

if (typeof loadAdminPayments === "function") {
    const mutahusOriginalLoadAdminPayments = loadAdminPayments;
    loadAdminPayments = async function () {
        const result = await mutahusOriginalLoadAdminPayments();
        setTimeout(setupPaymentFilters, 200);
        setTimeout(applyPaymentFilters, 400);
        return result;
    };
}

document.addEventListener("DOMContentLoaded", startAdminSearchFilters);
window.addEventListener("load", startAdminSearchFilters);

// MUTAHUS_STEP23_ADMIN_SEARCH_FILTERS

