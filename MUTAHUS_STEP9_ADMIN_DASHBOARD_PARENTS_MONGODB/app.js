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

function adminLogin(event) {
    event.preventDefault();

    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value;

    if (username === "admin" && password === "admin123") {
        localStorage.setItem(VS.adminKey, "true");
        alert("Admin login successful!");
        window.location.href = "admin-dashboard.html";
    } else {
        alert("Invalid admin username or password.");
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

function showReceiptInfo(receiptName, note) {
    alert("Receipt file: " + (receiptName || "No receipt file") + "\nPayment note: " + (note || "No note"));
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

function loadParentPaymentHistory(payments) {
    const historyTable = document.getElementById("paymentHistoryTable");
    const historyCount = document.getElementById("paymentHistoryCount");

    if (!historyTable) return;

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
        const badgeClass = payment.status === "Paid" ? "paid" : payment.status === "Pending" ? "pending" : payment.status === "Rejected" ? "rejected" : "unpaid";

        historyTable.innerHTML += `
            <tr>
                <td>${payment.month}</td>
                <td>${payment.studentName}</td>
                <td><strong>RM${payment.amount}</strong></td>
                <td><span class="badge ${badgeClass}">${payment.status}</span></td>
                <td>
                    <button class="receipt-button" onclick="showReceiptInfo('${payment.receiptName}', '${payment.note || ""}')">View</button>
                </td>
            </tr>
        `;
    });
}

function deleteChild(childId) {
    alert("Delete child from MongoDB will be connected in a later admin step. For now, please manage this record from MongoDB if needed.");
}










function loadAdminStudents() {
    const children = getChildren();
    const table = document.getElementById("adminStudentsTable");
    table.innerHTML = "";

    document.getElementById("adminTotalStudents").innerText = children.length;
    document.getElementById("adminMorningStudents").innerText = children.filter(child => child.session === "Morning").length;
    document.getElementById("adminAfternoonStudents").innerText = children.filter(child => child.session === "Afternoon").length;
    document.getElementById("adminTotalSchools").innerText = new Set(children.map(child => child.school)).size;

    if (children.length === 0) {
        table.innerHTML = `<tr><td colspan="8" class="empty-row">No students added yet.</td></tr>`;
        return;
    }

    children.forEach(child => {
        const sessionClass = child.session === "Morning" ? "morning" : "afternoon";
        const status = child.status || "Pending Review";
        const statusClass = getStudentStatusBadgeClass(status);

        table.innerHTML += `
            <tr>
                <td><strong>${child.name}</strong><br><small>Student ID: ${child.id}</small></td>
                <td>${child.parentName}<br><small>${child.parentPhone}</small></td>
                <td>${child.school}</td>
                <td>${child.classYear}</td>
                <td><span class="badge ${sessionClass}">${child.session}</span></td>
                <td>${child.pickupLocation}</td>
                <td><span class="badge ${statusClass}">${status}</span></td>
                <td>
                    <div class="student-action-row">
                        <button class="small-btn edit" onclick="updateStudentStatus('${child.id}', 'Accepted')">Accept</button>
                        <button class="small-btn warning" onclick="updateStudentStatus('${child.id}', 'Rejected')">Reject</button>
                        <button class="small-btn" onclick="updateStudentStatus('${child.id}', 'Active')">Mark Active</button>
                        <button class="small-btn danger" onclick="removeStudent('${child.id}')">Remove</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function updateStudentStatus(childId, status) {
    const children = getChildren();
    const childIndex = children.findIndex(child => child.id === childId);

    if (childIndex === -1) {
        alert("Student record not found.");
        return;
    }

    children[childIndex].status = status;
    children[childIndex].reviewedAt = new Date().toLocaleDateString("en-GB");

    saveChildren(children);

    alert("Student status updated to " + status + ".");
    loadAdminStudents();
}

function removeStudent(childId) {
    const confirmRemove = confirm("Are you sure you want to remove this student? Related payment records will also be removed.");
    if (!confirmRemove) return;

    const children = getChildren().filter(child => child.id !== childId);
    const payments = getPayments().filter(payment => payment.studentId !== childId);

    saveChildren(children);
    savePayments(payments);

    alert("Student removed successfully.");
    loadAdminStudents();
}




function getPaymentBadgeClass(status) {
    if (status === "Paid") return "paid";
    if (status === "Pending") return "pending";
    if (status === "Rejected") return "rejected";
    return "unpaid";
}










function loadAdminAnnouncements() {
    const announcements = getAnnouncements();
    const table = document.getElementById("announcementTable");
    const preview = document.getElementById("announcementPreviewList");

    document.getElementById("announcementTotal").innerText = announcements.length;
    document.getElementById("announcementMonth").innerText = announcements.length;
    document.getElementById("announcementImportant").innerText = announcements.filter(item => item.priority === "Important" || item.priority === "Urgent" || item.type === "Emergency Notice").length;
    document.getElementById("announcementGeneral").innerText = announcements.filter(item => item.priority === "Normal").length;

    table.innerHTML = "";
    preview.innerHTML = "";

    announcements.slice().reverse().forEach(item => {
        const priorityClass = item.priority === "Urgent" ? "rejected" : item.priority === "Important" ? "pending" : "morning";
        const categoryClass = getAnnouncementCategoryBadgeClass(item.type);

        table.innerHTML += `
            <tr>
                <td><strong>${item.title}</strong><br><small>${item.message}</small></td>
                <td><span class="badge ${categoryClass}">${item.type}</span></td>
                <td><span class="badge ${priorityClass}">${item.priority}</span></td>
                <td>${item.date}</td>
                <td><span class="badge paid">${item.status}</span></td>
                <td><button class="small-btn danger" onclick="deleteAnnouncement('${item.id}')">Delete</button></td>
            </tr>
        `;

        preview.innerHTML += `
            <div class="announcement announcement-card-pro ${item.priority === "Urgent" ? "urgent-box" : item.priority === "Important" ? "important-box" : "normal-box"}">
                <div class="announcement-top-row">
                    <span class="badge ${categoryClass}">${item.type}</span>
                    <small>${item.date}</small>
                </div>
                <strong>📢 ${item.title}</strong>
                <p>${item.message}</p>
            </div>
        `;
    });
}

function postAnnouncement(event) {
    event.preventDefault();

    const announcement = {
        id: makeId("ANN"),
        title: document.getElementById("announcementTitle").value.trim(),
        type: document.getElementById("announcementType").value,
        priority: document.getElementById("announcementPriority").value,
        message: document.getElementById("announcementMessage").value.trim(),
        date: new Date().toLocaleDateString("en-GB"),
        status: "Active"
    };

    const announcements = getAnnouncements();
    announcements.push(announcement);
    saveAnnouncements(announcements);

    alert("Announcement posted successfully!");
    document.getElementById("announcementForm").reset();
    loadAdminAnnouncements();
}

function deleteAnnouncement(id) {
    const confirmDelete = confirm("Delete this announcement?");
    if (!confirmDelete) return;

    const announcements = getAnnouncements().filter(item => item.id !== id);
    saveAnnouncements(announcements);
    loadAdminAnnouncements();
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

function getDefaultRules() {
    return [
        {
            id: makeId("RULE"),
            icon: "💳",
            title: "Monthly Payment",
            description: "Monthly payment should be made according to the agreed date. Parents are required to upload the payment receipt through the parent portal after making payment."
        },
        {
            id: makeId("RULE"),
            icon: "⏰",
            title: "Pickup Time",
            description: "Students must be ready at the pickup point before the van arrives. Late students may affect the route schedule for other students."
        },
        {
            id: makeId("RULE"),
            icon: "🏠",
            title: "Pickup Location",
            description: "Parents must provide a clear and accurate pickup location. Any change of address or pickup point should be informed earlier."
        },
        {
            id: makeId("RULE"),
            icon: "📢",
            title: "Absence Notice",
            description: "If a student will not attend school or does not need van service for that day, parents should inform Mutahus Global as early as possible."
        },
        {
            id: makeId("RULE"),
            icon: "🛡️",
            title: "Student Safety",
            description: "Students must follow safety instructions while inside the van. Parents should remind children to behave properly and avoid disturbing the driver."
        },
        {
            id: makeId("RULE"),
            icon: "📱",
            title: "Emergency Contact",
            description: "Parents should make sure their phone number is active and reachable. For urgent matters, parents may contact Mutahus Global through WhatsApp."
        },
        {
            id: makeId("RULE"),
            icon: "🌧️",
            title: "Delay Notice",
            description: "Delays may happen due to traffic, weather, school events or route changes. Parents can check announcements in the parent dashboard."
        },
        {
            id: makeId("RULE"),
            icon: "✅",
            title: "Student Approval",
            description: "New child registrations will be reviewed by admin first. The student status may show Pending Review, Accepted, Active or Rejected."
        }
    ];
}

function getRules() {
    let rules = JSON.parse(localStorage.getItem(RULES_KEY)) || [];

    if (rules.length === 0) {
        rules = getDefaultRules();
        localStorage.setItem(RULES_KEY, JSON.stringify(rules));
    }

    return rules;
}

function saveRules(rules) {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

function loadPublicRules() {
    const list = document.getElementById("publicRulesList");
    if (!list) return;

    const rules = getRules();
    list.innerHTML = "";

    rules.forEach((rule, index) => {
        list.innerHTML += `
            <div class="rule-card">
                <div class="rule-icon">${rule.icon}</div>
                <h2>${index + 1}. ${rule.title}</h2>
                <p>${rule.description}</p>
            </div>
        `;
    });
}

function loadAdminRules() {
    const table = document.getElementById("adminRulesTable");
    if (!table) return;

    const rules = getRules();
    table.innerHTML = "";

    if (rules.length === 0) {
        table.innerHTML = `<tr><td colspan="4" class="empty-row">No rules added yet.</td></tr>`;
        return;
    }

    rules.forEach(rule => {
        table.innerHTML += `
            <tr>
                <td><span class="admin-rule-icon">${rule.icon}</span></td>
                <td><strong>${rule.title}</strong></td>
                <td>${rule.description}</td>
                <td>
                    <div class="student-action-row">
                        <button class="small-btn edit" onclick="editRule('${rule.id}')">Edit</button>
                        <button class="small-btn danger" onclick="deleteRule('${rule.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function saveRuleFromAdmin(event) {
    event.preventDefault();

    const id = document.getElementById("ruleId").value;
    const icon = document.getElementById("ruleIcon").value;
    const title = document.getElementById("ruleTitle").value.trim();
    const description = document.getElementById("ruleDescription").value.trim();

    let rules = getRules();

    if (id) {
        rules = rules.map(rule => {
            if (rule.id === id) {
                return { id, icon, title, description };
            }
            return rule;
        });

        alert("Rule updated successfully.");
    } else {
        rules.push({
            id: makeId("RULE"),
            icon,
            title,
            description
        });

        alert("New rule added successfully.");
    }

    saveRules(rules);
    cancelRuleEdit();
    loadAdminRules();
}

function editRule(id) {
    const rules = getRules();
    const rule = rules.find(item => item.id === id);

    if (!rule) {
        alert("Rule not found.");
        return;
    }

    document.getElementById("ruleId").value = rule.id;
    document.getElementById("ruleIcon").value = rule.icon;
    document.getElementById("ruleTitle").value = rule.title;
    document.getElementById("ruleDescription").value = rule.description;
    document.getElementById("ruleFormTitle").innerText = "Edit Rule";

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

function deleteRule(id) {
    const confirmDelete = confirm("Are you sure you want to delete this rule?");
    if (!confirmDelete) return;

    const rules = getRules().filter(rule => rule.id !== id);
    saveRules(rules);
    loadAdminRules();
}

function resetDefaultRules() {
    const confirmReset = confirm("Reset all rules to default? This will remove your edited rules.");
    if (!confirmReset) return;

    saveRules(getDefaultRules());
    cancelRuleEdit();
    loadAdminRules();
    alert("Rules reset to default.");
}






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

    const paymentData = {
        parentId: parent.id,
        parentEmail: parent.email || "",
        studentId,
        month: document.getElementById("paymentMonth").value,
        amount: Number(document.getElementById("paymentAmount").value),
        datePaid: document.getElementById("paymentDate").value,
        receiptName: receiptFile ? receiptFile.name : "No file",
        note: document.getElementById("paymentNote") ? document.getElementById("paymentNote").value.trim() : ""
    };

    try {
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

        alert("Payment proof saved successfully in MongoDB. Waiting for admin approval.");
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
                        <button class="receipt-button" data-receipt="${payment.receiptName || "No receipt file"}" data-note="${payment.note || ""}">
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
            const parentStatusClass = parent.status === "Pending" ? "pending" : parent.status === "Rejected" ? "rejected" : "paid";

            table.innerHTML += `
                <tr>
                    <td><strong>${parent.name || "-"}</strong><br><small>Parent ID: ${parent.id}</small></td>
                    <td>${parent.phone || "-"}</td>
                    <td>${parent.email || "-"}</td>
                    <td>${parent.childrenCount || 0}</td>
                    <td><span class="badge ${payClass}">${payStatus}</span></td>
                    <td><span class="badge ${parentStatusClass}">${parent.status || "Active"}</span></td>
                    <td>
                        <button class="small-btn edit" onclick="viewParentDetails('${parent.id}')">View</button>
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
                    <td><strong>RM${payment.amount}</strong></td>
                    <td><span class="badge ${badgeClass}">${payment.status}</span></td>
                    <td>
                        <button class="receipt-button" onclick="showReceiptInfo('${payment.receiptName}', '${payment.note || ""}')">View</button>
                    </td>
                </tr>
            `;
        });
    }

    modalBody.innerHTML = `
        <div class="parent-detail-header">
            <div class="parent-avatar">${(parent.name || "P").charAt(0).toUpperCase()}</div>
            <div>
                <h3>${parent.name}</h3>
                <p>${parent.phone || "-"} • ${parent.email || "-"}</p>
                <p><span class="badge paid">${parent.status || "Active"}</span></p>
            </div>
        </div>

        <div class="detail-grid">
            <div class="detail-card">
                <strong>${parentChildren.length}</strong>
                <span>Registered Children</span>
            </div>
            <div class="detail-card">
                <strong>${parentPayments.length}</strong>
                <span>Payment Records</span>
            </div>
            <div class="detail-card">
                <strong>RM${paidTotal}</strong>
                <span>Total Paid</span>
            </div>
            <div class="detail-card">
                <strong>${pendingCount}</strong>
                <span>Pending Payments</span>
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
