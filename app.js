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
        kafa: document.getElementById("kafaName") ? document.getElementById("kafaName").value : "",
        kafaSession: document.getElementById("kafaSession") ? document.getElementById("kafaSession").value : "",
        classYear: document.getElementById("classYear").value.trim(),
        session: document.getElementById("session").value,
        homeAddress: document.getElementById("homeAddress").value.trim(),
        pickupLocation: "Not applicable",
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
                        <td>${child.school || "-"}${child.kafa ? `<br><small>KAFA: ${child.kafa}${child.kafaSession ? ` (${child.kafaSession})` : ""}</small>` : ""}<br><small>Amount: RM${Number(child.monthlyAmount || 0).toFixed(2)}</small></td>
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
    alert("Please contact admin to delete this child record.");
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

    const notice = document.getElementById("paymentNotice");
    const amountInput = document.getElementById("paymentAmount");
    const amountInfo = document.getElementById("paymentAmountInfo");
    const allSummary = document.getElementById("allChildrenSummary");

    try {
        const response = await fetch(`/api/parent-dashboard?parentId=${encodeURIComponent(parent.id)}&email=${encodeURIComponent(parent.email || "")}`);
        const result = await response.json();

        console.log("PAYMENT PAGE DASHBOARD RESULT:", result);

        if (!result.success) {
            if (notice) {
                notice.innerHTML = `<strong>Error:</strong> ${result.message || "Failed to load students."}`;
            }
            if (allSummary) allSummary.innerText = "No child found.";
            return;
        }

        const children = result.children || [];
        window.parentPaymentChildren = children;
        window.parentPaymentStudentMap = {};

        children.forEach(child => {
            window.parentPaymentStudentMap[child.id] = child;
        });

        updatePaymentAmountFromSelectedStudent();

        if (children.length === 0 && notice) {
            notice.innerHTML = `
                <strong>No child found.</strong>
                Please register a child first before uploading payment proof.
            `;
        } else if (notice) {
            notice.innerHTML = `
                <strong>${children.length} child detected.</strong>
                Payment is automatically calculated for all registered children.
            `;
        }
    } catch (error) {
        if (notice) {
            notice.innerHTML = `<strong>Error:</strong> ${error.message}`;
        }
        if (allSummary) allSummary.innerText = "Failed to load children.";
    }
}

function getParentPaymentMode() {
    return "all";
}

function updateAllChildrenSummary() {
    const allSummary = document.getElementById("allChildrenSummary");
    const children = window.parentPaymentChildren || [];

    if (!allSummary) return;

    if (children.length === 0) {
        allSummary.innerText = "No child found.";
        return;
    }

    const total = children.reduce((sum, child) => sum + Number(child.monthlyAmount || 0), 0);
    const notSet = children.filter(child => !Number(child.monthlyAmount || 0));

    const childList = children
        .map(child => {
            const schoolText = child.kafa ? `${child.school || "-"} + ${child.kafa}` : (child.school || "-");
            return `${child.name} (${schoolText}) = RM${Number(child.monthlyAmount || 0).toFixed(2)}`;
        })
        .join("<br>");

    allSummary.innerHTML = `
        ${childList}<br>
        <strong style="display:block;margin-top:8px;color:#123f73;">Total Payment: RM${total.toFixed(2)}</strong>
        ${notSet.length ? `<span style="display:block;margin-top:6px;color:#c0392b;font-weight:800;">${notSet.length} child amount not set by admin.</span>` : ""}
    `;
}

function updatePaymentAmountFromSelectedStudent() {
    const amountInput = document.getElementById("paymentAmount");
    const amountInfo = document.getElementById("paymentAmountInfo");
    const children = window.parentPaymentChildren || [];

    if (!amountInput) return;

    amountInput.readOnly = true;

    const total = children.reduce((sum, child) => sum + Number(child.monthlyAmount || 0), 0);
    const notSet = children.filter(child => !Number(child.monthlyAmount || 0));

    amountInput.value = total > 0 ? total.toFixed(2) : "";

    if (amountInfo) {
        if (children.length === 0) {
            amountInfo.innerText = "No child detected.";
            amountInfo.style.color = "#c0392b";
        } else if (notSet.length > 0) {
            amountInfo.innerText = "Some child payment amount has not been set by admin.";
            amountInfo.style.color = "#c0392b";
        } else {
            amountInfo.innerText = "Total amount auto-detected for all children.";
            amountInfo.style.color = "#1e9b67";
        }
    }

    updateAllChildrenSummary();
}

function updatePaymentModeUI() {
    updatePaymentAmountFromSelectedStudent();
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







async function loadAdminAnnouncements(){
    const history=document.getElementById("announcementHistoryList");
    const preview=document.getElementById("announcementPreviewList");
    if(history)history.innerHTML='<div class="s64-empty-card"><span>📢</span><strong>Loading previous announcements...</strong></div>';
    try{
        const response=await fetch("/api/admin-dashboard?action=announcements"); const result=await response.json();
        if(!result.success)throw new Error(result.message||"Failed to load announcements.");
        const items=result.announcements||[]; const summary=result.summary||{}; window.adminAnnouncementsData=items;
        const vals={announcementTotal:summary.totalAnnouncements||0,announcementMonth:summary.thisMonth||0,announcementImportant:summary.importantNotices||0,announcementGeneral:summary.generalUpdates||0,announcementHistoryCount:items.length};
        Object.entries(vals).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.innerText=v;});
        if(history)history.innerHTML=""; if(preview)preview.innerHTML="";
        if(!items.length){
            if(history)history.innerHTML='<div class="s64-empty-card"><span>📭</span><strong>No previous announcement yet</strong><p>Create your first notice using the form above.</p></div>';
            if(preview)preview.innerHTML='<div class="s64-empty-card"><span>👀</span><strong>No active announcement</strong><p>Active notices will appear here.</p></div>';
            return;
        }
        items.forEach(item=>{
            const pc=item.priority==="Urgent"?"rejected":item.priority==="Important"?"pending":"morning";
            const cc=getAnnouncementCategoryBadgeClass(item.type); const sc=item.status==="Active"?"paid":"unpaid"; const next=item.status==="Active"?"Inactive":"Active";
            if(history)history.innerHTML+=`<article class="s64-ann-card ${String(item.priority||"Normal").toLowerCase()}"><div class="s64-ann-head"><div class="s64-ann-title"><span>📢</span><div><h3>${mutahusSafeHtml(item.title||"Untitled announcement")}</h3><small>${mutahusSafeHtml(item.date||"")}</small></div></div><span class="badge ${sc}">${mutahusSafeHtml(item.status||"Inactive")}</span></div><p>${mutahusSafeHtml(item.message||"")}</p><div class="s64-ann-meta"><span class="badge ${cc}">${mutahusSafeHtml(item.type||"General Announcement")}</span><span class="badge ${pc}">${mutahusSafeHtml(item.priority||"Normal")}</span></div><div class="s64-ann-actions"><button class="small-btn edit" type="button" onclick="updateAnnouncementStatus('${item.id}','${next}')">Mark ${next}</button><button class="small-btn danger" type="button" onclick="deleteAnnouncement('${item.id}')">Delete</button></div></article>`;
            if(preview&&item.status==="Active")preview.innerHTML+=`<div class="s64-parent-preview ${String(item.priority||"Normal").toLowerCase()}"><div class="s64-preview-top"><span class="badge ${cc}">${mutahusSafeHtml(item.type||"General Announcement")}</span><small>${mutahusSafeHtml(item.date||"")}</small></div><h3>${mutahusSafeHtml(item.title||"Announcement")}</h3><p>${mutahusSafeHtml(item.message||"")}</p></div>`;
        });
        if(preview&&!preview.innerHTML.trim())preview.innerHTML='<div class="s64-empty-card"><span>🔕</span><strong>No active announcement</strong><p>Inactive notices remain in history only.</p></div>';
    }catch(error){if(history)history.innerHTML=`<div class="s64-empty-card"><span>⚠️</span><strong>Unable to load announcements</strong><p>${mutahusSafeHtml(error.message)}</p></div>`;}
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

function mutahusEscapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function(match) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[match];
    });
}

function closeReceiptModal() {
    const modal = document.getElementById("receiptPreviewModal");
    if (modal) modal.remove();
}

function showReceiptInfo(receiptName, note, receiptDataUrl) {
    const name = receiptName || "No receipt file";
    const paymentNote = note || "No note";

    if (!receiptDataUrl || !receiptDataUrl.startsWith("data:")) {
        alert("Receipt file: " + name + "\nPayment note: " + paymentNote + "\n\nActual receipt image is not available for this older payment record.");
        return;
    }

    closeReceiptModal();

    const isPdf = receiptDataUrl.startsWith("data:application/pdf");
    const modal = document.createElement("div");
    modal.id = "receiptPreviewModal";
    modal.innerHTML = `
        <style>
            #receiptPreviewModal {
                position: fixed;
                inset: 0;
                z-index: 9999;
                background: rgba(7, 22, 42, 0.72);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 18px;
            }

            .receipt-modal-card {
                width: min(960px, 100%);
                max-height: 92vh;
                background: #ffffff;
                border-radius: 22px;
                overflow: hidden;
                box-shadow: 0 24px 60px rgba(0,0,0,.35);
                display: flex;
                flex-direction: column;
            }

            .receipt-modal-header {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: flex-start;
                padding: 18px 20px;
                background: linear-gradient(180deg,#143f73 0%,#0e335d 100%);
                color: #ffffff;
            }

            .receipt-modal-header h2 {
                margin: 0 0 6px;
                font-size: 20px;
            }

            .receipt-modal-header p {
                margin: 2px 0;
                opacity: .92;
                font-size: 13px;
                word-break: break-word;
            }

            .receipt-modal-close {
                border: 0;
                border-radius: 12px;
                min-width: 42px;
                height: 42px;
                cursor: pointer;
                background: rgba(255,255,255,.16);
                color: #ffffff;
                font-size: 22px;
                font-weight: 900;
            }

            .receipt-modal-body {
                padding: 18px;
                overflow: auto;
                background: #f4f8ff;
            }

            .receipt-modal-body img {
                display: block;
                max-width: 100%;
                height: auto;
                margin: auto;
                border-radius: 16px;
                background: #ffffff;
                box-shadow: 0 10px 28px rgba(25,60,100,.12);
            }

            .receipt-modal-body iframe {
                width: 100%;
                height: 74vh;
                border: 0;
                border-radius: 16px;
                background: #ffffff;
            }

            .receipt-pdf-fallback {
                display: block;
                text-align: center;
                padding: 12px 14px;
                margin-bottom: 12px;
                border-radius: 14px;
                background: #ffffff;
                color: #143f73;
                font-weight: 800;
                text-decoration: none;
                border: 1px solid #d8e7fb;
            }

            @media (max-width: 760px) {
                #receiptPreviewModal {
                    align-items: stretch;
                    padding: 10px;
                }

                .receipt-modal-card {
                    max-height: 96vh;
                    border-radius: 18px;
                }

                .receipt-modal-body {
                    padding: 12px;
                }

                .receipt-modal-body iframe {
                    height: 68vh;
                }
            }
        </style>

        <div class="receipt-modal-card">
            <div class="receipt-modal-header">
                <div>
                    <h2>MUTHAQUS GLOBAL ENTERPRISE</h2>
                    <p><strong>Payment Receipt</strong></p>
                    <p><strong>File:</strong> ${mutahusEscapeHtml(name)}</p>
                    <p><strong>Note:</strong> ${mutahusEscapeHtml(paymentNote)}</p>
                </div>
                <button class="receipt-modal-close" type="button" onclick="closeReceiptModal()">×</button>
            </div>
            <div class="receipt-modal-body">
                ${
                    isPdf
                        ? `<a class="receipt-pdf-fallback" href="${receiptDataUrl}" target="_blank">Open PDF Receipt</a><iframe src="${receiptDataUrl}"></iframe>`
                        : `<img src="${receiptDataUrl}" alt="Payment receipt">`
                }
            </div>
        </div>
    `;

    modal.addEventListener("click", function(event) {
        if (event.target === modal) closeReceiptModal();
    });

    document.body.appendChild(modal);
}

async function submitPayment(event) {
    event.preventDefault();

    const parent = requireParentLogin();
    if (!parent) return;

    const paymentMode = "all";
    const children = window.parentPaymentChildren || [];
    const selectedStudentIds = children.map(child => child.id);

    if (selectedStudentIds.length === 0) {
        alert("No child detected. Please register a child first.");
        return;
    }

    if (typeof updatePaymentAmountFromSelectedStudent === "function") {
        updatePaymentAmountFromSelectedStudent();
    }

    const notSet = children.filter(child => !Number(child.monthlyAmount || 0));

    if (notSet.length > 0) {
        alert("Some child payment amount has not been set by admin yet. Please contact admin.");
        return;
    }

    const adminAmount = Number(document.getElementById("paymentAmount").value || 0);

    if (!adminAmount || adminAmount <= 0) {
        alert("Payment amount has not been set by admin yet. Please contact admin.");
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
            paymentMode,
            studentId: "",
            studentIds: selectedStudentIds,
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
    window.parentPaymentInvoiceMap = {};

    historyTable.innerHTML = "";

    if (historyCount) {
        historyCount.innerText = payments.length;
    }

    if (payments.length === 0) {
        historyTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-row">
                    <div class="mutahus-empty-state">
                        <span>🧾</span>
                        <strong>No payment history yet.</strong>
                        <small>Approved payments will include a downloadable PDF invoice.</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    payments.slice().reverse().forEach(payment => {
        window.parentPaymentReceiptMap[payment.id] = payment;
        window.parentPaymentInvoiceMap[payment.id] = payment;

        const badgeClass =
            payment.status === "Paid"
                ? "paid"
                : payment.status === "Pending"
                ? "pending"
                : payment.status === "Rejected"
                ? "rejected"
                : "unpaid";

        const invoiceButton =
            payment.status === "Paid"
                ? `
                    <button
                        class="invoice-download-btn"
                        type="button"
                        onclick="downloadPaymentInvoice('${payment.id}', 'parent')"
                    >
                        <span>⬇️</span> PDF Invoice
                    </button>
                `
                : `
                    <button
                        class="invoice-download-btn is-disabled"
                        type="button"
                        disabled
                        title="Invoice is available after payment approval"
                    >
                        <span>🔒</span> After Approval
                    </button>
                `;

        historyTable.innerHTML += `
            <tr>
                <td><strong>${mutahusSafeHtml(payment.month || "-")}</strong></td>
                <td>${mutahusSafeHtml(payment.studentName || "All registered children")}</td>
                <td><strong>RM${Number(payment.amount || 0).toFixed(2)}</strong></td>
                <td><span class="badge ${badgeClass}">${mutahusSafeHtml(payment.status || "Pending")}</span></td>
                <td>
                    <button class="receipt-button" type="button" onclick="viewParentReceipt('${payment.id}')">
                        View Receipt
                    </button>
                </td>
                <td>${invoiceButton}</td>
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
    const table=document.getElementById("adminPaymentsTable");
    if(table)table.innerHTML='<tr class="s64-empty-row"><td colspan="7" class="empty-row">Loading payment records...</td></tr>';
    try{
        const response=await fetch("/api/admin-payments");
        const result=await response.json();
        if(!result.success)throw new Error(result.message||"Failed to load payments.");
        const payments=result.payments||[]; const summary=result.summary||{};
        window.adminPaymentsData=payments; window.adminPaymentReceiptMap={}; window.adminPaymentInvoiceMap={};
        payments.forEach(p=>{window.adminPaymentReceiptMap[p.id]=p;window.adminPaymentInvoiceMap[p.id]=p;});
        const values={paymentTotalCollection:"RM"+Number(summary.totalCollection||0).toFixed(2),paymentPaidCount:summary.paidCount||0,paymentPendingCount:summary.pendingCount||0,paymentUnpaidCount:summary.unpaidCount||0};
        Object.entries(values).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.innerText=v;});
        renderAdminPaymentRecords();
    }catch(error){if(table)table.innerHTML=`<tr class="s64-empty-row"><td colspan="7" class="empty-row">${mutahusSafeHtml(error.message)}</td></tr>`;}
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

async function loadAdminRules(){
    const list=document.getElementById("adminRulesList"); if(!list)return;
    list.innerHTML='<div class="s64-empty-card"><span>📘</span><strong>Loading current rules...</strong></div>';
    try{
        const rules=await fetchRulesFromMongoDB(); window.adminRulesData=rules;
        const count=document.getElementById("adminRulesCount"); if(count)count.innerText=rules.length; list.innerHTML="";
        if(!rules.length){list.innerHTML='<div class="s64-empty-card"><span>📭</span><strong>No current rules</strong><p>Add a rule using the editor.</p></div>';return;}
        rules.forEach((rule,index)=>{list.innerHTML+=`<article class="s64-rule-card"><div class="s64-rule-no">${index+1}</div><div class="s64-rule-icon">${mutahusSafeHtml(rule.icon||"✅")}</div><div class="s64-rule-text"><h3>${mutahusSafeHtml(rule.title||"Untitled rule")}</h3><p>${mutahusSafeHtml(rule.description||"")}</p></div><div class="s64-rule-actions"><button class="small-btn edit" type="button" onclick="editRule('${rule.id}')">Edit</button><button class="small-btn danger" type="button" onclick="deleteRule('${rule.id}')">Delete</button></div></article>`;});
    }catch(error){list.innerHTML=`<div class="s64-empty-card"><span>⚠️</span><strong>Unable to load rules</strong><p>${mutahusSafeHtml(error.message)}</p></div>`;}
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
        table.innerHTML = `
            <tr class="admin-mobile-empty-row">
                <td colspan="8" class="empty-row">Loading students from MongoDB...</td>
            </tr>
        `;
    }

    try {
        const response = await fetch("/api/admin-students");
        const result = await response.json();

        console.log("ADMIN STUDENTS RESULT:", result);

        if (!result.success) {
            alert(result.message || "Failed to load students.");

            if (table) {
                table.innerHTML = `
                    <tr class="admin-mobile-empty-row">
                        <td colspan="8" class="empty-row">Failed to load students.</td>
                    </tr>
                `;
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
            table.innerHTML = `
                <tr class="admin-mobile-empty-row">
                    <td colspan="8" class="empty-row">
                        <div class="mutahus-empty-state">
                            <span>🎒</span>
                            <strong>No students registered yet.</strong>
                            <small>Students added by parents will appear here.</small>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        children.forEach(child => {
            const sessionClass =
                child.session === "Morning"
                    ? "morning"
                    : child.session === "Afternoon"
                    ? "afternoon"
                    : "unpaid";

            const status = child.status || "Pending Review";
            const statusClass = getStudentStatusBadgeClass(status);
            const paymentStatus = child.paymentStatus || "Unpaid";
            const paymentClass = getPaymentBadgeClass(paymentStatus);
            const amount = Number(child.monthlyAmount || 0);

            table.innerHTML += `
                <tr class="admin-record-row student-record-row">
                    <td data-label="Student">
                        <div class="record-main-identity">
                            <span class="record-avatar">🎒</span>
                            <div>
                                <strong>${child.name || "-"}</strong>
                                <small>ID: ${child.id || "-"}</small>
                            </div>
                        </div>
                    </td>

                    <td data-label="Parent">
                        <strong>${child.parentName || "-"}</strong>
                        <small>${child.parentPhone || "-"}</small>
                        <small>${child.parentEmail || "-"}</small>
                    </td>

                    <td data-label="School / KAFA">
                        <strong>${child.school || "-"}</strong>
                        <small>
                            ${
                                child.kafa
                                    ? `KAFA: ${child.kafa}${child.kafaSession ? ` (${child.kafaSession})` : ""}`
                                    : "KAFA: Not applicable"
                            }
                        </small>
                    </td>

                    <td data-label="Class">
                        <strong>${child.classYear || "-"}</strong>
                    </td>

                    <td data-label="Session">
                        <span class="badge ${sessionClass}">${child.session || "Not applicable"}</span>
                    </td>

                    <td data-label="Status">
                        <div class="record-status-stack">
                            <span class="badge ${statusClass}">${status}</span>
                            <span class="badge ${paymentClass}">${paymentStatus}</span>
                        </div>
                    </td>

                    <td data-label="Monthly Amount">
                        <div class="student-amount-box mobile-student-amount">
                            <span>RM</span>
                            <input
                                type="number"
                                id="amount_${child.id}"
                                value="${amount > 0 ? amount.toFixed(2) : ""}"
                                min="0"
                                step="0.01"
                                inputmode="decimal"
                                placeholder="0.00"
                                aria-label="Monthly amount for ${child.name || "student"}"
                            >
                            <button type="button" onclick="updateStudentAmount('${child.id}')">
                                Save
                            </button>
                        </div>
                        <small class="record-support-text">
                            ${
                                amount > 0
                                    ? "This is the parent's monthly payment amount."
                                    : "Set an amount before the parent uploads payment."
                            }
                        </small>
                    </td>

                    <td data-label="Actions" class="record-action-cell">
                        <div class="action-row mobile-admin-action-grid student-mobile-actions">
                            <button
                                class="small-btn edit"
                                type="button"
                                onclick="updateStudentStatus('${child.id}', 'Accepted')"
                                ${status === "Accepted" ? "disabled" : ""}
                            >
                                Accept
                            </button>

                            <button
                                class="small-btn danger"
                                type="button"
                                onclick="updateStudentStatus('${child.id}', 'Rejected')"
                                ${status === "Rejected" ? "disabled" : ""}
                            >
                                Reject
                            </button>

                            <button
                                class="small-btn warning"
                                type="button"
                                onclick="updateStudentStatus('${child.id}', 'Active')"
                                ${status === "Active" ? "disabled" : ""}
                            >
                                Mark Active
                            </button>

                            <button
                                class="small-btn danger remove-record-btn"
                                type="button"
                                onclick="removeStudent('${child.id}')"
                            >
                                Remove Student
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        if (typeof applyStudentFilters === "function") {
            applyStudentFilters();
        }
    } catch (error) {
        alert("Admin students error: " + error.message);

        if (table) {
            table.innerHTML = `
                <tr class="admin-mobile-empty-row">
                    <td colspan="8" class="empty-row">Failed to load students.</td>
                </tr>
            `;
        }
    }
}

async function updateStudentAmount(childId) {
    const input = document.getElementById("amount_" + childId);
    const amount = Number(input ? input.value : 0);

    if (!amount || amount <= 0) {
        alert("Please enter a valid payment amount in RM.");
        return;
    }

    try {
        const response = await fetch("/api/update-student-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "update-amount",
                studentId: childId,
                monthlyAmount: amount
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to update student amount.");
            return;
        }

        alert("Student payment amount updated to RM" + amount.toFixed(2));
        loadAdminStudents();
    } catch (error) {
        alert("Update amount error: " + error.message);
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
        table.innerHTML = `
            <tr class="admin-mobile-empty-row">
                <td colspan="7" class="empty-row">Loading parents from MongoDB...</td>
            </tr>
        `;
    }

    try {
        const response = await fetch("/api/admin-parents");
        const result = await response.json();

        console.log("ADMIN PARENTS RESULT:", result);

        if (!result.success) {
            alert(result.message || "Failed to load parents.");

            if (table) {
                table.innerHTML = `
                    <tr class="admin-mobile-empty-row">
                        <td colspan="7" class="empty-row">Failed to load parents.</td>
                    </tr>
                `;
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
            table.innerHTML = `
                <tr class="admin-mobile-empty-row">
                    <td colspan="7" class="empty-row">
                        <div class="mutahus-empty-state">
                            <span>👨‍👩‍👧</span>
                            <strong>No parent accounts yet.</strong>
                            <small>New parent registrations will appear here.</small>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        parents.forEach(parent => {
            const payStatus = parent.paymentStatus || "Unpaid";
            const payClass = getPaymentBadgeClass(payStatus);
            const parentStatus = parent.status || "Active";
            const parentStatusClass =
                parentStatus === "Pending"
                    ? "pending"
                    : parentStatus === "Rejected"
                    ? "rejected"
                    : "paid";

            table.innerHTML += `
                <tr class="admin-record-row parent-record-row">
                    <td data-label="Parent">
                        <div class="record-main-identity">
                            <span class="record-avatar">👤</span>
                            <div>
                                <strong>${parent.name || "-"}</strong>
                                <small>ID: ${parent.id || "-"}</small>
                            </div>
                        </div>
                    </td>

                    <td data-label="Phone">
                        <a class="record-contact-link" href="tel:${parent.phone || ""}">
                            ${parent.phone || "-"}
                        </a>
                    </td>

                    <td data-label="Email">
                        <a class="record-contact-link record-email-link" href="mailto:${parent.email || ""}">
                            ${parent.email || "-"}
                        </a>
                    </td>

                    <td data-label="Children">
                        <span class="record-number-pill">${parent.childrenCount || 0}</span>
                    </td>

                    <td data-label="Payment">
                        <span class="badge ${payClass}">${payStatus}</span>
                    </td>

                    <td data-label="Account">
                        <span class="badge ${parentStatusClass}">${parentStatus}</span>
                    </td>

                    <td data-label="Actions" class="record-action-cell">
                        <div class="action-row mobile-admin-action-grid parent-mobile-actions">
                            <button
                                class="small-btn view"
                                type="button"
                                onclick="viewParentDetails('${parent.id}')"
                            >
                                View Details
                            </button>

                            <button
                                class="small-btn edit"
                                type="button"
                                onclick="updateParentStatus('${parent.id}', 'Active')"
                                ${parentStatus === "Active" ? "disabled" : ""}
                            >
                                Active
                            </button>

                            <button
                                class="small-btn warning"
                                type="button"
                                onclick="updateParentStatus('${parent.id}', 'Pending')"
                                ${parentStatus === "Pending" ? "disabled" : ""}
                            >
                                Pending
                            </button>

                            <button
                                class="small-btn danger"
                                type="button"
                                onclick="updateParentStatus('${parent.id}', 'Rejected')"
                                ${parentStatus === "Rejected" ? "disabled" : ""}
                            >
                                Reject
                            </button>

                            <button
                                class="small-btn danger remove-record-btn"
                                type="button"
                                onclick="removeParentAndRecords('${parent.id}')"
                            >
                                Delete Account
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        if (typeof applyParentFilters === "function") {
            applyParentFilters();
        }
    } catch (error) {
        alert("Admin parents error: " + error.message);

        if (table) {
            table.innerHTML = `
                <tr class="admin-mobile-empty-row">
                    <td colspan="7" class="empty-row">Failed to load parents.</td>
                </tr>
            `;
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
                    <td>${child.school || "-"}${child.kafa ? `<br><small>KAFA: ${child.kafa}${child.kafaSession ? ` (${child.kafaSession})` : ""}</small>` : ""}<br><small>Amount: RM${Number(child.monthlyAmount || 0).toFixed(2)}</small></td>
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
        "upload-payment.html",
        "parent-rules.html"
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
        "upload-payment.html",
        "parent-rules.html"
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
        items += mutahusMobileLink("parent-rules.html", "📘", "Rules", page);
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
        /*
         * Public pages previously returned null, so Home and Terms/Rules
         * used a different mobile taskbar/menu from the other pages.
         * Give public pages the same blue More menu and button.
         */
        items += mutahusMobileLink("index.html", "🏠", "Home", page);
        items += mutahusMobileLink("index.html#service", "🚐", "Service", page);
        items += mutahusMobileLink("index.html#schools", "🏫", "Schools", page);
        items += mutahusMobileLink("index.html#payment", "💳", "Payment", page);
        items += mutahusMobileLink("index.html#faq", "❓", "FAQ", page);
        items += mutahusMobileLink("terms-rules.html", "📘", "Rules", page);
        items += mutahusMobileLink("parent-login.html", "🔐", "Parent Login", page);
        items += mutahusMobileLink("admin-login.html", "🛡️", "Admin Login", page);
        note = "All public website links are grouped here for a consistent mobile experience.";
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
    /*
     * Step 64 already provides the current Payment Records filter inside
     * the main content. The older Step 23 filter was being inserted before
     * .app-main, creating the huge blank panel on the left of desktop view.
     */
    document.getElementById("paymentFilterPanel")?.remove();
}

function applyPaymentFilters() {
    document.getElementById("paymentFilterPanel")?.remove();

    if (typeof renderAdminPaymentRecords === "function") {
        renderAdminPaymentRecords();
    }
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


function animateHomeNumber(element, target, suffix = "") {
    if (!element) return;

    const end = Number(target || 0);
    const duration = 700;
    const startTime = performance.now();

    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.floor(progress * end);

        element.innerText = value + suffix;

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            element.innerText = end + suffix;
        }
    }

    requestAnimationFrame(step);
}

async function loadHomeStats() {
    const studentsEl = document.getElementById("homeStudents");
    const parentsEl = document.getElementById("homeParents");
    const schoolsEl = document.getElementById("homeSchools");

    if (!studentsEl && !parentsEl && !schoolsEl) return;

    try {
        const response = await fetch("/api/admin-dashboard");
        const result = await response.json();

        console.log("HOME STATS RESULT:", result);

        if (!result.success) {
            return;
        }

        const summary = result.summary || {};

        animateHomeNumber(studentsEl, summary.totalStudents || 0, "+");
        animateHomeNumber(parentsEl, summary.totalParents || 0, "+");

        if (schoolsEl) {
            const schoolCount = summary.totalSchools || 6;
            animateHomeNumber(schoolsEl, schoolCount, "");
        }
    } catch (error) {
        console.log("Home stats error:", error.message);
    }
}

document.addEventListener("DOMContentLoaded", loadHomeStats);
window.addEventListener("load", loadHomeStats);

// MUTAHUS_STEP24_HOME_STATS_MONGODB


// MUTAHUS_FIX_PARENT_PORTAL_RULES_OWN_PAGE

// MUTAHUS_FIX_DELETE_CHILD_CONTACT_ADMIN

// MUTAHUS_STEP26_PAYMENT_ADMIN_AMOUNT_SCHOOL_KAFA_RECEIPT_FIX


function injectMutahusMobileSafeAreaFix() {
    if (document.getElementById("mutahusMobileSafeAreaFix")) return;

    const style = document.createElement("style");
    style.id = "mutahusMobileSafeAreaFix";
    style.innerHTML = `
        /* MUTAHUS_STEP27_MOBILE_SAFE_AREA_FIX */
        :root {
            --mutahus-safe-bottom-space: calc(120px + env(safe-area-inset-bottom, 0px));
            --mutahus-safe-top-space: env(safe-area-inset-top, 0px);
        }

        html, body {
            min-height: 100%;
            min-height: 100dvh;
            overflow-x: hidden;
        }

        @media (max-width: 860px) {
            .app-main,
            .portal-main,
            .rules-main {
                padding-bottom: var(--mutahus-safe-bottom-space) !important;
            }

            .mobile-app-header,
            .mobile-topbar,
            .mobile-admin-header {
                padding-top: calc(14px + env(safe-area-inset-top, 0px)) !important;
                min-height: calc(64px + env(safe-area-inset-top, 0px));
            }

            .top-taskbar {
                padding-top: calc(12px + env(safe-area-inset-top, 0px)) !important;
            }

            .mobile-bottom-nav,
            .admin-mobile-bottom {
                bottom: calc(26px + env(safe-area-inset-bottom, 0px)) !important;
                left: 10px !important;
                right: 10px !important;
                max-width: calc(100vw - 20px);
            }

            .whatsapp-float {
                bottom: calc(118px + env(safe-area-inset-bottom, 0px)) !important;
            }

            .receipt-modal-card {
                max-height: calc(92dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) !important;
            }

            .receipt-modal-body {
                max-height: calc(76dvh - env(safe-area-inset-bottom, 0px)) !important;
            }

            .page-hero-bar,
            .hero-card,
            .dashboard-hero {
                margin-top: 8px;
            }

            .content-grid,
            .dashboard-grid,
            .stats-grid,
            .portal-panel,
            .rules-panel {
                margin-bottom: 18px;
            }
        }

        @media (max-width: 480px) {
            .mobile-bottom-nav,
            .admin-mobile-bottom {
                bottom: calc(30px + env(safe-area-inset-bottom, 0px)) !important;
            }

            .app-main,
            .portal-main,
            .rules-main {
                padding-bottom: calc(145px + env(safe-area-inset-bottom, 0px)) !important;
            }

            .whatsapp-float {
                bottom: calc(130px + env(safe-area-inset-bottom, 0px)) !important;
            }
        }
    `;

    document.head.appendChild(style);
}

document.addEventListener("DOMContentLoaded", injectMutahusMobileSafeAreaFix);
window.addEventListener("load", injectMutahusMobileSafeAreaFix);

// MUTAHUS_STEP27_MOBILE_SAFE_AREA_FIX


function setupMutahusWhatsappDirectLinks() {
    const phone = "60178078271";
    const text = "Assalamualaikum, saya berminat untuk bertanya tentang servis van sekolah MUTHAQUS GLOBAL ENTERPRISE.";
    const encodedText = encodeURIComponent(text);
    const webUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
    const appUrl = `whatsapp://send?phone=${phone}&text=${encodedText}`;

    const links = document.querySelectorAll(
        'a[href*="wa.me"], a[href*="api.whatsapp.com"], a.whatsapp-float'
    );

    links.forEach(link => {
        link.href = webUrl;
        link.target = "_blank";
        link.rel = "noopener";

        if (link.dataset.whatsappDirectFixed === "true") return;
        link.dataset.whatsappDirectFixed = "true";

        link.addEventListener("click", function(event) {
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (!isMobile) {
                return;
            }

            event.preventDefault();

            let fallbackTimer = setTimeout(function() {
                window.location.href = webUrl;
            }, 900);

            const clearFallback = function() {
                clearTimeout(fallbackTimer);
            };

            window.addEventListener("pagehide", clearFallback, { once: true });
            document.addEventListener("visibilitychange", function() {
                if (document.hidden) clearFallback();
            }, { once: true });

            window.location.href = appUrl;
        });
    });
}

document.addEventListener("DOMContentLoaded", setupMutahusWhatsappDirectLinks);
window.addEventListener("load", setupMutahusWhatsappDirectLinks);
setTimeout(setupMutahusWhatsappDirectLinks, 700);

// MUTAHUS_STEP28_WHATSAPP_MOBILE_DIRECT_FIX


// MUTAHUS_STEP29_PAYMENT_PAY_ALL_OR_ONE_CHILD



function mutahusStep30MobileHeaderMoreFix() {
    const button = document.getElementById("mutahusMobileFeatureBtn");
    const grid = document.querySelector("#mutahusMobileFeaturePanel .mutahus-mobile-feature-grid");

    if (button) {
        button.innerHTML = "⋯";
        button.setAttribute("aria-label", "More");
        button.title = "More";
    }

    if (grid && !document.getElementById("mutahusMobileWhatsappItem")) {
        const wa = document.createElement("a");
        wa.id = "mutahusMobileWhatsappItem";
        wa.href = "https://api.whatsapp.com/send?phone=60178078271&text=Assalamualaikum%2C%20saya%20berminat%20untuk%20bertanya%20tentang%20servis%20van%20sekolah%20Mutahus%20Global.";
        wa.innerHTML = "<span>💬</span> WhatsApp";
        wa.rel = "noopener";
        grid.appendChild(wa);
    }

    if (grid && !document.getElementById("mutahusMobileCsvHint")) {
        const page = window.location.pathname.split("/").pop() || "index.html";

        if (page === "admin-students.html" && typeof exportStudentsCSV === "function" && !grid.querySelector('[data-mobile-action="exportStudentsCSV"]')) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "primary";
            btn.dataset.mobileAction = "exportStudentsCSV";
            btn.innerHTML = "<span>⬇️</span> Export Students CSV";
            btn.addEventListener("click", function () {
                closeMutahusMobileFeatureMenu();
                exportStudentsCSV();
            });
            grid.appendChild(btn);
        }

        if (page === "admin-parents.html" && typeof exportParentsCSV === "function" && !grid.querySelector('[data-mobile-action="exportParentsCSV"]')) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "primary";
            btn.dataset.mobileAction = "exportParentsCSV";
            btn.innerHTML = "<span>⬇️</span> Export Parents CSV";
            btn.addEventListener("click", function () {
                closeMutahusMobileFeatureMenu();
                exportParentsCSV();
            });
            grid.appendChild(btn);
        }

        if (page === "admin-payments.html" && typeof exportPaymentsCSV === "function" && !grid.querySelector('[data-mobile-action="exportPaymentsCSV"]')) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "primary";
            btn.dataset.mobileAction = "exportPaymentsCSV";
            btn.innerHTML = "<span>⬇️</span> Export Payments CSV";
            btn.addEventListener("click", function () {
                closeMutahusMobileFeatureMenu();
                exportPaymentsCSV();
            });
            grid.appendChild(btn);
        }
    }

    if (!document.getElementById("mutahusStep30MobileMoreStyle")) {
        const style = document.createElement("style");
        style.id = "mutahusStep30MobileMoreStyle";
        style.innerHTML = `
            @media (max-width: 860px) {
                .mutahus-mobile-feature-btn {
                    top: calc(12px + env(safe-area-inset-top, 0px)) !important;
                    right: 14px !important;
                    left: auto !important;
                    bottom: auto !important;
                    width: 46px !important;
                    height: 46px !important;
                    min-height: 46px !important;
                    padding: 0 !important;
                    border-radius: 16px !important;
                    font-size: 26px !important;
                    line-height: 1 !important;
                    z-index: 10002 !important;
                }

                .mutahus-mobile-feature-panel {
                    top: calc(70px + env(safe-area-inset-top, 0px)) !important;
                    bottom: auto !important;
                    max-height: calc(78dvh - env(safe-area-inset-top, 0px)) !important;
                    transform: translateY(-120%) !important;
                }

                .mutahus-mobile-feature-panel.show {
                    transform: translateY(0) !important;
                }

                .whatsapp-float {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(mutahusStep30MobileHeaderMoreFix, 200);
    setTimeout(mutahusStep30MobileHeaderMoreFix, 900);
    setTimeout(mutahusStep30MobileHeaderMoreFix, 1600);
});
window.addEventListener("load", function () {
    setTimeout(mutahusStep30MobileHeaderMoreFix, 200);
    setTimeout(mutahusStep30MobileHeaderMoreFix, 900);
});

// MUTAHUS_STEP30_USER_COMPLAINT_FIXES


function mutahusStep31MobileHeaderCleanFix() {
    if (document.getElementById("mutahusStep31MobileHeaderStyle")) return;

    const style = document.createElement("style");
    style.id = "mutahusStep31MobileHeaderStyle";
    style.innerHTML = `
        /* MUTAHUS_STEP31_MOBILE_HEADER_WHITE_TOP_FIX */

        @media (max-width: 860px) {
            html {
                background: #edf4ff !important;
            }

            body {
                background: linear-gradient(180deg, #edf4ff 0%, #f7fbff 100%) !important;
                padding-top: 0 !important;
                margin-top: 0 !important;
            }

            /* remove Profile / Logout / Dashboard buttons from top mobile header */
            .mobile-actions,
            .mobile-logout,
            .mobile-header-actions,
            .mobile-profile-link,
            .mobile-logout-link {
                display: none !important;
            }

            /* cover the annoying white strip near phone battery/status bar */
            body::before {
                content: "";
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: calc(18px + env(safe-area-inset-top, 0px));
                background: linear-gradient(180deg, #143f73 0%, #0e335d 100%);
                z-index: 10000;
                pointer-events: none;
            }

            .mobile-app-header,
            .mobile-topbar,
            .mobile-admin-header {
                top: 0 !important;
                margin-top: 0 !important;
                padding-top: calc(16px + env(safe-area-inset-top, 0px)) !important;
                background: linear-gradient(180deg, #143f73 0%, #0e335d 100%) !important;
                border-top: 0 !important;
                box-shadow: 0 10px 22px rgba(8, 34, 72, 0.12);
                z-index: 9999 !important;
            }

            .top-taskbar {
                margin-top: 0 !important;
                padding-top: calc(14px + env(safe-area-inset-top, 0px)) !important;
                background: linear-gradient(180deg, #143f73 0%, #0e335d 100%) !important;
                border-top: 0 !important;
            }

            #mutahusMobileFeatureBtn {
                top: calc(14px + env(safe-area-inset-top, 0px)) !important;
                right: 14px !important;
                left: auto !important;
                bottom: auto !important;
                z-index: 10003 !important;
            }

            #mutahusMobileFeaturePanel {
                top: calc(74px + env(safe-area-inset-top, 0px)) !important;
            }

            .app-main,
            .portal-main,
            .rules-main {
                padding-top: 18px !important;
            }
        }
    `;

    document.head.appendChild(style);

    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
        themeMeta = document.createElement("meta");
        themeMeta.name = "theme-color";
        document.head.appendChild(themeMeta);
    }
    themeMeta.content = "#143f73";

    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta) {
        appleMeta = document.createElement("meta");
        appleMeta.name = "apple-mobile-web-app-status-bar-style";
        document.head.appendChild(appleMeta);
    }
    appleMeta.content = "black-translucent";
}

document.addEventListener("DOMContentLoaded", function () {
    mutahusStep31MobileHeaderCleanFix();
    setTimeout(mutahusStep31MobileHeaderCleanFix, 500);
    setTimeout(mutahusStep31MobileHeaderCleanFix, 1200);
});

window.addEventListener("load", function () {
    mutahusStep31MobileHeaderCleanFix();
    setTimeout(mutahusStep31MobileHeaderCleanFix, 500);
});

// MUTAHUS_STEP31_MOBILE_HEADER_WHITE_TOP_FIX


function mutahusStep32CleanTopAndBankFix() {
    if (!document.getElementById("mutahusStep32CleanTopStyle")) {
        const style = document.createElement("style");
        style.id = "mutahusStep32CleanTopStyle";
        style.innerHTML = `
            /* MUTAHUS_STEP32_BANK_WHITE_CLEAN_TOP_COMBINED_STEP31 */

            .bank-card-pro,
            .bank-card-pro * {
                color: #ffffff !important;
            }

            .bank-card-pro h3,
            .bank-card-pro span,
            .bank-card-pro strong {
                color: #ffffff !important;
            }

            .bank-card-pro span {
                opacity: .9 !important;
            }

            .bank-card-pro .bank-row {
                border-top-color: rgba(255,255,255,.22) !important;
            }

            @media (max-width: 860px) {
                .hero-card .hero-actions {
                    display: none !important;
                }

                .hero-card > div > p,
                .page-hero-bar > div > p {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    const page = window.location.pathname.split("/").pop() || "index.html";
    const cleanPages = [
        "add-student.html",
        "upload-payment.html",
        "parent-rules.html",
        "parent-profile.html"
    ];

    if (cleanPages.includes(page)) {
        document.querySelectorAll(".hero-card .hero-actions").forEach(el => el.remove());
        document.querySelectorAll(".hero-card > div > p").forEach(el => el.remove());
    }
}

document.addEventListener("DOMContentLoaded", function () {
    mutahusStep32CleanTopAndBankFix();
    setTimeout(mutahusStep32CleanTopAndBankFix, 400);
    setTimeout(mutahusStep32CleanTopAndBankFix, 1200);
});
window.addEventListener("load", mutahusStep32CleanTopAndBankFix);

// MUTAHUS_STEP32_BANK_WHITE_CLEAN_TOP_COMBINED_STEP31

// MUTAHUS_STEP33_DASHBOARD_LAYOUT_REGISTER_PAYMENT_FIX


/* =========================================================
   MUTAHUS STEP 50 — CLEAN ESSENTIAL MOBILE FIXES ONLY
   ========================================================= */

(function () {
    "use strict";

    const WHATSAPP_PHONE = "60178078271";
    const WHATSAPP_TEXT =
        "Assalamualaikum, saya berminat untuk bertanya tentang servis van sekolah MUTHAQUS GLOBAL ENTERPRISE.";
    const WHATSAPP_URL =
        "https://api.whatsapp.com/send?phone=" +
        WHATSAPP_PHONE +
        "&text=" +
        encodeURIComponent(WHATSAPP_TEXT);

    function installCleanStyles() {
        if (document.getElementById("mutahusStep50CleanStyles")) return;

        const style = document.createElement("style");
        style.id = "mutahusStep50CleanStyles";
        style.textContent = `
            /* MUTAHUS_STEP50_CLEAN_APPJS_ONLY */

            .whatsapp-float {
                display: none !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }

            .mutahus-whatsapp-sidebar-link {
                background: rgba(37, 211, 102, 0.18) !important;
                border: 1px solid rgba(37, 211, 102, 0.35) !important;
                color: #ffffff !important;
            }

            @media (max-width: 860px) {
                html,
                body {
                    width: 100% !important;
                    max-width: 100% !important;
                    margin: 0 !important;
                    overflow-x: hidden !important;
                }

                *,
                *::before,
                *::after {
                    box-sizing: border-box !important;
                }

                body .top-taskbar,
                body .top-taskbar.home-taskbar {
                    position: sticky !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    min-height: 68px !important;
                    margin: 0 !important;
                    padding: calc(10px + env(safe-area-inset-top, 0px)) 14px 10px !important;
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    gap: 10px !important;
                    background: rgba(15, 60, 104, 0.98) !important;
                    border: 0 !important;
                    border-radius: 0 !important;
                    box-shadow: 0 8px 24px rgba(15, 60, 104, 0.16) !important;
                    backdrop-filter: blur(14px) !important;
                    -webkit-backdrop-filter: blur(14px) !important;
                    z-index: 5000 !important;
                    overflow: visible !important;
                    transform: none !important;
                }

                body .top-taskbar .brand-block {
                    flex: 1 1 auto !important;
                    min-width: 0 !important;
                    max-width: calc(100% - 56px) !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 10px !important;
                    color: #ffffff !important;
                    text-decoration: none !important;
                }

                body .top-taskbar .brand-icon {
                    width: 42px !important;
                    min-width: 42px !important;
                    height: 42px !important;
                    margin: 0 !important;
                    display: grid !important;
                    place-items: center !important;
                    border-radius: 14px !important;
                    border: 1px solid rgba(255, 255, 255, 0.18) !important;
                    background: rgba(255, 255, 255, 0.13) !important;
                    color: #ffffff !important;
                    font-size: 22px !important;
                    line-height: 1 !important;
                }

                body .top-taskbar .brand-block > div {
                    min-width: 0 !important;
                }

                body .top-taskbar .brand-block strong {
                    display: block !important;
                    margin: 0 !important;
                    color: #ffffff !important;
                    font-size: 16px !important;
                    font-weight: 900 !important;
                    line-height: 1.2 !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                }

                body .top-taskbar .brand-block small {
                    display: block !important;
                    margin: 2px 0 0 !important;
                    color: rgba(255, 255, 255, 0.78) !important;
                    font-size: 10.5px !important;
                    line-height: 1.2 !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                }

                body .top-taskbar .mobile-menu-btn {
                    display: inline-flex !important;
                    flex: 0 0 44px !important;
                    width: 44px !important;
                    min-width: 44px !important;
                    height: 44px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border: 1px solid rgba(255, 255, 255, 0.20) !important;
                    border-radius: 14px !important;
                    background: rgba(255, 255, 255, 0.13) !important;
                    color: #ffffff !important;
                    font-size: 22px !important;
                    font-weight: 900 !important;
                    line-height: 1 !important;
                    box-shadow: none !important;
                }

                body .top-taskbar .taskbar-links {
                    display: none !important;
                    position: fixed !important;
                    top: calc(72px + env(safe-area-inset-top, 0px)) !important;
                    left: 12px !important;
                    right: 12px !important;
                    width: auto !important;
                    max-width: calc(100vw - 24px) !important;
                    max-height: calc(100dvh - 94px - env(safe-area-inset-top, 0px)) !important;
                    margin: 0 !important;
                    padding: 10px !important;
                    overflow-y: auto !important;
                    overflow-x: hidden !important;
                    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    gap: 8px !important;
                    border: 1px solid #d9e5f5 !important;
                    border-radius: 20px !important;
                    background: #ffffff !important;
                    box-shadow: 0 20px 50px rgba(15, 60, 104, 0.22) !important;
                    z-index: 5001 !important;
                    transform: none !important;
                }

                body .top-taskbar .taskbar-links.show-mobile-menu {
                    display: grid !important;
                }

                body .top-taskbar .taskbar-links a {
                    width: 100% !important;
                    min-width: 0 !important;
                    min-height: 44px !important;
                    margin: 0 !important;
                    padding: 10px 8px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border: 0 !important;
                    border-radius: 13px !important;
                    background: #f4f8ff !important;
                    color: #123f73 !important;
                    text-align: center !important;
                    text-decoration: none !important;
                    white-space: normal !important;
                    overflow-wrap: anywhere !important;
                    font-size: 12px !important;
                    line-height: 1.25 !important;
                    font-weight: 900 !important;
                    box-shadow: none !important;
                }

                body .top-taskbar .taskbar-links a.active {
                    background: #dbeafe !important;
                    color: #0f3c68 !important;
                }

                body .top-taskbar .taskbar-links a.admin-pill {
                    background: linear-gradient(135deg, #1d6fd1, #0f3c68) !important;
                    color: #ffffff !important;
                }

                .mobile-bottom-nav,
                .admin-mobile-bottom {
                    position: fixed !important;
                    left: 18px !important;
                    right: 18px !important;
                    bottom: calc(14px + env(safe-area-inset-bottom, 0px)) !important;
                    width: auto !important;
                    max-width: calc(100vw - 36px) !important;
                    margin: 0 auto !important;
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    z-index: 9000 !important;
                    transform: none !important;
                }

                .app-main,
                .portal-main,
                .rules-main,
                main {
                    padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px)) !important;
                }
            }

            @media (max-width: 360px) {
                body .top-taskbar .taskbar-links {
                    grid-template-columns: 1fr !important;
                }
            }

            #receiptPreviewModal.mutahus-clean-receipt {
                position: fixed !important;
                inset: 0 !important;
                z-index: 999999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 10px !important;
                overflow: hidden !important;
                background: rgba(7, 22, 42, 0.76) !important;
            }

            #receiptPreviewModal .mutahus-clean-receipt-card {
                width: min(920px, calc(100vw - 20px)) !important;
                max-height: 90dvh !important;
                display: flex !important;
                flex-direction: column !important;
                overflow: hidden !important;
                border-radius: 20px !important;
                background: #ffffff !important;
                box-shadow: 0 24px 60px rgba(0,0,0,.35) !important;
            }

            #receiptPreviewModal .mutahus-clean-receipt-header {
                flex-shrink: 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 10px !important;
                padding: 12px 14px !important;
                background: linear-gradient(180deg,#143f73 0%,#0e335d 100%) !important;
                color: #ffffff !important;
            }

            #receiptPreviewModal .mutahus-clean-receipt-header h2 {
                margin: 0 0 3px !important;
                color: #ffffff !important;
                font-size: 16px !important;
            }

            #receiptPreviewModal .mutahus-clean-receipt-header p {
                margin: 0 !important;
                color: rgba(255,255,255,.9) !important;
                font-size: 11px !important;
                line-height: 1.3 !important;
                overflow-wrap: anywhere !important;
            }

            #receiptPreviewModal .mutahus-clean-receipt-close {
                width: 46px !important;
                min-width: 46px !important;
                height: 46px !important;
                border: 0 !important;
                border-radius: 14px !important;
                background: rgba(255,255,255,.18) !important;
                color: #ffffff !important;
                font-size: 28px !important;
                font-weight: 900 !important;
                cursor: pointer !important;
            }

            #receiptPreviewModal .mutahus-clean-receipt-body {
                flex: 1 !important;
                min-height: 0 !important;
                padding: 8px !important;
                overflow: hidden !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: #f4f8ff !important;
            }

            #receiptPreviewModal img {
                display: block !important;
                width: auto !important;
                height: auto !important;
                max-width: 100% !important;
                max-height: 70dvh !important;
                object-fit: contain !important;
                border-radius: 14px !important;
            }

            #receiptPreviewModal iframe {
                width: 100% !important;
                height: 70dvh !important;
                border: 0 !important;
                border-radius: 14px !important;
                background: #ffffff !important;
            }

            body.mutahus-receipt-open {
                overflow: hidden !important;
            }
        `;

        document.head.appendChild(style);
    }

    function fixWhatsApp() {
        document.querySelectorAll(".whatsapp-float").forEach((item) => item.remove());

        document.querySelectorAll(".sidebar-menu, .side-links").forEach((menu) => {
            let link = menu.querySelector(".mutahus-whatsapp-sidebar-link");

            if (!link) {
                link = document.createElement("a");
                link.className = "mutahus-whatsapp-sidebar-link";
                link.innerHTML = "<span>💬</span> WhatsApp";
                menu.appendChild(link);
            }

            link.href = WHATSAPP_URL;
            link.target = "_self";
            link.rel = "noopener";
        });

        document
            .querySelectorAll(
                'a[href^="whatsapp://"], a[href*="wa.me"], a[href*="api.whatsapp.com"]'
            )
            .forEach((link) => {
                link.href = WHATSAPP_URL;
                link.target = "_self";
                link.rel = "noopener";
            });
    }

    function fixMenus() {
        document.querySelectorAll(".top-taskbar .mobile-menu-btn").forEach((button) => {
            button.type = "button";
            button.setAttribute("aria-label", "Open menu");
        });

        document.querySelectorAll(".top-taskbar .taskbar-links").forEach((menu) => {
            menu.querySelectorAll("a").forEach((link) => {
                if (link.dataset.mutahusStep50Bound === "true") return;
                link.dataset.mutahusStep50Bound = "true";

                link.addEventListener("click", () => {
                    menu.classList.remove("show-mobile-menu");
                });
            });
        });
    }

    window.closeReceiptModal = function () {
        document.getElementById("receiptPreviewModal")?.remove();
        document.body.classList.remove("mutahus-receipt-open");
        document.body.style.overflow = "";
    };

    window.showReceiptInfo = function (receiptName, note, receiptDataUrl) {
        installCleanStyles();
        closeReceiptModal();

        const name = receiptName || "Receipt";
        const paymentNote = note || "No note";

        if (!receiptDataUrl || !receiptDataUrl.startsWith("data:")) {
            alert(
                "Receipt file: " +
                    name +
                    "\nPayment note: " +
                    paymentNote +
                    "\n\nActual receipt image is not available for this older payment record."
            );
            return;
        }

        const isPdf = receiptDataUrl.startsWith("data:application/pdf");
        const modal = document.createElement("div");
        modal.id = "receiptPreviewModal";
        modal.className = "mutahus-clean-receipt";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");

        modal.innerHTML = `
            <div class="mutahus-clean-receipt-card">
                <div class="mutahus-clean-receipt-header">
                    <div>
                        <h2>MUTHAQUS GLOBAL ENTERPRISE</h2>
                        <p><strong>Payment Receipt</strong></p>
                        <p>${{name}}</p>
                        <p>${paymentNote}</p>
                    </div>
                    <button type="button" class="mutahus-clean-receipt-close" aria-label="Close receipt">×</button>
                </div>
                <div class="mutahus-clean-receipt-body">
                    ${
                        isPdf
                            ? `<iframe src="${receiptDataUrl}" title="Payment receipt PDF"></iframe>`
                            : `<img src="${receiptDataUrl}" alt="Payment receipt">`
                    }
                </div>
            </div>
        `;

        modal
            .querySelector(".mutahus-clean-receipt-close")
            .addEventListener("click", closeReceiptModal);

        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeReceiptModal();
        });

        document.body.appendChild(modal);
        document.body.classList.add("mutahus-receipt-open");
    };

    function initializeCleanFixes() {
        installCleanStyles();
        fixWhatsApp();
        fixMenus();
    }

    document.addEventListener("DOMContentLoaded", initializeCleanFixes);
    window.addEventListener("load", initializeCleanFixes);

    const observer = new MutationObserver(() => {
        fixWhatsApp();
        fixMenus();
    });

    document.addEventListener("DOMContentLoaded", () => {
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    });
})();

// MUTAHUS_STEP50_CLEAN_APPJS_ONLY


/* =========================================================
   MUTAHUS STEP 51 — MOBILE ONLY, ONE TOP TASKBAR
   Desktop/web view is not changed.
   ========================================================= */

(function () {
    "use strict";

    const MOBILE_QUERY = window.matchMedia("(max-width: 860px)");

    function installMobileOnlyCleanupStyle() {
        if (document.getElementById("mutahusStep51MobileOnlyStyle")) return;

        const style = document.createElement("style");
        style.id = "mutahusStep51MobileOnlyStyle";
        style.textContent = `
            /* MUTAHUS_STEP51_MOBILE_ONLY_SINGLE_TOP_TASKBAR */

            @media (max-width: 860px) {
                .mutahus-mobile-duplicate-topbar {
                    display: none !important;
                    visibility: hidden !important;
                    height: 0 !important;
                    min-height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    pointer-events: none !important;
                }

                body .top-taskbar,
                body .top-taskbar.home-taskbar {
                    position: sticky !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    min-height: 68px !important;
                    margin: 0 !important;
                    padding: calc(10px + env(safe-area-inset-top, 0px)) 14px 10px !important;
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    gap: 10px !important;
                    background: rgba(15, 60, 104, 0.98) !important;
                    border: 0 !important;
                    border-radius: 0 !important;
                    box-shadow: 0 8px 24px rgba(15, 60, 104, 0.16) !important;
                    z-index: 5000 !important;
                    overflow: visible !important;
                    transform: none !important;
                }

                body .top-taskbar .brand-block {
                    flex: 1 1 auto !important;
                    min-width: 0 !important;
                    max-width: calc(100% - 56px) !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 10px !important;
                }

                body .top-taskbar .brand-icon {
                    width: 42px !important;
                    min-width: 42px !important;
                    height: 42px !important;
                    margin: 0 !important;
                    display: grid !important;
                    place-items: center !important;
                    border-radius: 14px !important;
                    background: rgba(255, 255, 255, 0.13) !important;
                    border: 1px solid rgba(255, 255, 255, 0.18) !important;
                    color: #ffffff !important;
                    font-size: 22px !important;
                    line-height: 1 !important;
                }

                body .top-taskbar .brand-block > div {
                    min-width: 0 !important;
                }

                body .top-taskbar .brand-block strong {
                    display: block !important;
                    color: #ffffff !important;
                    font-size: 16px !important;
                    line-height: 1.2 !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                }

                body .top-taskbar .brand-block small {
                    display: block !important;
                    margin-top: 2px !important;
                    color: rgba(255, 255, 255, 0.78) !important;
                    font-size: 10.5px !important;
                    line-height: 1.2 !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                }

                body .top-taskbar .mobile-menu-btn {
                    display: inline-flex !important;
                    flex: 0 0 44px !important;
                    width: 44px !important;
                    min-width: 44px !important;
                    height: 44px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border-radius: 14px !important;
                    border: 1px solid rgba(255, 255, 255, 0.20) !important;
                    background: rgba(255, 255, 255, 0.13) !important;
                    color: #ffffff !important;
                    font-size: 22px !important;
                    line-height: 1 !important;
                    box-shadow: none !important;
                }

                body .top-taskbar .taskbar-links {
                    display: none !important;
                    position: fixed !important;
                    top: calc(72px + env(safe-area-inset-top, 0px)) !important;
                    left: 12px !important;
                    right: 12px !important;
                    width: auto !important;
                    max-width: calc(100vw - 24px) !important;
                    max-height: calc(100dvh - 94px - env(safe-area-inset-top, 0px)) !important;
                    margin: 0 !important;
                    padding: 10px !important;
                    overflow-y: auto !important;
                    overflow-x: hidden !important;
                    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    gap: 8px !important;
                    border: 1px solid #d9e5f5 !important;
                    border-radius: 20px !important;
                    background: #ffffff !important;
                    box-shadow: 0 20px 50px rgba(15, 60, 104, 0.22) !important;
                    z-index: 5001 !important;
                    transform: none !important;
                }

                body .top-taskbar .taskbar-links.show-mobile-menu {
                    display: grid !important;
                }

                body .top-taskbar .taskbar-links a {
                    width: 100% !important;
                    min-width: 0 !important;
                    min-height: 44px !important;
                    margin: 0 !important;
                    padding: 10px 8px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border: 0 !important;
                    border-radius: 13px !important;
                    background: #f4f8ff !important;
                    color: #123f73 !important;
                    text-align: center !important;
                    text-decoration: none !important;
                    white-space: normal !important;
                    overflow-wrap: anywhere !important;
                    font-size: 12px !important;
                    line-height: 1.25 !important;
                    font-weight: 900 !important;
                }

                body .top-taskbar .taskbar-links a.active {
                    background: #dbeafe !important;
                    color: #0f3c68 !important;
                }

                body .top-taskbar .taskbar-links a.admin-pill {
                    background: linear-gradient(135deg, #1d6fd1, #0f3c68) !important;
                    color: #ffffff !important;
                }
            }

            @media (max-width: 360px) {
                body .top-taskbar .taskbar-links {
                    grid-template-columns: 1fr !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function keepOnlyOneMobileTopbar() {
        const topbars = Array.from(document.querySelectorAll("header.top-taskbar"));

        topbars.forEach((topbar) => {
            topbar.classList.remove("mutahus-mobile-duplicate-topbar");
            topbar.removeAttribute("aria-hidden");
        });

        if (!MOBILE_QUERY.matches || topbars.length <= 1) return;

        topbars.slice(1).forEach((topbar) => {
            topbar.classList.add("mutahus-mobile-duplicate-topbar");
            topbar.setAttribute("aria-hidden", "true");

            const openMenu = topbar.querySelector(".taskbar-links.show-mobile-menu");
            if (openMenu) openMenu.classList.remove("show-mobile-menu");
        });
    }

    function bindMobileMenuLinks() {
        if (!MOBILE_QUERY.matches) return;

        document.querySelectorAll("header.top-taskbar:not(.mutahus-mobile-duplicate-topbar)").forEach((topbar) => {
            const menu = topbar.querySelector(".taskbar-links");
            if (!menu) return;

            menu.querySelectorAll("a").forEach((link) => {
                if (link.dataset.mutahusStep51Bound === "true") return;
                link.dataset.mutahusStep51Bound = "true";

                link.addEventListener("click", () => {
                    menu.classList.remove("show-mobile-menu");
                });
            });
        });
    }

    function runMobileOnlyCleanup() {
        installMobileOnlyCleanupStyle();
        keepOnlyOneMobileTopbar();
        bindMobileMenuLinks();
    }

    document.addEventListener("DOMContentLoaded", runMobileOnlyCleanup);
    window.addEventListener("load", runMobileOnlyCleanup);
    window.addEventListener("resize", runMobileOnlyCleanup);
    window.addEventListener("orientationchange", runMobileOnlyCleanup);

    if (typeof MOBILE_QUERY.addEventListener === "function") {
        MOBILE_QUERY.addEventListener("change", runMobileOnlyCleanup);
    }

    const observer = new MutationObserver(() => {
        if (MOBILE_QUERY.matches) {
            keepOnlyOneMobileTopbar();
            bindMobileMenuLinks();
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    });
})();

// MUTAHUS_STEP51_MOBILE_ONLY_SINGLE_TOP_TASKBAR


/* =========================================================
   MUTAHUS_STEP54_ADMIN_DESKTOP_RESTORE
   Fixes the screenshot issue without changing desktop layout.
   ========================================================= */
(function () {
    "use strict";

    if (window.__mutahusStep54Loaded) return;
    window.__mutahusStep54Loaded = true;

    const mobileQuery = window.matchMedia("(max-width: 860px)");

    function injectStep54Styles() {
        if (document.getElementById("mutahusStep54Styles")) return;

        const style = document.createElement("style");
        style.id = "mutahusStep54Styles";
        style.textContent = `
            /* MUTAHUS_STEP54_ADMIN_DESKTOP_RESTORE */

            /*
             * Desktop must keep the original Step 52 layout.
             * Mobile-only controls must never affect desktop admin login.
             */
            @media (min-width: 861px) {
                #mutahusMobileFeatureBtn,
                #mutahusMobileFeaturePanel,
                #mutahusMobileFeatureBackdrop {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }

                header.top-taskbar.mutahus-step54-duplicate {
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
            }

            /*
             * Screenshot fixes are restricted to mobile only.
             */
            @media (max-width: 860px) {
                html,
                body {
                    margin-top: 0 !important;
                    padding-top: 0 !important;
                    overflow-x: hidden !important;
                }

                header.top-taskbar {
                    top: 0 !important;
                    margin-top: 0 !important;
                }

                header.top-taskbar.mutahus-step54-duplicate {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }

                #mutahusMobileFeaturePanel:not(.show),
                #mutahusMobileFeatureBackdrop:not(.show) {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                    transform: none !important;
                }

                #mutahusMobileFeaturePanel.show {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    pointer-events: auto !important;
                    transform: none !important;
                }

                #mutahusMobileFeatureBackdrop.show {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }

                body.mutahus-step54-has-more
                    header.top-taskbar
                    .mobile-menu-btn {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }

                #mutahusMobileFeatureBtn {
                    display: inline-flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
            }

            /*
             * Animation works in both views, but uses opacity only.
             * No transform is applied to the desktop admin two-column layout.
             */
            body.mutahus-step54-page-enter header.top-taskbar,
            body.mutahus-step54-page-enter main {
                animation: mutahusStep54FadeIn 0.34s ease both !important;
            }

            @keyframes mutahusStep54FadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @media (prefers-reduced-motion: reduce) {
                body.mutahus-step54-page-enter header.top-taskbar,
                body.mutahus-step54-page-enter main {
                    animation-duration: 0.01ms !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function cleanMobileHeader() {
        const headers = Array.from(
            document.querySelectorAll("header.top-taskbar")
        );

        headers.forEach((header) => {
            header.classList.remove("mutahus-step54-duplicate");
        });

        if (!mobileQuery.matches || headers.length <= 1) return;

        const keeper =
            headers.find((header) =>
                /MUTHAQUS GLOBAL ENTERPRISE/i.test(header.textContent || "")
            ) || headers[0];

        headers.forEach((header) => {
            if (header !== keeper) {
                header.classList.add("mutahus-step54-duplicate");

                const openMenu = header.querySelector(
                    ".taskbar-links.show-mobile-menu"
                );
                if (openMenu) {
                    openMenu.classList.remove("show-mobile-menu");
                }
            }
        });
    }

    function cleanFeatureMenu() {
        const button = document.getElementById("mutahusMobileFeatureBtn");
        const panel = document.getElementById("mutahusMobileFeaturePanel");
        const backdrop = document.getElementById(
            "mutahusMobileFeatureBackdrop"
        );

        if (mobileQuery.matches && button) {
            document.body.classList.add("mutahus-step54-has-more");
            button.innerHTML = "•••";
            button.setAttribute("aria-label", "More");
            button.title = "More";
        } else {
            document.body.classList.remove("mutahus-step54-has-more");

            if (panel) panel.classList.remove("show");
            if (backdrop) backdrop.classList.remove("show");
        }
    }

    function startSafeAnimation() {
        if (document.body.dataset.mutahusStep54Animated === "true") return;

        document.body.dataset.mutahusStep54Animated = "true";
        document.body.classList.add("mutahus-step54-page-enter");

        window.setTimeout(() => {
            document.body.classList.remove("mutahus-step54-page-enter");
        }, 500);
    }

    function runStep54() {
        injectStep54Styles();
        cleanMobileHeader();
        cleanFeatureMenu();
        startSafeAnimation();
    }

    document.addEventListener("DOMContentLoaded", runStep54);
    window.addEventListener("load", runStep54);
    window.addEventListener("pageshow", runStep54);
    window.addEventListener("resize", runStep54);
    window.addEventListener("orientationchange", runStep54);

    if (typeof mobileQuery.addEventListener === "function") {
        mobileQuery.addEventListener("change", runStep54);
    }

    let mutationTimer = null;
    const observer = new MutationObserver(() => {
        window.clearTimeout(mutationTimer);
        mutationTimer = window.setTimeout(() => {
            cleanMobileHeader();
            cleanFeatureMenu();
        }, 100);
    });

    document.addEventListener("DOMContentLoaded", () => {
        if (!document.body) return;

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });

    window.setTimeout(runStep54, 250);
    window.setTimeout(runStep54, 900);
    window.setTimeout(runStep54, 1600);
})();

// MUTAHUS_STEP54_ADMIN_DESKTOP_RESTORE


/* =========================================================
   MUTAHUS_STEP56_LINK_INTEGRITY_AND_PAGE_POLISH

   Applies to every page that loads app.js:
   - Ensures style.css is linked
   - Repairs common old/broken page links
   - Applies correct active navigation state
   - Improves accessibility and link security
   - Adds page classes for consistent CSS targeting
   ========================================================= */
(function () {
    "use strict";

    if (window.__mutahusStep56Loaded) return;
    window.__mutahusStep56Loaded = true;

    const KNOWN_PAGES = new Set([
        "index.html",
        "parent-register.html",
        "parent-login.html",
        "parent-forgot-password.html",
        "parent-dashboard.html",
        "parent-profile.html",
        "add-student.html",
        "upload-payment.html",
        "parent-rules.html",
        "terms-rules.html",
        "admin-login.html",
        "admin-dashboard.html",
        "admin-students.html",
        "admin-parents.html",
        "admin-payments.html",
        "admin-announcements.html",
        "admin-rules.html",
        "admin-settings.html"
    ]);

    const SIMPLE_REPAIR_MAP = {
        "home.html": "index.html",
        "main.html": "index.html",
        "login.html": "parent-login.html",
        "register.html": "parent-register.html",
        "forgot-password.html": "parent-forgot-password.html",
        "profile.html": "parent-profile.html",
        "add-child.html": "add-student.html",
        "payment.html": "upload-payment.html",
        "admin.html": "admin-login.html",
        "students.html": "admin-students.html",
        "parents.html": "admin-parents.html",
        "payments.html": "admin-payments.html",
        "announcements.html": "admin-announcements.html",
        "settings.html": "admin-settings.html"
    };

    function currentPage() {
        const page = window.location.pathname.split("/").pop();
        return page || "index.html";
    }

    function pageContext() {
        const page = currentPage();

        if (page.startsWith("admin-")) return "admin";

        if (
            page.startsWith("parent-") ||
            page === "add-student.html" ||
            page === "upload-payment.html"
        ) {
            return "parent";
        }

        return "public";
    }

    function ensureGlobalStylesheet() {
        const localStyles = Array.from(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).filter((link) => {
            const href = link.getAttribute("href") || "";
            return /(^|\/)style\.css(?:[?#].*)?$/i.test(href);
        });

        /*
         * Keep the stylesheet already loaded by the HTML.
         * Step 56 changed its href again after DOMContentLoaded, forcing
         * the browser to download and apply CSS twice. That caused the
         * one-second unstyled flash during navigation.
         */
        if (localStyles.length === 0) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "/style.css";
            link.dataset.mutahusStep57Style = "true";
            document.head.appendChild(link);
            return;
        }

        localStyles[0].dataset.mutahusStep57Style = "true";

        /*
         * Remove only genuine duplicate style.css tags. Never replace
         * the href of the stylesheet that is already active.
         */
        localStyles.slice(1).forEach((link) => link.remove());
    }

    function normalizeLocalHref(rawHref) {
        if (!rawHref) return rawHref;

        const trimmed = rawHref.trim();

        if (
            trimmed.startsWith("#") ||
            trimmed.startsWith("mailto:") ||
            trimmed.startsWith("tel:") ||
            trimmed.startsWith("javascript:") ||
            trimmed.startsWith("data:")
        ) {
            return trimmed;
        }

        if (/^https?:\/\//i.test(trimmed)) {
            return trimmed;
        }

        let href = trimmed
            .replace(/\\/g, "/")
            .replace(/^\.\/+/, "")
            .replace(/^\/+/, "");

        const hashIndex = href.indexOf("#");
        const queryIndex = href.indexOf("?");

        let cutIndex = href.length;
        if (hashIndex >= 0) cutIndex = Math.min(cutIndex, hashIndex);
        if (queryIndex >= 0) cutIndex = Math.min(cutIndex, queryIndex);

        const pathPart = href.slice(0, cutIndex);
        const suffix = href.slice(cutIndex);
        const fileName = pathPart.split("/").pop().toLowerCase();

        if (SIMPLE_REPAIR_MAP[fileName]) {
            return SIMPLE_REPAIR_MAP[fileName] + suffix;
        }

        if (fileName === "dashboard.html") {
            return (
                pageContext() === "admin"
                    ? "admin-dashboard.html"
                    : "parent-dashboard.html"
            ) + suffix;
        }

        if (fileName === "rules.html") {
            if (pageContext() === "admin") return "admin-rules.html" + suffix;
            if (pageContext() === "parent") return "parent-rules.html" + suffix;
            return "terms-rules.html" + suffix;
        }

        return href;
    }

    function repairAnchor(anchor) {
        const originalHref = anchor.getAttribute("href");
        if (!originalHref) return;

        let repairedHref = normalizeLocalHref(originalHref);

        const publicSections = new Set([
            "#service",
            "#schools",
            "#process",
            "#payment",
            "#faq"
        ]);

        if (
            repairedHref &&
            publicSections.has(repairedHref.toLowerCase()) &&
            currentPage() !== "index.html"
        ) {
            repairedHref = "index.html" + repairedHref;
        }

        if (repairedHref && repairedHref !== originalHref) {
            anchor.setAttribute("href", repairedHref);
            anchor.dataset.mutahusRepairedLink = "true";
        }

        if (anchor.target === "_blank") {
            const rel = new Set(
                (anchor.getAttribute("rel") || "")
                    .split(/\s+/)
                    .filter(Boolean)
            );
            rel.add("noopener");
            rel.add("noreferrer");
            anchor.setAttribute("rel", Array.from(rel).join(" "));
        }

        const finalHref = anchor.getAttribute("href") || "";

        if (/^https?:\/\//i.test(finalHref)) return;
        if (
            finalHref.startsWith("#") ||
            finalHref.startsWith("mailto:") ||
            finalHref.startsWith("tel:") ||
            finalHref.startsWith("javascript:")
        ) {
            return;
        }

        const cleanFile = finalHref
            .split("#")[0]
            .split("?")[0]
            .split("/")
            .pop();

        if (cleanFile && cleanFile.endsWith(".html") && !KNOWN_PAGES.has(cleanFile)) {
            anchor.classList.add("mutahus-broken-link");
            anchor.title = "Please check this page link: " + cleanFile;
        } else {
            anchor.classList.remove("mutahus-broken-link");
        }
    }

    function setActiveNavigation() {
        const page = currentPage();
        const currentHash = window.location.hash;

        const navigationLinks = document.querySelectorAll([
            ".taskbar-links a",
            ".sidebar-menu a",
            ".side-links a",
            ".mobile-bottom-nav a",
            ".admin-mobile-bottom a"
        ].join(","));

        navigationLinks.forEach((link) => {
            link.classList.remove("mutahus-current-link");
            link.removeAttribute("aria-current");

            const href = link.getAttribute("href") || "";
            if (!href || /^https?:\/\//i.test(href)) return;

            const url = new URL(href, window.location.href);
            const linkPage = url.pathname.split("/").pop() || "index.html";

            const samePage = linkPage === page;

            let shouldActivate = false;

            if (samePage) {
                if (url.hash) {
                    shouldActivate =
                        Boolean(currentHash) &&
                        url.hash.toLowerCase() === currentHash.toLowerCase();
                } else {
                    shouldActivate = !currentHash;
                }
            }

            if (shouldActivate) {
                link.classList.add("mutahus-current-link");
                link.setAttribute("aria-current", "page");
            }
        });
    }

    function addPageIdentity() {
        const page = currentPage()
            .replace(/\.html$/i, "")
            .replace(/[^a-z0-9_-]+/gi, "-")
            .toLowerCase();

        document.body.classList.add("mutahus-page", "page-" + page);
        document.documentElement.dataset.mutahusPage = page;
    }

    function improveAccessibility() {
        const main = document.querySelector("main");

        if (main && !main.id) {
            main.id = "mainContent";
        }

        if (main && !document.querySelector(".mutahus-skip-link")) {
            const skip = document.createElement("a");
            skip.className = "mutahus-skip-link";
            skip.href = "#" + main.id;
            skip.textContent = "Skip to main content";
            document.body.insertBefore(skip, document.body.firstChild);
        }

        document.querySelectorAll("img").forEach((image, index) => {
            if (!image.hasAttribute("loading") && index > 0) {
                image.loading = "lazy";
            }

            if (!image.hasAttribute("decoding")) {
                image.decoding = "async";
            }
        });

        document.querySelectorAll(
            "nav button, .mobile-menu-btn, #mutahusMobileFeatureBtn, .modal-close-btn"
        ).forEach((button) => {
            if (!button.hasAttribute("type")) {
                button.type = "button";
            }
        });

        document.querySelectorAll("input").forEach((input) => {
            const key = (
                input.id +
                " " +
                input.name +
                " " +
                input.type
            ).toLowerCase();

            if (!input.hasAttribute("autocomplete")) {
                if (key.includes("email")) input.autocomplete = "email";
                else if (key.includes("phone") || key.includes("tel")) {
                    input.autocomplete = "tel";
                } else if (
                    key.includes("name") &&
                    !key.includes("username") &&
                    !key.includes("student")
                ) {
                    input.autocomplete = "name";
                } else if (key.includes("password")) {
                    input.autocomplete =
                        key.includes("new") || key.includes("confirm")
                            ? "new-password"
                            : "current-password";
                }
            }
        });
    }

    function repairAllLinks() {
        document.querySelectorAll("a[href]").forEach(repairAnchor);
        setActiveNavigation();
    }

    function runStep56() {
        ensureGlobalStylesheet();

        if (!document.body) return;

        addPageIdentity();
        repairAllLinks();
        improveAccessibility();
    }

    document.addEventListener("DOMContentLoaded", runStep56);
    window.addEventListener("load", runStep56);
    window.addEventListener("pageshow", runStep56);
    window.addEventListener("hashchange", setActiveNavigation);

    let mutationTimer = null;
    const observer = new MutationObserver(() => {
        window.clearTimeout(mutationTimer);
        mutationTimer = window.setTimeout(() => {
            repairAllLinks();
            improveAccessibility();
        }, 100);
    });

    document.addEventListener("DOMContentLoaded", () => {
        if (!document.body) return;

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });

    window.setTimeout(runStep56, 250);
    window.setTimeout(runStep56, 900);
    window.setTimeout(runStep56, 1800);
})();

// MUTAHUS_STEP56_LINK_INTEGRITY_AND_PAGE_POLISH


/* =========================================================
   MUTAHUS_STEP58_NO_FLICKER_NATIVE_FLOW

   Keeps Step 57's unified public mobile taskbar and no-reload
   stylesheet fix, but removes the double transition system.

   Chrome receives one native cross-document transition.
   Other browsers use normal navigation with no artificial overlay.
   ========================================================= */
(function () {
    "use strict";

    if (window.__mutahusStep58Loaded) return;
    window.__mutahusStep58Loaded = true;

    const PREFETCH_LIMIT = 12;

    function isInternalHtmlLink(anchor) {
        if (!anchor || !anchor.href) return false;

        try {
            const url = new URL(anchor.href, window.location.href);

            if (url.origin !== window.location.origin) return false;
            if (url.pathname === window.location.pathname) return false;

            return (
                url.pathname.endsWith(".html") ||
                url.pathname.endsWith("/")
            );
        } catch (error) {
            return false;
        }
    }

    function prefetchPage(href) {
        if (!href) return;

        try {
            const url = new URL(href, window.location.href);
            url.hash = "";

            if (url.origin !== window.location.origin) return;
            if (
                document.querySelector(
                    `link[rel="prefetch"][href="${url.href}"]`
                )
            ) {
                return;
            }

            const link = document.createElement("link");
            link.rel = "prefetch";
            link.href = url.href;
            link.as = "document";
            document.head.appendChild(link);
        } catch (error) {
            // Ignore malformed links.
        }
    }

    function prefetchVisibleNavigation() {
        const links = Array.from(
            document.querySelectorAll(
                [
                    ".taskbar-links a[href]",
                    ".sidebar-menu a[href]",
                    ".side-links a[href]",
                    ".mobile-bottom-nav a[href]",
                    ".admin-mobile-bottom a[href]",
                    "#mutahusMobileFeaturePanel a[href]"
                ].join(",")
            )
        )
            .filter(isInternalHtmlLink)
            .slice(0, PREFETCH_LIMIT);

        links.forEach((link) => prefetchPage(link.href));
    }

    function installIntentPrefetch() {
        document.addEventListener(
            "pointerenter",
            function (event) {
                const anchor = event.target.closest("a[href]");
                if (isInternalHtmlLink(anchor)) {
                    prefetchPage(anchor.href);
                }
            },
            true
        );

        document.addEventListener(
            "touchstart",
            function (event) {
                const anchor = event.target.closest("a[href]");
                if (isInternalHtmlLink(anchor)) {
                    prefetchPage(anchor.href);
                }
            },
            {
                capture: true,
                passive: true
            }
        );
    }

    function removeOldTransitionArtifacts() {
        document
            .querySelectorAll(
                "#mutahusStep57TransitionCover, " +
                ".mutahus-step57-transition-cover"
            )
            .forEach((element) => element.remove());

        document.body.classList.remove(
            "mutahus-step57-page-leaving"
        );
    }

    function runStep58() {
        removeOldTransitionArtifacts();

        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(prefetchVisibleNavigation, {
                timeout: 1400
            });
        } else {
            window.setTimeout(prefetchVisibleNavigation, 500);
        }
    }

    document.addEventListener("DOMContentLoaded", runStep58);
    window.addEventListener("load", runStep58);
    window.addEventListener("pageshow", runStep58);

    installIntentPrefetch();

    window.setTimeout(runStep58, 250);
    window.setTimeout(runStep58, 900);
})();

// MUTAHUS_STEP58_NO_FLICKER_NATIVE_FLOW



/* =========================================================
   MUTHAQUS_STEP61_DOWNLOADABLE_INVOICE
   ========================================================= */

function mutahusSafeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function mutahusPdfAscii(value) {
    return String(value ?? "")
        .normalize("NFKD")
        .replace(/[^\x20-\x7E]/g, "")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
}

function mutahusPdfWrap(value, maxLength = 68) {
    const words = String(value ?? "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";

    words.forEach(word => {
        const candidate = line ? `${line} ${word}` : word;

        if (candidate.length > maxLength && line) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    });

    if (line) lines.push(line);
    return lines.length ? lines : [""];
}

function mutahusPdfText(x, y, size, value, bold = false) {
    const font = bold ? "F2" : "F1";
    return `BT /${font} ${size} Tf 0.10 0.20 0.32 rg ${x} ${y} Td (${mutahusPdfAscii(value)}) Tj ET\n`;
}

function mutahusBuildInvoicePdf(payment) {
    const invoiceNumber = `MGE-INV-${String(payment.id || Date.now())
        .replace(/[^a-z0-9]/gi, "")
        .slice(-10)
        .toUpperCase()}`;

    const issueDate =
        payment.reviewedAt ||
        payment.updatedAt ||
        payment.createdAt ||
        new Date().toLocaleDateString("en-GB");

    const studentName =
        payment.studentName ||
        payment.studentNames ||
        "All registered children";

    const amount = Number(payment.amount || 0).toFixed(2);
    const description = `School van service fee - ${payment.month || "Monthly payment"}`;

    let stream = "";

    // Header background and accent.
    stream += "0.06 0.24 0.41 rg 0 760 595 82 re f\n";
    stream += "0.09 0.64 0.29 rg 0 750 595 10 re f\n";
    stream += "1 1 1 rg BT /F2 16 Tf 42 798 Td (MUTHAQUS GLOBAL ENTERPRISE) Tj ET\n";
    stream += "0.88 0.94 1 rg BT /F1 10 Tf 42 780 Td (Reliable School Van Service) Tj ET\n";
    stream += "1 1 1 rg BT /F2 19 Tf 430 790 Td (INVOICE) Tj ET\n";

    stream += mutahusPdfText(42, 720, 10, "Invoice Number", true);
    stream += mutahusPdfText(150, 720, 10, invoiceNumber);
    stream += mutahusPdfText(42, 701, 10, "Issue Date", true);
    stream += mutahusPdfText(150, 701, 10, issueDate);
    stream += mutahusPdfText(42, 682, 10, "Payment ID", true);
    stream += mutahusPdfText(150, 682, 10, payment.id || "-");
    stream += mutahusPdfText(360, 720, 10, "Status", true);
    stream += "0.09 0.64 0.29 rg 430 704 112 28 re f\n";
    stream += "1 1 1 rg BT /F2 12 Tf 466 713 Td (PAID) Tj ET\n";

    // Bill to panel.
    stream += "0.95 0.98 1 rg 42 574 511 82 re f\n";
    stream += mutahusPdfText(55, 636, 11, "BILL TO", true);
    stream += mutahusPdfText(55, 616, 12, payment.parentName || "Parent");
    stream += mutahusPdfText(55, 598, 9, payment.parentPhone || "-");
    stream += mutahusPdfText(270, 598, 9, payment.parentEmail || "-");

    // Item table.
    stream += "0.06 0.24 0.41 rg 42 528 511 34 re f\n";
    stream += "1 1 1 rg BT /F2 10 Tf 55 540 Td (DESCRIPTION) Tj ET\n";
    stream += "1 1 1 rg BT /F2 10 Tf 420 540 Td (AMOUNT) Tj ET\n";
    stream += "0.80 0.87 0.94 RG 42 478 511 50 re S\n";
    stream += mutahusPdfText(55, 506, 10, description);
    stream += mutahusPdfText(55, 488, 9, `Student: ${studentName}`);
    stream += mutahusPdfText(438, 497, 11, `RM ${amount}`, true);

    stream += "0.06 0.24 0.41 rg 350 424 203 42 re f\n";
    stream += "1 1 1 rg BT /F2 12 Tf 367 440 Td (TOTAL PAID) Tj ET\n";
    stream += `1 1 1 rg BT /F2 14 Tf 470 440 Td (RM ${mutahusPdfAscii(amount)}) Tj ET\n`;

    let noteY = 390;
    stream += mutahusPdfText(42, noteY, 11, "PAYMENT DETAILS", true);
    noteY -= 22;
    stream += mutahusPdfText(42, noteY, 9, `Payment Month: ${payment.month || "-"}`);
    noteY -= 17;
    stream += mutahusPdfText(42, noteY, 9, `Date Paid: ${payment.datePaid || "-"}`);
    noteY -= 17;
    stream += mutahusPdfText(42, noteY, 9, `Receipt: ${payment.receiptName || "Uploaded receipt"}`);
    noteY -= 24;

    stream += mutahusPdfText(42, noteY, 11, "NOTE", true);
    noteY -= 18;

    mutahusPdfWrap(
        payment.note || "Thank you. This invoice confirms that the monthly school van service payment has been approved.",
        78
    ).slice(0, 5).forEach(line => {
        stream += mutahusPdfText(42, noteY, 9, line);
        noteY -= 15;
    });

    stream += "0.82 0.87 0.92 RG 42 112 511 0 re S\n";
    stream += mutahusPdfText(42, 91, 9, "MUTHAQUS GLOBAL ENTERPRISE | School Van Service");
    stream += mutahusPdfText(42, 75, 9, "Contact: 017-8078271");
    stream += mutahusPdfText(42, 50, 8, "This invoice was generated electronically and does not require a signature.");
    stream += mutahusPdfText(455, 50, 8, "Page 1 of 1");

    const objects = [];
    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
    objects[3] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>";
    objects[4] = `<< /Length ${stream.length} >>\nstream\n${stream}endstream`;
    objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    objects[6] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    for (let index = 1; index <= 6; index += 1) {
        offsets[index] = pdf.length;
        pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
    }

    const xrefOffset = pdf.length;
    pdf += "xref\n0 7\n";
    pdf += "0000000000 65535 f \n";

    for (let index = 1; index <= 6; index += 1) {
        pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }

    pdf += "trailer\n<< /Size 7 /Root 1 0 R >>\n";
    pdf += `startxref\n${xrefOffset}\n%%EOF`;

    return {
        content: pdf,
        invoiceNumber
    };
}

function downloadPaymentInvoice(paymentId, source = "parent") {
    const map =
        source === "admin"
            ? window.adminPaymentInvoiceMap || window.adminPaymentReceiptMap || {}
            : window.parentPaymentInvoiceMap || window.parentPaymentReceiptMap || {};

    const payment = map[paymentId];

    if (!payment) {
        alert("Payment record not found. Please refresh the page.");
        return;
    }

    if (payment.status !== "Paid") {
        alert("PDF invoice is available after admin approves the payment.");
        return;
    }

    try {
        const pdf = mutahusBuildInvoicePdf(payment);
        const blob = new Blob([pdf.content], {
            type: "application/pdf"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const cleanMonth = String(payment.month || "Payment")
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-|-$/g, "");

        link.href = url;
        link.download = `${pdf.invoiceNumber}-${cleanMonth || "Payment"}.pdf`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (error) {
        alert("Invoice generation error: " + error.message);
    }
}

// MUTHAQUS_STEP61_DOWNLOADABLE_INVOICE



/* =========================================================
   MUTHAQUS_STEP61_GLOBAL_REBRAND
   Changes the visible company name across every page and
   dynamically created modal without renaming internal code.
   ========================================================= */
(function () {
    "use strict";

    if (window.__muthaqusGlobalRebrandLoaded) return;
    window.__muthaqusGlobalRebrandLoaded = true;

    const COMPANY_NAME = "MUTHAQUS GLOBAL ENTERPRISE";
    const OLD_COMPANY_PATTERN = new RegExp(["mutahus", "global"].join("\\s+"), "gi");
    const ATTRIBUTE_NAMES = [
        "title",
        "aria-label",
        "alt",
        "placeholder",
        "content"
    ];

    function replaceCompanyName(value) {
        return typeof value === "string"
            ? value.replace(OLD_COMPANY_PATTERN, COMPANY_NAME)
            : value;
    }

    function updateElementAttributes(element) {
        if (!(element instanceof Element)) return;

        ATTRIBUTE_NAMES.forEach(attributeName => {
            if (!element.hasAttribute(attributeName)) return;

            const currentValue = element.getAttribute(attributeName);
            const updatedValue = replaceCompanyName(currentValue);

            if (updatedValue !== currentValue) {
                element.setAttribute(attributeName, updatedValue);
            }
        });
    }

    function updateBrandingWithin(root) {
        if (!root) return;

        if (root.nodeType === Node.TEXT_NODE) {
            const parentTag = root.parentElement?.tagName || "";

            if (!["SCRIPT", "STYLE", "NOSCRIPT"].includes(parentTag)) {
                const updatedValue = replaceCompanyName(root.nodeValue);

                if (updatedValue !== root.nodeValue) {
                    root.nodeValue = updatedValue;
                }
            }

            return;
        }

        if (root.nodeType !== Node.ELEMENT_NODE && root !== document) {
            return;
        }

        if (root instanceof Element) {
            updateElementAttributes(root);
        }

        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        );

        let node;

        while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE) {
                const parentTag = node.parentElement?.tagName || "";

                if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(parentTag)) {
                    continue;
                }

                const updatedValue = replaceCompanyName(node.nodeValue);

                if (updatedValue !== node.nodeValue) {
                    node.nodeValue = updatedValue;
                }
            } else {
                updateElementAttributes(node);
            }
        }

        document.title = replaceCompanyName(document.title);
    }

    function applyGlobalCompanyBrand() {
        updateBrandingWithin(document);
    }

    document.addEventListener("DOMContentLoaded", applyGlobalCompanyBrand);
    window.addEventListener("load", applyGlobalCompanyBrand);
    window.addEventListener("pageshow", applyGlobalCompanyBrand);

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === "characterData") {
                updateBrandingWithin(mutation.target);
                return;
            }

            mutation.addedNodes.forEach(updateBrandingWithin);

            if (
                mutation.type === "attributes" &&
                mutation.target instanceof Element
            ) {
                updateElementAttributes(mutation.target);
            }
        });

        document.title = replaceCompanyName(document.title);
    });

    document.addEventListener("DOMContentLoaded", () => {
        if (!document.body) return;

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ATTRIBUTE_NAMES
        });
    });

    window.setTimeout(applyGlobalCompanyBrand, 300);
    window.setTimeout(applyGlobalCompanyBrand, 1000);
})();

// MUTHAQUS_STEP61_GLOBAL_REBRAND

// MUTHAQUS_STEP62_ADMIN_MOBILE_RECORD_CARDS



/* =========================================================
   MUTHAQUS_STEP63_ADMIN_LOGIN_PDF_RECENT_PAYMENT_POLISH
   ========================================================= */

(function () {
    "use strict";

    if (window.__muthaqusStep63Loaded) return;
    window.__muthaqusStep63Loaded = true;

    let currentReceiptBlobUrl = "";
    let currentReceiptPdf = null;

    function safeReceiptName(value) {
        const name = String(value || "payment-receipt.pdf").trim();

        if (/\.pdf$/i.test(name)) return name;

        return name.replace(/\.[^.]+$/, "") + ".pdf";
    }

    function dataUrlToBlob(dataUrl) {
        const parts = String(dataUrl || "").split(",");

        if (parts.length < 2) {
            throw new Error("Invalid receipt file data.");
        }

        const header = parts[0];
        const data = parts.slice(1).join(",");
        const mimeMatch = header.match(/^data:([^;,]+)/i);
        const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
        const isBase64 = /;base64/i.test(header);

        let bytes;

        if (isBase64) {
            const binary = atob(data);
            bytes = new Uint8Array(binary.length);

            for (let index = 0; index < binary.length; index += 1) {
                bytes[index] = binary.charCodeAt(index);
            }
        } else {
            const decoded = decodeURIComponent(data);
            bytes = new TextEncoder().encode(decoded);
        }

        return new Blob([bytes], {
            type: mimeType
        });
    }

    function releaseReceiptBlobUrl() {
        if (currentReceiptBlobUrl) {
            URL.revokeObjectURL(currentReceiptBlobUrl);
            currentReceiptBlobUrl = "";
        }
    }

    function openCurrentReceiptPdf() {
        if (!currentReceiptPdf) {
            alert("PDF receipt is not ready. Please open the receipt again.");
            return;
        }

        try {
            const url =
                currentReceiptBlobUrl ||
                URL.createObjectURL(currentReceiptPdf.blob);

            currentReceiptBlobUrl = url;

            const opened = window.open(url, "_blank", "noopener");

            if (!opened) {
                /*
                 * Android WebView often blocks a new tab.
                 * Opening in the current view gives the device PDF viewer
                 * a chance to handle the Blob URL.
                 */
                window.location.assign(url);
            }
        } catch (error) {
            alert("Unable to open this PDF. Please use Download PDF instead.");
        }
    }

    function downloadCurrentReceiptPdf() {
        if (!currentReceiptPdf) {
            alert("PDF receipt is not ready. Please open the receipt again.");
            return;
        }

        try {
            const url =
                currentReceiptBlobUrl ||
                URL.createObjectURL(currentReceiptPdf.blob);

            currentReceiptBlobUrl = url;

            const link = document.createElement("a");
            link.href = url;
            link.download = safeReceiptName(currentReceiptPdf.name);
            link.rel = "noopener";
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Unable to download PDF receipt: " + error.message);
        }
    }

    window.closeReceiptModal = function () {
        document.getElementById("receiptPreviewModal")?.remove();
        document.body.classList.remove("muthaqus-receipt-open");
        document.body.classList.remove("mutahus-receipt-open");
        document.body.style.overflow = "";

        currentReceiptPdf = null;

        window.setTimeout(releaseReceiptBlobUrl, 400);
    };

    window.showReceiptInfo = function (receiptName, note, receiptDataUrl) {
        closeReceiptModal();

        const name = receiptName || "Payment receipt";
        const paymentNote = note || "No additional note";

        if (!receiptDataUrl || !receiptDataUrl.startsWith("data:")) {
            alert(
                "Receipt file: " +
                    name +
                    "\nPayment note: " +
                    paymentNote +
                    "\n\nThe actual receipt file is not available for this older record."
            );
            return;
        }

        const isPdf =
            receiptDataUrl.startsWith("data:application/pdf") ||
            /\.pdf$/i.test(name);

        let pdfBlobUrl = "";

        if (isPdf) {
            try {
                const blob = dataUrlToBlob(receiptDataUrl);
                pdfBlobUrl = URL.createObjectURL(blob);
                currentReceiptBlobUrl = pdfBlobUrl;
                currentReceiptPdf = {
                    name,
                    blob
                };
            } catch (error) {
                alert("Unable to prepare this PDF receipt: " + error.message);
                return;
            }
        }

        const isMobile = window.matchMedia("(max-width: 860px)").matches;
        const modal = document.createElement("div");

        modal.id = "receiptPreviewModal";
        modal.className = "muthaqus-receipt-modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-label", "Payment receipt preview");

        const pdfContent = isMobile
            ? `
                <div class="muthaqus-mobile-pdf-card">
                    <div class="muthaqus-pdf-icon">PDF</div>
                    <h3>PDF Receipt Ready</h3>
                    <p>
                        Some Android browsers and WebViews cannot display a PDF
                        inside the page. Open it using your phone PDF viewer or
                        download it directly.
                    </p>

                    <div class="muthaqus-pdf-actions">
                        <button type="button" class="btn btn-primary-pro" data-pdf-open>
                            Open PDF
                        </button>

                        <button type="button" class="btn btn-outline-pro" data-pdf-download>
                            Download PDF
                        </button>
                    </div>
                </div>
            `
            : `
                <object
                    class="muthaqus-receipt-pdf-object"
                    data="${pdfBlobUrl}"
                    type="application/pdf"
                >
                    <div class="muthaqus-mobile-pdf-card">
                        <div class="muthaqus-pdf-icon">PDF</div>
                        <h3>PDF preview is unavailable</h3>
                        <p>Open or download the PDF receipt.</p>

                        <div class="muthaqus-pdf-actions">
                            <button type="button" class="btn btn-primary-pro" data-pdf-open>
                                Open PDF
                            </button>

                            <button type="button" class="btn btn-outline-pro" data-pdf-download>
                                Download PDF
                            </button>
                        </div>
                    </div>
                </object>
            `;

        modal.innerHTML = `
            <div class="muthaqus-receipt-card">
                <div class="muthaqus-receipt-header">
                    <div class="muthaqus-receipt-heading">
                        <span class="muthaqus-receipt-brand-icon">🚐</span>

                        <div>
                            <strong>MUTHAQUS GLOBAL ENTERPRISE</strong>
                            <h2>Payment Receipt</h2>
                            <p>${mutahusEscapeHtml(name)}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="muthaqus-receipt-close"
                        aria-label="Close receipt"
                    >
                        ×
                    </button>
                </div>

                <div class="muthaqus-receipt-note">
                    <span>Note</span>
                    <p>${mutahusEscapeHtml(paymentNote)}</p>
                </div>

                <div class="muthaqus-receipt-body">
                    ${
                        isPdf
                            ? pdfContent
                            : `
                                <img
                                    class="muthaqus-receipt-image"
                                    src="${receiptDataUrl}"
                                    alt="Payment receipt"
                                >
                            `
                    }
                </div>
            </div>
        `;

        modal
            .querySelector(".muthaqus-receipt-close")
            ?.addEventListener("click", closeReceiptModal);

        modal
            .querySelectorAll("[data-pdf-open]")
            .forEach(button => {
                button.addEventListener("click", openCurrentReceiptPdf);
            });

        modal
            .querySelectorAll("[data-pdf-download]")
            .forEach(button => {
                button.addEventListener("click", downloadCurrentReceiptPdf);
            });

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeReceiptModal();
            }
        });

        document.body.appendChild(modal);
        document.body.classList.add("muthaqus-receipt-open");

        const closeButton = modal.querySelector(".muthaqus-receipt-close");
        closeButton?.focus();
    };

    window.loadAdminDashboard = async function () {
        const recentTable = document.getElementById("recentPaymentsTable");

        if (recentTable) {
            recentTable.innerHTML = `
                <tr class="admin-recent-empty-row">
                    <td colspan="5" class="empty-row">
                        Loading dashboard from MongoDB...
                    </td>
                </tr>
            `;
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

            const values = {
                totalParents: summary.totalParents || 0,
                totalStudents: summary.totalStudents || 0,
                morningCount: summary.morningCount || 0,
                afternoonCount: summary.afternoonCount || 0,
                pendingPayments: summary.pendingPayments || 0,
                totalPaidMonth: "RM" + Number(summary.totalPaidMonth || 0).toFixed(2)
            };

            Object.entries(values).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.innerText = value;
            });

            if (!recentTable) return;

            recentTable.innerHTML = "";

            if (recentPayments.length === 0) {
                recentTable.innerHTML = `
                    <tr class="admin-recent-empty-row">
                        <td colspan="5" class="empty-row">
                            <div class="mutahus-empty-state">
                                <span>💳</span>
                                <strong>No payment submitted yet.</strong>
                                <small>New parent payment submissions will appear here.</small>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            recentPayments.forEach(payment => {
                const badgeClass = getPaymentBadgeClass(
                    payment.status || "Pending"
                );

                const parentInitial = String(
                    payment.parentName || "P"
                )
                    .trim()
                    .charAt(0)
                    .toUpperCase();

                recentTable.innerHTML += `
                    <tr class="admin-recent-payment-row">
                        <td data-label="Parent">
                            <div class="recent-payment-person">
                                <span class="recent-payment-avatar">
                                    ${parentInitial}
                                </span>

                                <div>
                                    <strong>
                                        ${mutahusEscapeHtml(payment.parentName || "-")}
                                    </strong>
                                    <small>
                                        ${mutahusEscapeHtml(payment.parentPhone || "")}
                                    </small>
                                </div>
                            </div>
                        </td>

                        <td data-label="Student">
                            <strong>
                                ${mutahusEscapeHtml(payment.studentName || "All registered children")}
                            </strong>
                        </td>

                        <td data-label="Month">
                            ${mutahusEscapeHtml(payment.month || "-")}
                        </td>

                        <td data-label="Amount">
                            <span class="recent-payment-amount">
                                RM${Number(payment.amount || 0).toFixed(2)}
                            </span>
                        </td>

                        <td data-label="Status">
                            <span class="badge ${badgeClass}">
                                ${mutahusEscapeHtml(payment.status || "Pending")}
                            </span>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            alert("Admin dashboard error: " + error.message);

            if (recentTable) {
                recentTable.innerHTML = `
                    <tr class="admin-recent-empty-row">
                        <td colspan="5" class="empty-row">
                            Failed to load dashboard.
                        </td>
                    </tr>
                `;
            }
        }
    };
})();

// MUTHAQUS_STEP63_ADMIN_LOGIN_PDF_RECENT_PAYMENT_POLISH


/* MUTHAQUS_STEP64_PAYMENT_ANNOUNCEMENT_RULES_POLISH */
function renderAdminPaymentRecords(){
 const table=document.getElementById("adminPaymentsTable");if(!table)return;
 const q=String(document.getElementById("paymentRecordSearch")?.value||"").trim().toLowerCase();const status=document.getElementById("paymentRecordStatus")?.value||"";
 const rows=(window.adminPaymentsData||[]).filter(p=>{const text=[p.parentName,p.parentPhone,p.studentName,p.month,p.receiptName,p.status].join(" ").toLowerCase();return(!q||text.includes(q))&&(!status||p.status===status);});
 const count=document.getElementById("paymentVisibleCount");if(count)count.innerText=rows.length;table.innerHTML="";
 if(!rows.length){table.innerHTML='<tr class="s64-empty-row"><td colspan="7"><div class="s64-empty-card"><span>💳</span><strong>No payment record matches</strong><p>Try another search or status.</p></div></td></tr>';return;}
 rows.forEach(p=>{const bc=getPaymentBadgeClass(p.status);const paid=p.status==="Paid";const rejected=p.status==="Rejected";const initial=String(p.parentName||"P").trim().charAt(0).toUpperCase();const invoice=paid?`<button class="small-btn invoice-admin-btn" type="button" onclick="downloadPaymentInvoice('${p.id}','admin')">PDF Invoice</button>`:"";table.innerHTML+=`<tr class="s64-payment-row"><td data-label="Parent"><div class="s64-person"><span>${initial}</span><div><strong>${mutahusSafeHtml(p.parentName||"-")}</strong><small>${mutahusSafeHtml(p.parentPhone||"")}</small></div></div></td><td data-label="Student"><strong>${mutahusSafeHtml(p.studentName||"All registered children")}</strong></td><td data-label="Month">${mutahusSafeHtml(p.month||"-")}</td><td data-label="Amount"><span class="s64-amount">RM${Number(p.amount||0).toFixed(2)}</span></td><td data-label="Receipt"><button class="receipt-button" type="button" onclick="viewAdminReceipt('${p.id}')">View Receipt</button><small class="s64-file">${mutahusSafeHtml(p.receiptName||"No receipt file")}</small></td><td data-label="Status"><span class="badge ${bc}">${mutahusSafeHtml(p.status||"Pending")}</span></td><td data-label="Actions"><div class="s64-pay-actions"><button class="small-btn edit payment-action-btn" data-id="${p.id}" data-status="Paid" ${paid?"disabled":""}>Approve</button><button class="small-btn danger payment-action-btn" data-id="${p.id}" data-status="Rejected" ${rejected?"disabled":""}>Reject</button><button class="small-btn warning payment-action-btn" data-id="${p.id}" data-status="Pending" ${p.status==="Pending"?"disabled":""}>Pending</button>${invoice}</div></td></tr>`;});connectPaymentButtons();
}
function resetPaymentRecordFilters(){const q=document.getElementById("paymentRecordSearch"),s=document.getElementById("paymentRecordStatus");if(q)q.value="";if(s)s.value="";renderAdminPaymentRecords();}
function updateAnnouncementDraftPreview(){const box=document.getElementById("announcementDraftPreview");if(!box)return;const title=document.getElementById("announcementTitle")?.value.trim()||"Announcement title";const type=document.getElementById("announcementType")?.value||"General Announcement";const priority=document.getElementById("announcementPriority")?.value||"Normal";const msg=document.getElementById("announcementMessage")?.value.trim()||"Your announcement message will appear here.";const cc=getAnnouncementCategoryBadgeClass(type);const pc=priority==="Urgent"?"rejected":priority==="Important"?"pending":"morning";box.innerHTML=`<div class="s64-parent-preview ${priority.toLowerCase()}"><div class="s64-preview-top"><span class="badge ${cc}">${mutahusSafeHtml(type)}</span><span class="badge ${pc}">${mutahusSafeHtml(priority)}</span></div><h3>${mutahusSafeHtml(title)}</h3><p>${mutahusSafeHtml(msg)}</p></div>`;}
document.addEventListener("DOMContentLoaded",()=>{["announcementTitle","announcementType","announcementPriority","announcementMessage"].forEach(id=>{document.getElementById(id)?.addEventListener("input",updateAnnouncementDraftPreview);document.getElementById(id)?.addEventListener("change",updateAnnouncementDraftPreview);});updateAnnouncementDraftPreview();});

/* =========================================================
   MUTHAQUS_STEP66_REMOVE_DUPLICATE_PAYMENT_FILTER
   Final protection against the obsolete left-side payment filter.
   ========================================================= */
(function () {
    "use strict";

    if (window.__muthaqusStep66Loaded) return;
    window.__muthaqusStep66Loaded = true;

    function isPaymentPage() {
        return (window.location.pathname.split("/").pop() || "") === "admin-payments.html";
    }

    function removeDuplicatePaymentFilter() {
        if (!isPaymentPage()) return;

        document.querySelectorAll("#paymentFilterPanel").forEach(panel => {
            panel.remove();
        });

        document.body.classList.add("step66-payment-clean-layout");
    }

    document.addEventListener("DOMContentLoaded", removeDuplicatePaymentFilter);
    window.addEventListener("load", removeDuplicatePaymentFilter);
    window.addEventListener("pageshow", removeDuplicatePaymentFilter);

    const observer = new MutationObserver(removeDuplicatePaymentFilter);

    document.addEventListener("DOMContentLoaded", () => {
        if (!document.body || !isPaymentPage()) return;

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });

    window.setTimeout(removeDuplicatePaymentFilter, 200);
    window.setTimeout(removeDuplicatePaymentFilter, 700);
    window.setTimeout(removeDuplicatePaymentFilter, 1500);
})();

// MUTHAQUS_STEP66_REMOVE_DUPLICATE_PAYMENT_FILTER

