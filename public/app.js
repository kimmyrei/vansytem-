const MUTHAQUS_ADMIN_THEME_KEY =
    "muthaqus_admin_theme";

const MUTHAQUS_PARENT_THEME_KEY =
    "muthaqus_parent_theme";

const MUTHAQUS_OLD_THEME_KEY =
    "muthaqus_global_theme";

function getMuthaqusPortalScope() {
    const buttonScope =
        document
            .querySelector(
                "[data-muthaqus-theme-toggle]" +
                "[data-theme-scope]"
            )
            ?.getAttribute(
                "data-theme-scope"
            );

    if (
        buttonScope === "admin" ||
        buttonScope === "parent"
    ) {
        return buttonScope;
    }

    const page = String(
        window.location.pathname
            .split("/")
            .pop() || ""
    )
        .split("?")[0]
        .toLowerCase();

    const bodyClass =
        String(
            document.body?.className || ""
        ).toLowerCase();

    const adminPage =
        page.startsWith("admin-") ||
        page === "admin-login.html" ||
        page === "admin-maintenance.html" ||
        page === "admin-analytics.html" ||
        bodyClass.includes("admin-") ||
        bodyClass.includes("admin ");

    if (adminPage) {
        return "admin";
    }

    const parentPageNames = new Set([
        "parent-dashboard.html",
        "parent-profile.html",
        "parent-rules.html",
        "parent-login.html",
        "parent-register.html",
        "add-student.html",
        "upload-payment.html",
        "payment-history.html"
    ]);

    const parentPage =
        page.startsWith("parent-") ||
        parentPageNames.has(page) ||
        bodyClass.includes("parent-") ||
        bodyClass.includes("parent ");

    if (parentPage) {
        return "parent";
    }

    return "public";
}

function getMuthaqusThemeStorageKey(
    scope = getMuthaqusPortalScope()
) {
    if (scope === "admin") {
        return MUTHAQUS_ADMIN_THEME_KEY;
    }

    if (scope === "parent") {
        return MUTHAQUS_PARENT_THEME_KEY;
    }

    return "";
}

function getMuthaqusTheme(
    scope = getMuthaqusPortalScope()
) {
    const key =
        getMuthaqusThemeStorageKey(
            scope
        );

    if (!key) {
        return "light";
    }

    try {
        return localStorage.getItem(key) ===
            "dark"
            ? "dark"
            : "light";
    } catch (error) {
        return "light";
    }
}

function applyMuthaqusTheme(
    theme,
    options = {}
) {
    const scope =
        options.scope ||
        getMuthaqusPortalScope();

    const selected =
        theme === "dark"
            ? "dark"
            : "light";

    const root =
        document.documentElement;

    if (options.animate) {
        root.classList.add(
            "muthaqus-theme-changing"
        );

        window.setTimeout(() => {
            root.classList.remove(
                "muthaqus-theme-changing"
            );
        }, 320);
    }

    root.setAttribute(
        "data-theme",
        selected
    );

    root.setAttribute(
        "data-theme-scope",
        scope
    );

    root.style.colorScheme =
        selected;

    document.body?.setAttribute(
        "data-theme",
        selected
    );

    document.body?.setAttribute(
        "data-theme-scope",
        scope
    );

    const themeMeta =
        document.querySelector(
            'meta[name="theme-color"]'
        );

    if (themeMeta) {
        themeMeta.setAttribute(
            "content",
            selected === "dark"
                ? "#07111f"
                : "#143f73"
        );
    }

    syncMuthaqusThemeControls();
}

function resolveMuthaqusThemeScope(
    source
) {
    if (
        source === "admin" ||
        source === "parent"
    ) {
        return source;
    }

    if (
        source &&
        typeof source.getAttribute ===
            "function"
    ) {
        const explicit =
            source.getAttribute(
                "data-theme-scope"
            );

        if (
            explicit === "admin" ||
            explicit === "parent"
        ) {
            return explicit;
        }
    }

    return getMuthaqusPortalScope();
}

function setMuthaqusTheme(
    theme,
    scopeSource
) {
    const scope =
        resolveMuthaqusThemeScope(
            scopeSource
        );

    const key =
        getMuthaqusThemeStorageKey(
            scope
        );

    if (!key) {
        return;
    }

    const selected =
        theme === "dark"
            ? "dark"
            : "light";

    try {
        localStorage.setItem(
            key,
            selected
        );
    } catch (error) {
        console.warn(
            "Theme preference could not be saved:",
            error.message
        );
    }

    if (
        scope ===
        getMuthaqusPortalScope()
    ) {
        applyMuthaqusTheme(
            selected,
            {
                animate: true,
                scope
            }
        );
    }

    syncMuthaqusThemeControls();
}

function toggleMuthaqusTheme(
    source
) {
    const scope =
        resolveMuthaqusThemeScope(
            source
        );

    setMuthaqusTheme(
        getMuthaqusTheme(scope) ===
            "dark"
            ? "light"
            : "dark",
        scope
    );
}

function syncMuthaqusThemeControls() {
    document
        .querySelectorAll(
            "[data-muthaqus-theme-toggle]"
        )
        .forEach(button => {
            const scope =
                resolveMuthaqusThemeScope(
                    button
                );

            const isDark =
                getMuthaqusTheme(scope) ===
                "dark";

            button.classList.toggle(
                "is-dark",
                isDark
            );

            button.setAttribute(
                "aria-pressed",
                String(isDark)
            );

            const icon =
                button.querySelector(
                    "[data-theme-icon]"
                );

            const title =
                button.querySelector(
                    "[data-theme-title]"
                );

            const description =
                button.querySelector(
                    "[data-theme-description]"
                );

            const state =
                button.querySelector(
                    "[data-theme-state]"
                );

            if (icon) {
                icon.innerText =
                    isDark ? "☀️" : "🌙";
            }

            if (title) {
                title.innerText =
                    isDark
                        ? "Switch to Light Mode"
                        : "Switch to Dark Mode";
            }

            if (description) {
                description.innerText =
                    isDark
                        ? (
                            scope === "admin"
                                ? "Dark mode is active on Admin Control pages."
                                : "Dark mode is active on Parent Portal pages."
                        )
                        : (
                            scope === "admin"
                                ? "Use dark mode only across Admin Control."
                                : "Use dark mode only across Parent Portal."
                        );
            }

            if (state) {
                state.innerText =
                    isDark ? "On" : "Off";
            }
        });
}

(function prepareSeparateMuthaqusThemes() {
    try {
        /*
         * Remove the old shared preference once.
         * Admin and Parent now keep independent settings.
         */
        localStorage.removeItem(
            MUTHAQUS_OLD_THEME_KEY
        );
    } catch (error) {
        console.warn(
            "Old theme preference could not be cleared:",
            error.message
        );
    }

    const scope =
        getMuthaqusPortalScope();

    applyMuthaqusTheme(
        getMuthaqusTheme(scope),
        {
            scope
        }
    );
})();

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const scope =
            getMuthaqusPortalScope();

        applyMuthaqusTheme(
            getMuthaqusTheme(scope),
            {
                scope
            }
        );
    }
);

window.addEventListener(
    "storage",
    event => {
        const scope =
            getMuthaqusPortalScope();

        const activeKey =
            getMuthaqusThemeStorageKey(
                scope
            );

        if (
            activeKey &&
            event.key === activeKey
        ) {
            applyMuthaqusTheme(
                event.newValue === "dark"
                    ? "dark"
                    : "light",
                {
                    scope
                }
            );
        }

        syncMuthaqusThemeControls();
    }
);


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
    localStorage.removeItem("muthaqus_parent_last_activity");
    window.location.href = "index.html";
}

function adminLogout() {
    const admin = getCurrentAdmin();

    if (admin) {
        step84RecordActivity({
            category: "Security",
            action: "Admin logged out",
            target: admin.username || "admin",
            details: "The admin session was ended."
        });
    }

    localStorage.removeItem(VS.adminKey);
    localStorage.removeItem("muthaqus_admin_last_activity");
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

        alert("Child details saved successfully. Waiting for admin approval.");
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
        announcementBox.innerHTML = `
            <div class="announcement announcement-card-pro">
                <strong>Loading announcements...</strong>
            </div>
        `;
    }

    if (table) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="empty-row">
                    Loading dashboard data...
                </td>
            </tr>
        `;
    }

    try {
        const response = await fetch(
            `/api/parent-dashboard?parentId=${encodeURIComponent(parent.id)}`
        );
        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to load dashboard.");
            return;
        }

        const currentParent = result.parent || parent;
        const children = result.children || [];
        const payments = result.payments || [];
        const announcements = result.announcements || [];

        localStorage.setItem(
            VS.currentParentKey,
            JSON.stringify(currentParent)
        );

        const parentNameDisplay =
            document.getElementById("parentNameDisplay");
        const totalChildren =
            document.getElementById("totalChildren");
        const pendingPayment =
            document.getElementById("pendingPayment");

        if (parentNameDisplay) {
            parentNameDisplay.innerText =
                currentParent.name || "Parent";
        }

        if (totalChildren) {
            totalChildren.innerText = children.length;
        }

        const pendingCount = payments.filter(
            payment => payment.status === "Pending"
        ).length;

        if (pendingPayment) {
            pendingPayment.innerText = pendingCount;
        }

        renderParentPaymentDueReminder(children, payments);

        if (announcementBox) {
            announcementBox.innerHTML = "";

            announcements.slice(0, 3).forEach(item => {
                const categoryClass =
                    getAnnouncementCategoryBadgeClass(item.type);

                announcementBox.innerHTML += `
                    <article class="announcement announcement-card-pro step70-parent-announcement">
                        <div class="announcement-top-row">
                            <span class="badge ${categoryClass}">
                                ${mutahusSafeHtml(item.type || "Announcement")}
                            </span>

                            <small>
                                ${mutahusSafeHtml(item.date || "")}
                            </small>
                        </div>

                        <strong>
                            📢 ${mutahusSafeHtml(item.title || "Announcement")}
                        </strong>

                        <p>
                            ${mutahusSafeHtml(item.message || "")}
                        </p>
                    </article>
                `;
            });

            if (announcements.length === 0) {
                announcementBox.innerHTML = `
                    <article class="announcement announcement-card-pro step70-parent-announcement step70-empty-announcement">
                        <span>🔔</span>
                        <div>
                            <strong>No new announcement</strong>
                            <p>Updates from admin will appear here.</p>
                        </div>
                    </article>
                `;
            }
        }

        if (!table) {
            loadParentPaymentHistory(payments);
            return;
        }

        table.innerHTML = "";

        if (children.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-row">
                        <div class="step70-parent-empty-state">
                            <span>🎒</span>
                            <strong>No child registered yet</strong>
                            <p>
                                Register your first child to begin using
                                the school van service.
                            </p>
                            <a
                                href="add-student.html"
                                class="btn btn-primary-pro"
                            >
                                Register Child
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            children.forEach(child => {
                const childPayments = payments.filter(payment => {
                    return (
                        payment.studentId === child.id ||
                        !payment.studentId ||
                        payment.studentName ===
                            "All registered children"
                    );
                });

                const latestPayment = childPayments
                    .slice()
                    .sort((first, second) => {
                        return (
                            new Date(second.createdSort || 0) -
                            new Date(first.createdSort || 0)
                        );
                    })[0];

                const paymentStatus = latestPayment
                    ? latestPayment.status
                    : child.paymentStatus || "Unpaid";

                const badgeClass =
                    getPaymentBadgeClass(paymentStatus);

                const studentStatus =
                    child.status || "Pending Review";

                const studentStatusClass =
                    getStudentStatusBadgeClass(studentStatus);

                table.innerHTML += `
                    <tr class="step70-parent-child-row">
                        <td data-label="Child">
                            <div class="step70-child-identity">
                                <span>🎒</span>
                                <div>
                                    <strong>
                                        ${mutahusSafeHtml(child.name || "-")}
                                    </strong>
                                    <small>
                                        ID: ${mutahusSafeHtml(child.id || "-")}
                                    </small>
                                </div>
                            </div>
                        </td>

                        <td data-label="School / KAFA">
                            <strong>
                                ${mutahusSafeHtml(child.school || "Not applicable")}
                            </strong>

                            ${
                                child.kafa
                                    ? `
                                        <small>
                                            KAFA:
                                            ${mutahusSafeHtml(child.kafa)}
                                            ${
                                                child.kafaSession
                                                    ? ` (${mutahusSafeHtml(child.kafaSession)})`
                                                    : ""
                                            }
                                        </small>
                                    `
                                    : `<small>KAFA: Not applicable</small>`
                            }

                            <small>
                                Monthly fee:
                                RM${Number(child.monthlyAmount || 0).toFixed(2)}
                            </small>
                        </td>

                        <td data-label="Class">
                            ${mutahusSafeHtml(child.classYear || "-")}
                        </td>

                        <td data-label="Session">
                            ${mutahusSafeHtml(child.session || "Not applicable")}
                        </td>

                        <td data-label="Student Status">
                            <span class="badge ${studentStatusClass}">
                                ${mutahusSafeHtml(studentStatus)}
                            </span>
                        </td>

                        <td data-label="Payment">
                            <span class="badge ${badgeClass}">
                                ${mutahusSafeHtml(paymentStatus)}
                            </span>
                        </td>

                        <td data-label="Action">
                            <button
                                class="small-btn danger"
                                type="button"
                                onclick="deleteChild('${child.id}')"
                            >
                                Remove Request
                            </button>
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
                    <td colspan="7" class="empty-row">
                        Failed to load dashboard data.
                    </td>
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

    document.body.classList.remove("step68-parent-modal-open");
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
        step80ApplyArrearsUploadMode();

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

    const arrearsItems =
        step80GetArrearsItemsFromUrl();

    if (arrearsItems.length > 0) {
        amountInput.readOnly = true;
        amountInput.value =
            step80ArrearsTotal(
                arrearsItems
            ).toFixed(2);

        if (amountInfo) {
            amountInfo.innerText =
                `Outstanding total for ` +
                `${arrearsItems.length} month` +
                `${arrearsItems.length === 1 ? "" : "s"}.`;
            amountInfo.style.color = "#a72531";
        }

        updateAllChildrenSummary();
        step80ApplyArrearsUploadMode();
        return;
    }

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

        alert("Payment status updated to " + status + ".");
        loadAdminPayments();
    } catch (error) {
        alert("Update payment error: " + error.message);
    }
}

async function loadAdminDashboard() {
    const recentTable = document.getElementById("recentPaymentsTable");

    if (recentTable) {
        recentTable.innerHTML = `<tr><td colspan="5" class="empty-row">Loading dashboard securely...</td></tr>`;
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

        alert("Announcement posted successfully.");
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
    const confirmDelete = confirm("Delete this announcement?");
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

function step93NormaliseReceiptName(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
}

function step93PaymentPeriodKey(value) {
    const period = step77ParsePaymentPeriod(value);
    return period?.key || String(value || "").trim().toLowerCase();
}

function step93FindPossibleDuplicates(newPayment, payments) {
    const targetMonth = step93PaymentPeriodKey(newPayment.month);
    const targetName = step93NormaliseReceiptName(newPayment.receiptName);
    const targetAmount = Number(newPayment.amount || 0);
    const targetSize = Number(newPayment.receiptSize || 0);

    return (payments || []).filter(payment => {
        const sameMonth =
            step93PaymentPeriodKey(payment.month) === targetMonth;

        const sameAmount =
            Math.abs(Number(payment.amount || 0) - targetAmount) < 0.01;

        const sameFile =
            targetName &&
            step93NormaliseReceiptName(payment.receiptName) === targetName;

        const sameSize =
            targetSize > 0 &&
            Number(payment.receiptSize || 0) === targetSize;

        const activeStatus =
            payment.status !== "Rejected";

        return activeStatus && (
            (sameMonth && sameAmount) ||
            (sameFile && sameSize) ||
            (sameMonth && sameFile)
        );
    });
}

async function step93CheckDuplicateBeforeUpload(parent, paymentData) {
    try {
        const response = await fetch("/api/parent-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                parentId: parent.id,
                parentEmail: parent.email || ""
            })
        });

        const result = await response.json();
        if (!result.success) return true;

        const duplicates = step93FindPossibleDuplicates(
            paymentData,
            result.payments || []
        );

        if (!duplicates.length) return true;

        const latest = duplicates[0];
        const message = [
            "Possible duplicate payment detected.",
            "",
            `Existing month: ${latest.month || "-"}`,
            `Existing amount: RM${Number(latest.amount || 0).toFixed(2)}`,
            `Existing status: ${latest.status || "Pending"}`,
            "",
            "The same month, amount or receipt may already exist.",
            "Submit this payment anyway?"
        ].join("\n");

        return confirm(message);
    } catch (error) {
        console.warn("Duplicate check unavailable:", error.message);
        return true;
    }
}

function step93DuplicateKey(payment) {
    return [
        String(payment.parentId || payment.parentEmail || payment.parentName || "").toLowerCase(),
        step93PaymentPeriodKey(payment.month),
        Number(payment.amount || 0).toFixed(2),
        step93NormaliseReceiptName(payment.receiptName),
        Number(payment.receiptSize || 0)
    ].join("|");
}

function step93PrepareAdminDuplicateFlags(payments) {
    const groups = new Map();

    (payments || []).forEach(payment => {
        if (payment.status === "Rejected") return;

        const key = step93DuplicateKey(payment);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(payment);
    });

    window.step93DuplicatePaymentIds = new Set();

    groups.forEach(records => {
        if (records.length > 1) {
            records.forEach(record => {
                window.step93DuplicatePaymentIds.add(
                    String(record.sourcePaymentId || record.id || "")
                );
            });
        }
    });
}

function step93IsDuplicatePayment(payment) {
    return Boolean(
        window.step93DuplicatePaymentIds?.has(
            String(payment.sourcePaymentId || payment.id || "")
        )
    );
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

        const arrearsItems =
            step80GetArrearsItemsFromUrl();

        const userNote =
            document.getElementById("paymentNote")
                ? document
                    .getElementById("paymentNote")
                    .value
                    .trim()
                : "";

        const arrearsMarker =
            arrearsItems.length > 0
                ? `[ARREARS:${step80ArrearsItemsToPayload(
                    arrearsItems
                )}]`
                : "";

        const paymentData = {
            parentId: parent.id,
            parentEmail: parent.email || "",
            paymentMode,
            studentId: "",
            studentIds: selectedStudentIds,
            month:
                arrearsItems.length > 0
                    ? `Outstanding Balance (${arrearsItems.length} months)`
                    : document.getElementById("paymentMonth").value,
            amount: Number(document.getElementById("paymentAmount").value),
            datePaid: document.getElementById("paymentDate").value,
            receiptName: receiptFile.name,
            receiptType: receiptFile.type || "",
            receiptSize: receiptFile.size || 0,
            receiptDataUrl,
            note: [userNote, arrearsMarker]
                .filter(Boolean)
                .join("\n")
        };

        const continueUpload =
            await step93CheckDuplicateBeforeUpload(
                parent,
                paymentData
            );

        if (!continueUpload) {
            alert("Payment submission cancelled. Please check Payment History first.");
            return;
        }

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

        alert("Payment proof and receipt saved successfully. Waiting for admin approval.");
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
            <tr class="step71-payment-empty-row">
                <td colspan="6" class="empty-row">
                    <div class="step71-payment-empty">
                        <span>🧾</span>
                        <strong>No payment history yet</strong>
                        <p>
                            Uploaded receipts and approved PDF invoices
                            will appear here.
                        </p>
                        <a href="upload-payment.html" class="btn btn-primary-pro">
                            Upload Payment
                        </a>
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
            <tr class="step71-payment-history-row">
                <td data-label="Month">
                    <strong class="step71-payment-month">
                        ${mutahusSafeHtml(payment.month || "-")}
                    </strong>
                </td>

                <td data-label="Student">
                    ${mutahusSafeHtml(
                        payment.studentName ||
                        "All registered children"
                    )}
                </td>

                <td data-label="Amount">
                    <strong class="step71-payment-amount">
                        RM${Number(payment.amount || 0).toFixed(2)}
                    </strong>
                </td>

                <td data-label="Status">
                    <span class="badge ${badgeClass}">
                        ${mutahusSafeHtml(
                            payment.status || "Pending"
                        )}
                    </span>
                </td>

                <td data-label="Receipt">
                    <button
                        class="receipt-button"
                        type="button"
                        onclick="viewParentReceipt('${payment.id}')"
                    >
                        👁 View Receipt
                    </button>
                </td>

                <td data-label="Invoice">
                    ${invoiceButton}
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

function step80ParseArrearsMarker(note) {
    const match = String(note || "").match(
        /\[ARREARS:([^\]]+)\]/i
    );

    if (!match) return [];

    return match[1]
        .split(";")
        .map(entry => {
            const parts = entry.split("=");
            const period = step77PeriodFromKey(
                String(parts[0] || "").trim()
            );
            const amount = Number(parts[1] || 0);

            if (!period || amount <= 0) return null;

            return {
                period,
                amount
            };
        })
        .filter(Boolean);
}

function step80ExpandArrearsPayments(payments) {
    const expanded = [];

    (payments || []).forEach(payment => {
        const allocations = step80ParseArrearsMarker(
            payment.note
        );

        if (!allocations.length) {
            expanded.push(payment);
            return;
        }

        allocations.forEach(allocation => {
            expanded.push({
                ...payment,
                id:
                    `${payment.id || "payment"}-` +
                    allocation.period.key,
                sourcePaymentId: payment.id || "",
                month: step77PeriodLabel(
                    allocation.period
                ),
                amount: allocation.amount,
                arrearsPeriodKey: allocation.period.key
            });
        });
    });

    return expanded;
}

function step80NormalisePhone(value) {
    const digits = String(value || "")
        .replace(/[^\d]/g, "");

    if (!digits) return "";

    if (digits.startsWith("0")) {
        return "60" + digits.slice(1);
    }

    return digits;
}

function step80ArrearsItemsToPayload(items) {
    return (items || [])
        .filter(item => item?.period && Number(item.amount || 0) > 0)
        .map(item =>
            `${item.period.key}=${Number(item.amount).toFixed(2)}`
        )
        .join(";");
}

function step80BuildArrearsPaymentUrl(items) {
    const payload = step80ArrearsItemsToPayload(items);

    if (!payload) return "upload-payment.html";

    return (
        "upload-payment.html?mode=arrears&items=" +
        encodeURIComponent(payload)
    );
}

function step80GetArrearsItemsFromUrl() {
    const parameters = new URLSearchParams(
        window.location.search
    );

    if (parameters.get("mode") !== "arrears") {
        return [];
    }

    const payload = parameters.get("items") || "";

    return payload
        .split(";")
        .map(entry => {
            const parts = entry.split("=");
            const period = step77PeriodFromKey(
                String(parts[0] || "").trim()
            );
            const amount = Number(parts[1] || 0);

            if (!period || amount <= 0) return null;

            return {
                period,
                amount
            };
        })
        .filter(Boolean);
}

function step80ArrearsTotal(items) {
    return (items || []).reduce(
        (sum, item) =>
            sum + Number(item.amount || 0),
        0
    );
}

function step80ApplyArrearsUploadMode() {
    const items = step80GetArrearsItemsFromUrl();

    if (!items.length) return false;

    const form = document.querySelector(
        "form[onsubmit='submitPayment(event)']"
    );
    const summary = document.getElementById(
        "allChildrenSummary"
    );
    const amountInput = document.getElementById(
        "paymentAmount"
    );
    const amountInfo = document.getElementById(
        "paymentAmountInfo"
    );
    const hiddenMonth = document.getElementById(
        "paymentMonth"
    );
    const monthSelect = document.getElementById(
        "paymentMonthName"
    );
    const yearSelect = document.getElementById(
        "paymentYear"
    );

    if (!form || !amountInput) return false;

    form.classList.add("step80-arrears-upload-form");

    const total = step80ArrearsTotal(items);
    const marker = step80ArrearsItemsToPayload(items);

    amountInput.value = total.toFixed(2);
    amountInput.readOnly = true;
    amountInput.dataset.step80Arrears = marker;

    if (amountInfo) {
        amountInfo.innerText =
            `Outstanding total for ${items.length} month` +
            `${items.length === 1 ? "" : "s"}.`;
        amountInfo.style.color = "#a72531";
    }

    if (hiddenMonth) {
        hiddenMonth.value =
            `Outstanding Balance (${items.length} months)`;
    }

    [monthSelect, yearSelect].forEach(select => {
        if (!select) return;
        select.required = false;
        select.disabled = true;
        select.closest("div")?.classList.add(
            "step80-disabled-month-picker"
        );
    });

    let panel = document.getElementById(
        "step80ArrearsUploadPanel"
    );

    if (!panel) {
        panel = document.createElement("section");
        panel.id = "step80ArrearsUploadPanel";
        panel.className = "step80-arrears-upload-panel";

        const anchor =
            document.getElementById("allChildrenBox") ||
            form.firstElementChild;

        anchor?.insertAdjacentElement(
            "afterend",
            panel
        );
    }

    panel.innerHTML = `
        <div class="step80-arrears-upload-head">
            <span>⚠️</span>
            <div>
                <strong>Outstanding Balance Payment</strong>
                <p>
                    One receipt will cover the selected unpaid months.
                </p>
            </div>
            <b>RM${total.toFixed(2)}</b>
        </div>

        <div class="step80-arrears-upload-months">
            ${items
                .map(item => `
                    <div>
                        <span>
                            ${mutahusSafeHtml(
                                step77PeriodLabel(item.period)
                            )}
                        </span>
                        <strong>
                            RM${Number(item.amount).toFixed(2)}
                        </strong>
                    </div>
                `)
                .join("")}
        </div>
    `;

    if (summary) {
        summary.insertAdjacentHTML(
            "beforeend",
            `
                <span class="step80-payment-mode-note">
                    This submission is for previous outstanding months.
                </span>
            `
        );
    }

    return true;
}

function step80GetParentKey(item) {
    return (
        String(item.parentId || "").trim() ||
        String(item.parentEmail || "").trim().toLowerCase() ||
        `${String(item.parentName || "").trim().toLowerCase()}|` +
        `${String(item.parentPhone || "").replace(/\D/g, "")}`
    );
}

function step80CalculateAdminArrears(students, payments) {
    const current = getCurrentPaymentPeriod();

    const currentPeriod = {
        year: current.year,
        month: current.month,
        key: step77MonthKey(
            current.year,
            current.month
        )
    };

    const expandedPayments = step77UniquePayments(
        step80ExpandArrearsPayments(payments)
    );

    const parentGroups = new Map();

    (students || [])
        .filter(student => student.status !== "Rejected")
        .forEach(student => {
            const key = step80GetParentKey(student);

            if (!key) return;

            if (!parentGroups.has(key)) {
                parentGroups.set(key, {
                    key,
                    parentId: student.parentId || "",
                    parentName: student.parentName || "Parent",
                    parentPhone: student.parentPhone || "",
                    parentEmail: student.parentEmail || "",
                    children: []
                });
            }

            parentGroups.get(key).children.push(student);
        });

    const results = [];

    parentGroups.forEach(parent => {
        const parentPayments = expandedPayments.filter(
            payment =>
                step80GetParentKey(payment) === parent.key
        );

        const startPeriods = [
            ...parent.children.map(child =>
                step77ParseChildStartPeriod(
                    child.serviceStartMonth ||
                    child.createdAt
                )
            ),
            ...parentPayments.map(payment =>
                step77ParsePaymentPeriod(payment.month)
            )
        ]
            .filter(Boolean)
            .filter(period =>
                step77ComparePeriods(
                    period,
                    currentPeriod
                ) <= 0
            );

        const start =
            startPeriods.length > 0
                ? startPeriods
                    .slice()
                    .sort(step77ComparePeriods)[0]
                : currentPeriod;

        const range = step77BuildMonthRange(
            start,
            currentPeriod
        );

        const paymentGroups = new Map();

        parentPayments.forEach(payment => {
            const period = step77ParsePaymentPeriod(
                payment.month
            );

            if (!period) return;

            if (!paymentGroups.has(period.key)) {
                paymentGroups.set(period.key, []);
            }

            paymentGroups.get(period.key).push(payment);
        });

        const months = range.map(period => {
            const records =
                paymentGroups.get(period.key) || [];

            const expected =
                step77ExpectedAmountForPeriod(
                    parent.children,
                    period,
                    start
                );

            const total = status => {
                return records
                    .filter(record =>
                        record.status === status
                    )
                    .reduce(
                        (sum, record) =>
                            sum +
                            Number(record.amount || 0),
                        0
                    );
            };

            const paid = total("Paid");
            const pending = total("Pending");
            const remaining = Math.max(
                0,
                expected - paid
            );

            const isPast =
                step77ComparePeriods(
                    period,
                    currentPeriod
                ) < 0;

            const currentIsLate =
                period.key === currentPeriod.key &&
                current.day > MUTHAQUS_PAYMENT_DUE_DAY;

            return {
                period,
                expected,
                paid,
                pending,
                remaining,
                isDue: isPast || currentIsLate
            };
        });

        const overdueMonths = months
            .filter(month =>
                month.isDue &&
                month.expected > 0 &&
                month.remaining > 0 &&
                month.pending < month.remaining
            )
            .map(month => ({
                ...month,
                outstanding: Math.max(
                    0,
                    month.remaining - month.pending
                )
            }));

        const pendingMonths = months.filter(
            month =>
                month.isDue &&
                month.expected > 0 &&
                month.remaining > 0 &&
                month.pending >= month.remaining
        );

        const outstanding = overdueMonths.reduce(
            (sum, month) =>
                sum + Number(month.outstanding || 0),
            0
        );

        const pendingTotal = pendingMonths.reduce(
            (sum, month) =>
                sum + Number(month.pending || 0),
            0
        );

        if (
            outstanding <= 0 &&
            pendingMonths.length === 0
        ) {
            return;
        }

        results.push({
            ...parent,
            overdueMonths,
            pendingMonths,
            outstanding,
            pendingTotal,
            monthlyFee: parent.children.reduce(
                (sum, child) =>
                    sum +
                    Number(child.monthlyAmount || 0),
                0
            )
        });
    });

    return results.sort((first, second) => {
        if (second.outstanding !== first.outstanding) {
            return second.outstanding - first.outstanding;
        }

        return first.parentName.localeCompare(
            second.parentName
        );
    });
}

function step80UpdateArrearsSummary(records) {
    const outstandingRecords = records.filter(
        record => record.outstanding > 0
    );

    const values = {
        arrearsTotalOutstanding:
            "RM" +
            outstandingRecords
                .reduce(
                    (sum, record) =>
                        sum + record.outstanding,
                    0
                )
                .toFixed(2),
        arrearsParentCount:
            outstandingRecords.length,
        arrearsMonthCount:
            outstandingRecords.reduce(
                (sum, record) =>
                    sum + record.overdueMonths.length,
                0
            ),
        arrearsReviewCount:
            records.reduce(
                (sum, record) =>
                    sum + record.pendingMonths.length,
                0
            )
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.innerText = value;
        }
    });
}

function renderAdminArrearsManagement() {
    const list = document.getElementById(
        "adminArrearsList"
    );

    if (!list) return;

    const query = String(
        document.getElementById(
            "arrearsSearchInput"
        )?.value || ""
    )
        .trim()
        .toLowerCase();

    const statusFilter =
        document.getElementById(
            "arrearsStatusFilter"
        )?.value || "";

    const source =
        window.adminArrearsData || [];

    const records = source.filter(record => {
        const text = [
            record.parentName,
            record.parentPhone,
            record.parentEmail,
            ...record.children.map(child => child.name)
        ]
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            !query || text.includes(query);

        const matchesStatus =
            !statusFilter ||
            (
                statusFilter === "Overdue" &&
                record.outstanding > 0
            ) ||
            (
                statusFilter === "Review" &&
                record.pendingMonths.length > 0
            );

        return matchesSearch && matchesStatus;
    });

    const count = document.getElementById(
        "arrearsVisibleCount"
    );

    if (count) {
        count.innerText = records.length;
    }

    list.innerHTML = "";

    if (!records.length) {
        list.innerHTML = `
            <div class="step80-arrears-empty">
                <span>✅</span>
                <strong>No matching arrears record</strong>
                <p>
                    All matching accounts are clear or still under review.
                </p>
            </div>
        `;
        return;
    }

    window.adminArrearsMap = {};

    records.forEach((record, index) => {
        const recordId = `arrears_${index}`;
        window.adminArrearsMap[recordId] = record;

        const initial = String(
            record.parentName || "P"
        )
            .trim()
            .charAt(0)
            .toUpperCase();

        const overdueChips = record.overdueMonths
            .slice(-6)
            .map(month => `
                <span class="step80-admin-month-chip overdue">
                    <small>
                        ${mutahusSafeHtml(
                            step77PeriodLabel(
                                month.period,
                                true
                            )
                        )}
                    </small>
                    <b>
                        RM${Number(
                            month.outstanding
                        ).toFixed(2)}
                    </b>
                </span>
            `)
            .join("");

        const pendingChips = record.pendingMonths
            .slice(-3)
            .map(month => `
                <span class="step80-admin-month-chip review">
                    <small>
                        ${mutahusSafeHtml(
                            step77PeriodLabel(
                                month.period,
                                true
                            )
                        )}
                    </small>
                    <b>Review</b>
                </span>
            `)
            .join("");

        list.innerHTML += `
            <article class="step80-arrears-card step81-arrears-card">
                <div class="step81-arrears-priority ${record.outstanding > 0 ? "urgent" : "review"}">
                    <span>${record.outstanding > 0 ? "Payment attention required" : "Submission under review"}</span>
                    <strong>${record.overdueMonths.length + record.pendingMonths.length} month${record.overdueMonths.length + record.pendingMonths.length === 1 ? "" : "s"}</strong>
                </div>

                <header class="step80-arrears-card-head">
                    <div class="step80-arrears-parent">
                        <span>${initial}</span>

                        <div>
                            <strong>
                                ${mutahusSafeHtml(
                                    record.parentName
                                )}
                            </strong>

                            <small>
                                ${mutahusSafeHtml(
                                    record.parentPhone ||
                                    record.parentEmail ||
                                    "No contact"
                                )}
                            </small>
                        </div>
                    </div>

                    <span class="step80-arrears-status ${
                        record.outstanding > 0
                            ? "overdue"
                            : "review"
                    }">
                        ${
                            record.outstanding > 0
                                ? `${record.overdueMonths.length} overdue`
                                : "Under review"
                        }
                    </span>
                </header>

                <div class="step80-arrears-money">
                    <div>
                        <small>Outstanding balance</small>
                        <strong>
                            RM${record.outstanding.toFixed(2)}
                        </strong>
                    </div>

                    <div>
                        <small>Monthly fee</small>
                        <strong>
                            RM${record.monthlyFee.toFixed(2)}
                        </strong>
                    </div>

                    <div>
                        <small>Children</small>
                        <strong>
                            ${record.children.length}
                        </strong>
                    </div>
                </div>

                <div class="step80-arrears-children">
                    ${record.children
                        .map(child => `
                            <span>
                                🎒 ${mutahusSafeHtml(
                                    child.name || "Student"
                                )}
                            </span>
                        `)
                        .join("")}
                </div>

                <div class="step80-arrears-months">
                    ${overdueChips}
                    ${pendingChips}
                </div>

                <div class="step80-arrears-actions">
                    <button
                        type="button"
                        class="btn btn-primary-pro"
                        onclick="step80WhatsAppArrears('${recordId}')"
                    >
                        💬 WhatsApp Reminder
                    </button>

                    <button
                        type="button"
                        class="btn btn-outline-pro"
                        onclick="step80FilterPaymentRecords('${recordId}')"
                    >
                        View Payments
                    </button>

                    <button
                        type="button"
                        class="btn btn-outline-pro"
                        onclick="step80CopyArrearsReminder('${recordId}')"
                    >
                        Copy Reminder
                    </button>
                </div>
            </article>
        `;
    });
}

function resetAdminArrearsFilters() {
    const search = document.getElementById(
        "arrearsSearchInput"
    );
    const status = document.getElementById(
        "arrearsStatusFilter"
    );

    if (search) search.value = "";
    if (status) status.value = "";

    renderAdminArrearsManagement();
}

function step80CreateReminderText(record) {
    const monthText = record.overdueMonths
        .map(month =>
            `${step77PeriodLabel(month.period)} ` +
            `(RM${month.outstanding.toFixed(2)})`
        )
        .join(", ");

    return (
        `Assalamualaikum ${record.parentName}, ` +
        `rekod bayaran menunjukkan baki tertunggak ` +
        `RM${record.outstanding.toFixed(2)} untuk ` +
        `${monthText}. Sila semak dan muat naik bukti ` +
        `bayaran melalui Parent Portal. Terima kasih.`
    );
}

function step80WhatsAppArrears(recordId) {
    const record =
        (window.adminArrearsMap || {})[recordId];

    if (!record) {
        alert("Arrears record not found.");
        return;
    }

    const phone = step80NormalisePhone(
        record.parentPhone
    );

    if (!phone) {
        alert("Parent phone number is not available.");
        return;
    }

    const text = step80CreateReminderText(record);

    window.open(
        `https://api.whatsapp.com/send?phone=${phone}` +
        `&text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener"
    );
}

function step80CopyArrearsReminder(recordId) {
    const record =
        (window.adminArrearsMap || {})[recordId];

    if (!record) {
        alert("Arrears record not found.");
        return;
    }

    const text = step80CreateReminderText(record);

    navigator.clipboard
        ?.writeText(text)
        .then(() => {
            alert("Payment reminder copied.");
        })
        .catch(() => {
            window.prompt(
                "Copy this payment reminder:",
                text
            );
        });
}

function step80FilterPaymentRecords(recordId) {
    const record =
        (window.adminArrearsMap || {})[recordId];

    if (!record) return;

    const search = document.getElementById(
        "paymentRecordSearch"
    );

    if (search) {
        search.value =
            record.parentName ||
            record.parentPhone ||
            record.parentEmail ||
            "";
    }

    renderAdminPaymentRecords();

    document
        .getElementById("paymentRecordsSection")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}

function step86PrepareClosingMonthOptions() {
    const target = document.getElementById("monthlyClosingMonth");
    const source = document.getElementById("monthlyTrackerMonth");
    if (!target || !source) return;

    const previous = target.value;
    target.innerHTML = source.innerHTML;
    target.value = Array.from(target.options).some(option => option.value === previous)
        ? previous
        : source.value;

    renderMonthlyClosingReport();
}

function step86BuildClosingReport(selectedPeriod) {
    if (!selectedPeriod) return null;

    const records = step82BuildMonthlyParentRecords(
        window.adminStudentsForArrears || [],
        window.adminPaymentsData || [],
        selectedPeriod
    );

    const expected = records.reduce((sum, record) => sum + record.expected, 0);
    const collected = records.reduce((sum, record) => sum + record.paid, 0);
    const pending = records.reduce((sum, record) => sum + record.pending, 0);
    const outstanding = records.reduce(
        (sum, record) => sum + Math.max(0, record.expected - record.paid - record.pending),
        0
    );
    const collectionRate = expected > 0 ? collected / expected * 100 : 0;

    const previousPeriod = step77AddMonths(selectedPeriod, -1);
    const previousRecords = step82BuildMonthlyParentRecords(
        window.adminStudentsForArrears || [],
        window.adminPaymentsData || [],
        previousPeriod
    );
    const previousExpected = previousRecords.reduce((sum, record) => sum + record.expected, 0);
    const previousCollected = previousRecords.reduce((sum, record) => sum + record.paid, 0);
    const previousRate = previousExpected > 0 ? previousCollected / previousExpected * 100 : 0;

    return {
        period: selectedPeriod,
        label: step77PeriodLabel(selectedPeriod),
        generatedAt: new Date().toISOString(),
        records,
        expected,
        collected,
        pending,
        outstanding,
        collectionRate,
        previousPeriod,
        previousRate,
        rateDifference: collectionRate - previousRate,
        paidAccounts: records.filter(record => record.status === "Paid").length,
        reviewAccounts: records.filter(record => record.status === "Under Review").length,
        attentionRecords: records.filter(
            record => record.status !== "Paid" && record.status !== "Under Review"
        )
    };
}

function renderMonthlyClosingReport() {
    const selectedPeriod = step77PeriodFromKey(
        document.getElementById("monthlyClosingMonth")?.value || ""
    );
    const report = step86BuildClosingReport(selectedPeriod);
    window.step86ClosingReport = report;
    if (!report) return;

    const values = {
        closingExpectedTotal: `RM${report.expected.toFixed(2)}`,
        closingCollectedTotal: `RM${report.collected.toFixed(2)}`,
        closingPendingTotal: `RM${report.pending.toFixed(2)}`,
        closingOutstandingTotal: `RM${report.outstanding.toFixed(2)}`,
        closingCollectionRate: `${report.collectionRate.toFixed(1)}%`,
        closingPaidAccounts: report.paidAccounts,
        closingReviewAccounts: report.reviewAccounts,
        closingAttentionCount: report.attentionRecords.length,
        closingGeneratedDate: step84FormatDateTime(report.generatedAt)
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.innerText = value;
    });

    const progress = document.getElementById("closingCollectionProgress");
    if (progress) {
        progress.style.width = `${Math.min(100, Math.max(0, report.collectionRate))}%`;
    }

    const trend = document.getElementById("closingRateTrend");
    if (trend) {
        const positive = report.rateDifference >= 0;
        trend.className = `step86-trend ${positive ? "positive" : "negative"}`;
        trend.innerText =
            `${positive ? "↑" : "↓"} ${Math.abs(report.rateDifference).toFixed(1)}% ` +
            `vs ${step77PeriodLabel(report.previousPeriod, true)}`;
    }

    const attention = document.getElementById("closingAttentionList");
    if (!attention) return;

    const records = report.attentionRecords.slice()
        .sort((first, second) => second.outstanding - first.outstanding);

    attention.innerHTML = records.length
        ? records.map(record => `
            <article class="step86-attention-item">
                <div>
                    <strong>${mutahusSafeHtml(record.parentName)}</strong>
                    <small>${mutahusSafeHtml(record.children.map(child => child.name).join(", "))}</small>
                </div>
                <span class="step86-report-status ${step82MonthlyStatusClass(record.status)}">
                    ${mutahusSafeHtml(record.status)}
                </span>
                <div class="step86-attention-money">
                    <small>Balance</small>
                    <strong>RM${record.outstanding.toFixed(2)}</strong>
                </div>
            </article>
        `).join("")
        : `
            <div class="step86-report-empty">
                <span>✅</span>
                <strong>No account needs attention</strong>
                <p>All accounts are paid or waiting for approval.</p>
            </div>
        `;
}

function downloadMonthlyClosingCSV() {
    const report = window.step86ClosingReport;
    if (!report) {
        alert("Generate the monthly report first.");
        return;
    }

    const rows = [
        ["MUTHAQUS GLOBAL ENTERPRISE", "Monthly Closing Report"],
        ["Month", report.label],
        ["Generated", step84FormatDateTime(report.generatedAt)],
        [],
        [
            "Parent", "Phone", "Email", "Children",
            "Expected", "Paid", "Pending", "Outstanding", "Status"
        ]
    ];

    report.records.forEach(record => {
        rows.push([
            record.parentName,
            record.parentPhone,
            record.parentEmail,
            record.children.map(child => child.name).join("; "),
            record.expected.toFixed(2),
            record.paid.toFixed(2),
            record.pending.toFixed(2),
            record.outstanding.toFixed(2),
            record.status
        ]);
    });

    rows.push([]);
    rows.push([
        "TOTAL", "", "", "",
        report.expected.toFixed(2),
        report.collected.toFixed(2),
        report.pending.toFixed(2),
        report.outstanding.toFixed(2),
        `${report.collectionRate.toFixed(1)}%`
    ]);

    downloadCSV(`muthaqus-monthly-report-${report.period.key}.csv`, rows);

    step84RecordActivity({
        category: "Payments",
        action: "Monthly report CSV downloaded",
        target: report.label,
        details: `Collection rate ${report.collectionRate.toFixed(1)}%.`
    });
}

function step86BuildPdfDocument(pageStreams) {
    const pageCount = pageStreams.length;
    const fontRegularId = 3 + pageCount * 2;
    const fontBoldId = fontRegularId + 1;
    const objects = [];
    const pageIds = [];

    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";

    pageStreams.forEach((stream, index) => {
        const pageId = 3 + index * 2;
        const contentId = pageId + 1;
        pageIds.push(`${pageId} 0 R`);

        objects[pageId] =
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] " +
            `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> ` +
            `/Contents ${contentId} 0 R >>`;

        objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}endstream`;
    });

    objects[2] = `<< /Type /Pages /Kids [${pageIds.join(" ")}] /Count ${pageCount} >>`;
    objects[fontRegularId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    objects[fontBoldId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

    const totalObjects = fontBoldId;
    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    for (let index = 1; index <= totalObjects; index += 1) {
        offsets[index] = pdf.length;
        pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
    }

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${totalObjects + 1}\n`;
    pdf += "0000000000 65535 f \n";

    for (let index = 1; index <= totalObjects; index += 1) {
        pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF`;
    return pdf;
}

function step86ReportPageHeader(report, pageNumber, totalPages) {
    let stream = "";
    stream += mutahusPdfFilledRect(0, 750, 595, 92, "0.055 0.235 0.405");
    stream += mutahusPdfFilledRect(0, 742, 595, 8, "0.070 0.650 0.300");
    stream += mutahusPdfStyledText(42, 805, 15, "MUTHAQUS GLOBAL ENTERPRISE", true, "1 1 1");
    stream += mutahusPdfStyledText(42, 785, 9, "Monthly Payment Closing Report", false, "0.72 0.84 0.96");
    stream += mutahusPdfStyledText(404, 805, 10, report.label, true, "1 1 1");
    stream += mutahusPdfStyledText(450, 785, 8, `Page ${pageNumber} of ${totalPages}`, false, "0.72 0.84 0.96");
    return stream;
}

function step86BuildMonthlyReportPdf(report) {
    const firstPageRows = 11;
    const otherPageRows = 17;
    const chunks = [report.records.slice(0, firstPageRows)];
    let cursor = firstPageRows;

    while (cursor < report.records.length) {
        chunks.push(report.records.slice(cursor, cursor + otherPageRows));
        cursor += otherPageRows;
    }

    const pageStreams = chunks.map((records, pageIndex) => {
        let stream = step86ReportPageHeader(report, pageIndex + 1, chunks.length);
        let tableTop = 704;

        if (pageIndex === 0) {
            const cards = [
                ["EXPECTED", `RM ${report.expected.toFixed(2)}`],
                ["COLLECTED", `RM ${report.collected.toFixed(2)}`],
                ["PENDING", `RM ${report.pending.toFixed(2)}`],
                ["OUTSTANDING", `RM ${report.outstanding.toFixed(2)}`],
                ["RATE", `${report.collectionRate.toFixed(1)}%`]
            ];

            cards.forEach(([label, value], index) => {
                const x = 42 + index * 103;
                stream += mutahusPdfFilledRect(x, 662, 94, 54, "0.950 0.976 1.000");
                stream += mutahusPdfStrokedRect(x, 662, 94, 54, "0.82 0.88 0.94");
                stream += mutahusPdfStyledText(x + 9, 695, 6.5, label, true, "0.365 0.455 0.545");
                stream += mutahusPdfStyledText(x + 9, 676, 10, value, true, "0.085 0.185 0.300");
            });

            stream += mutahusPdfStyledText(
                42, 636, 8,
                `Generated: ${step84FormatDateTime(report.generatedAt)}`,
                false, "0.365 0.455 0.545"
            );
            tableTop = 602;
        }

        stream += mutahusPdfFilledRect(42, tableTop, 511, 29, "0.055 0.235 0.405");
        [
            [50, "PARENT"], [218, "EXPECTED"], [290, "PAID"],
            [352, "PENDING"], [420, "BALANCE"], [490, "STATUS"]
        ].forEach(([x, text]) => {
            stream += mutahusPdfStyledText(x, tableTop + 10, 7, text, true, "1 1 1");
        });

        let y = tableTop - 28;

        records.forEach((record, index) => {
            if (index % 2 === 0) {
                stream += mutahusPdfFilledRect(42, y - 5, 511, 27, "0.950 0.976 1.000");
            }

            stream += mutahusPdfLine(42, y - 6, 553, y - 6, "0.82 0.88 0.94");
            stream += mutahusPdfStyledText(
                50, y + 4, 7.5,
                mutahusInvoiceShortText(record.parentName, 28),
                true, "0.085 0.185 0.300"
            );
            stream += mutahusPdfStyledText(218, y + 4, 7.5, `RM${record.expected.toFixed(2)}`, false, "0.085 0.185 0.300");
            stream += mutahusPdfStyledText(290, y + 4, 7.5, `RM${record.paid.toFixed(2)}`, false, "0.085 0.185 0.300");
            stream += mutahusPdfStyledText(352, y + 4, 7.5, `RM${record.pending.toFixed(2)}`, false, "0.085 0.185 0.300");
            stream += mutahusPdfStyledText(420, y + 4, 7.5, `RM${record.outstanding.toFixed(2)}`, true, "0.085 0.185 0.300");
            stream += mutahusPdfStyledText(490, y + 4, 6.5, record.status, true, "0.085 0.185 0.300");
            y -= 28;
        });

        stream += mutahusPdfLine(42, 65, 553, 65, "0.82 0.88 0.94");
        stream += mutahusPdfStyledText(
            42, 44, 7,
            "Electronic management report generated by MUTHAQUS GLOBAL ENTERPRISE.",
            false, "0.365 0.455 0.545"
        );

        return stream;
    });

    return step86BuildPdfDocument(pageStreams);
}

function downloadMonthlyClosingPDF() {
    const report = window.step86ClosingReport;
    if (!report) {
        alert("Generate the monthly report first.");
        return;
    }

    const pdf = step86BuildMonthlyReportPdf(report);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `muthaqus-monthly-report-${report.period.key}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    step84RecordActivity({
        category: "Payments",
        action: "Monthly report PDF downloaded",
        target: report.label,
        details: `Collection rate ${report.collectionRate.toFixed(1)}%.`
    });
}

async function loadAdminPayments() {
    const records =
        document.getElementById(
            "adminPaymentMonthGroups"
        );

    const arrearsList =
        document.getElementById(
            "adminArrearsList"
        );

    const unpaidList =
        document.getElementById(
            "monthlyUnpaidList"
        );

    if (records) {
        records.innerHTML = `
            <div class="step82-month-empty">
                <span>⏳</span>
                <strong>
                    Loading payment records...
                </strong>
            </div>
        `;
    }

    if (arrearsList) {
        arrearsList.innerHTML = `
            <div class="step80-arrears-empty loading">
                <span>⏳</span>
                <strong>
                    Checking outstanding balances...
                </strong>
            </div>
        `;
    }

    if (unpaidList) {
        unpaidList.innerHTML = `
            <div class="step82-month-empty">
                <span>⏳</span>
                <strong>
                    Preparing monthly tracker...
                </strong>
            </div>
        `;
    }

    try {
        const [
            paymentResponse,
            studentResponse
        ] = await Promise.all([
            fetch("/api/admin-payments"),
            fetch("/api/admin-students")
        ]);

        const paymentResult =
            await paymentResponse.json();

        const studentResult =
            await studentResponse.json();

        if (!paymentResult.success) {
            throw new Error(
                paymentResult.message ||
                "Failed to load payments."
            );
        }

        if (!studentResult.success) {
            throw new Error(
                studentResult.message ||
                "Failed to load student records."
            );
        }

        const payments =
            paymentResult.payments || [];

        const students =
            studentResult.students || [];

        const summary =
            paymentResult.summary || {};

        window.adminPaymentsData =
            payments;

        step93PrepareAdminDuplicateFlags(
            payments
        );

        window.adminStudentsForArrears =
            students;

        window.adminPaymentReceiptMap = {};
        window.adminPaymentInvoiceMap = {};

        payments.forEach(payment => {
            window.adminPaymentReceiptMap[
                payment.id
            ] = payment;

            window.adminPaymentInvoiceMap[
                payment.id
            ] = payment;
        });

        const arrearsRecords =
            step80CalculateAdminArrears(
                students,
                payments
            );

        window.adminArrearsData =
            arrearsRecords;

        const values = {
            paymentTotalCollection:
                "RM" +
                Number(
                    summary.totalCollection ||
                    0
                ).toFixed(2),
            paymentPaidCount:
                summary.paidCount || 0,
            paymentPendingCount:
                summary.pendingCount || 0,
            paymentUnpaidCount:
                arrearsRecords.filter(
                    record =>
                        record.outstanding >
                        0
                ).length
        };

        Object.entries(values).forEach(
            ([id, value]) => {
                const element =
                    document.getElementById(
                        id
                    );

                if (element) {
                    element.innerText =
                        value;
                }
            }
        );

        step80UpdateArrearsSummary(
            arrearsRecords
        );

        step82PreparePaymentMonthOptions();
        step86PrepareClosingMonthOptions();
        renderAdminMonthlyPaymentTracker();
        renderAdminArrearsManagement();
        renderAdminPaymentRecords();
    } catch (error) {
        const message =
            mutahusSafeHtml(
                error.message
            );

        if (records) {
            records.innerHTML = `
                <div class="step82-month-empty">
                    <span>⚠️</span>
                    <strong>
                        Unable to load payment records
                    </strong>
                    <p>${message}</p>
                </div>
            `;
        }

        if (arrearsList) {
            arrearsList.innerHTML = `
                <div class="step80-arrears-empty">
                    <span>⚠️</span>
                    <strong>
                        Unable to load arrears records
                    </strong>
                    <p>${message}</p>
                </div>
            `;
        }

        if (unpaidList) {
            unpaidList.innerHTML = `
                <div class="step82-month-empty">
                    <span>⚠️</span>
                    <strong>
                        Unable to load monthly tracker
                    </strong>
                    <p>${message}</p>
                </div>
            `;
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
    const count = document.getElementById("parentRulesCount");

    if (!list) return;

    list.innerHTML = `
        <div class="step70-rules-loading">
            <span>📘</span>
            <strong>Loading current service rules...</strong>
        </div>
    `;

    try {
        const rules = await fetchRulesFromMongoDB();

        if (count) count.innerText = rules.length;

        list.innerHTML = "";

        if (rules.length === 0) {
            list.innerHTML = `
                <div class="step70-rules-loading">
                    <span>📭</span>
                    <strong>No rules available yet</strong>
                    <p>Rules added by admin will appear here.</p>
                </div>
            `;
            return;
        }

        rules.forEach((rule, index) => {
            list.innerHTML += `
                <article class="step70-public-rule-card">
                    <div class="step70-rule-number">
                        ${index + 1}
                    </div>

                    <div class="step70-rule-icon">
                        ${mutahusSafeHtml(rule.icon || "✅")}
                    </div>

                    <div class="step70-rule-copy">
                        <h3>
                            ${mutahusSafeHtml(rule.title || "Service Rule")}
                        </h3>

                        <p>
                            ${mutahusSafeHtml(rule.description || "")}
                        </p>
                    </div>
                </article>
            `;
        });
    } catch (error) {
        list.innerHTML = `
            <div class="step70-rules-loading">
                <span>⚠️</span>
                <strong>Failed to load rules</strong>
                <p>${mutahusSafeHtml(error.message)}</p>
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

        alert(result.message || "Rule saved successfully.");
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
    const confirmDelete = confirm("Delete this rule?");

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
    const confirmReset = confirm("Reset all rules to default? This will remove your edited rules.");

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
        alert("Rules reset to default successfully.");
    } catch (error) {
        alert("Reset rules error: " + error.message);
    }
}

// MUTAHUS_STEP12_RULES_MONGODB


function step82StudentParentKey(child) {
    return (
        String(child.parentId || "").trim() ||
        String(child.parentEmail || "")
            .trim()
            .toLowerCase() ||
        `${String(child.parentName || "Parent")
            .trim()
            .toLowerCase()}|` +
        `${String(child.parentPhone || "")
            .replace(/\D/g, "")}`
    );
}

function step82BuildStudentFamilies(children) {
    const familyMap = new Map();

    (children || []).forEach(child => {
        const key = step82StudentParentKey(child);

        if (!familyMap.has(key)) {
            familyMap.set(key, {
                key,
                parentId: child.parentId || "",
                parentName:
                    child.parentName || "Parent",
                parentPhone:
                    child.parentPhone || "",
                parentEmail:
                    child.parentEmail || "",
                children: []
            });
        }

        familyMap.get(key).children.push(child);
    });

    return Array.from(familyMap.values());
}

function step82ParentSearchText(family) {
    return [
        family.parentName,
        family.parentPhone,
        family.parentEmail,
        ...family.children.flatMap(child => [
            child.name,
            child.id,
            child.school,
            child.kafa,
            child.classYear,
            child.session,
            child.status,
            child.paymentStatus
        ])
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function step82FamilyPendingCount(family) {
    return family.children.filter(child =>
        (child.status || "Pending Review") ===
        "Pending Review"
    ).length;
}

function step82FamilyMonthlyFee(family) {
    return family.children
        .filter(child => child.status !== "Rejected")
        .reduce(
            (sum, child) =>
                sum +
                Number(child.monthlyAmount || 0),
            0
        );
}

function step82ToggleParentChildren(familyId) {
    if (!window.step82ExpandedFamilies) {
        window.step82ExpandedFamilies = new Set();
    }

    if (
        window.step82ExpandedFamilies.has(
            familyId
        )
    ) {
        window.step82ExpandedFamilies.delete(
            familyId
        );
    } else {
        window.step82ExpandedFamilies.add(
            familyId
        );
    }

    renderAdminStudentCards();
}

async function step82SetStudentStatusSilently(
    studentId,
    status
) {
    const response = await fetch(
        "/api/update-student-status",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                action: "update-status",
                studentId,
                status
            })
        }
    );

    const result = await response.json();

    if (!result.success) {
        throw new Error(
            result.message ||
            "Failed to update student status."
        );
    }
}

async function step82BulkStudentStatus(
    familyId,
    status
) {
    const family =
        (window.step82FamilyMap || {})[
            familyId
        ];

    if (!family) {
        alert("Parent record not found.");
        return;
    }

    const targets = family.children.filter(
        child =>
            (child.status ||
                "Pending Review") !== status
    );

    if (!targets.length) {
        alert(
            `All children are already ${status}.`
        );
        return;
    }

    if (
        status === "Rejected" &&
        !confirm(
            `Reject all ${targets.length} child record` +
            `${targets.length === 1 ? "" : "s"} ` +
            `under ${family.parentName}?`
        )
    ) {
        return;
    }

    try {
        await Promise.all(
            targets.map(child =>
                step82SetStudentStatusSilently(
                    child.id,
                    status
                )
            )
        );

        alert(
            `${targets.length} child record` +
            `${targets.length === 1 ? "" : "s"} ` +
            `updated to ${status}.`
        );

        loadAdminStudents();
    } catch (error) {
        alert(
            "Bulk status update error: " +
            error.message
        );
    }
}

function step82StudentChildCard(
    child,
    familyId
) {
    const status =
        child.status || "Pending Review";
    const paymentStatus =
        child.paymentStatus || "Unpaid";

    const statusClass =
        getStudentStatusBadgeClass(status);

    const paymentClass =
        getPaymentBadgeClass(
            paymentStatus
        );

    const sessionClass =
        child.session === "Morning"
            ? "morning"
            : child.session === "Afternoon"
            ? "afternoon"
            : "unpaid";

    const amount =
        Number(child.monthlyAmount || 0);

    const serviceStartMonth =
        child.serviceStartMonth ||
        step78MonthInputFromDate(
            child.createdAt
        ) ||
        "";

    const initial = String(
        child.name || "S"
    )
        .trim()
        .charAt(0)
        .toUpperCase();

    return `
        <article class="step82-child-card">
            <header class="step82-child-head">
                <div class="step82-child-identity">
                    <span>${mutahusSafeHtml(initial)}</span>

                    <div>
                        <small>Student</small>
                        <h4>
                            ${mutahusSafeHtml(
                                child.name || "-"
                            )}
                        </h4>
                        <p>
                            ID:
                            ${mutahusSafeHtml(
                                child.id || "-"
                            )}
                        </p>
                    </div>
                </div>

                <div class="step82-child-badges">
                    <span class="badge ${statusClass}">
                        ${mutahusSafeHtml(status)}
                    </span>

                    <span class="badge ${paymentClass}">
                        ${mutahusSafeHtml(
                            paymentStatus
                        )}
                    </span>
                </div>
            </header>

            <div class="step82-child-information">
                <div>
                    <small>School / KAFA</small>
                    <strong>
                        ${mutahusSafeHtml(
                            child.school || "-"
                        )}
                    </strong>
                    <p>
                        ${
                            child.kafa
                                ? `KAFA: ${mutahusSafeHtml(
                                    child.kafa
                                )}${
                                    child.kafaSession
                                        ? ` (${mutahusSafeHtml(
                                            child.kafaSession
                                        )})`
                                        : ""
                                }`
                                : "KAFA: Not applicable"
                        }
                    </p>
                </div>

                <div>
                    <small>Class</small>
                    <strong>
                        ${mutahusSafeHtml(
                            child.classYear || "-"
                        )}
                    </strong>
                </div>

                <div>
                    <small>Session</small>
                    <span class="badge ${sessionClass}">
                        ${mutahusSafeHtml(
                            child.session ||
                            "Not applicable"
                        )}
                    </span>
                </div>
            </div>

            <div class="step82-child-settings">
                <section>
                    <div class="step82-setting-title">
                        <span>📅</span>
                        <div>
                            <small>Billing begins</small>
                            <strong>
                                Service Start
                            </strong>
                        </div>
                    </div>

                    <input
                        type="month"
                        id="serviceStart_${child.id}"
                        value="${serviceStartMonth}"
                        min="2026-01"
                        aria-label="Service start month for ${
                            mutahusSafeHtml(
                                child.name ||
                                "student"
                            )
                        }"
                    >

                    <button
                        type="button"
                        onclick="updateStudentServiceStartMonth('${child.id}')"
                    >
                        Save Start Month
                    </button>
                </section>

                <section class="fee">
                    <div class="step82-setting-title">
                        <span>💳</span>
                        <div>
                            <small>Monthly charge</small>
                            <strong>Monthly Fee</strong>
                        </div>
                    </div>

                    <div class="step82-fee-input">
                        <span>RM</span>
                        <input
                            type="number"
                            id="amount_${child.id}"
                            value="${
                                amount > 0
                                    ? amount.toFixed(2)
                                    : ""
                            }"
                            min="0"
                            step="0.01"
                            inputmode="decimal"
                            placeholder="0.00"
                            aria-label="Monthly fee for ${
                                mutahusSafeHtml(
                                    child.name ||
                                    "student"
                                )
                            }"
                        >
                    </div>

                    <button
                        type="button"
                        onclick="updateStudentAmount('${child.id}')"
                    >
                        Save Monthly Fee
                    </button>
                </section>
            </div>

            <footer class="step82-child-actions">
                <button
                    class="accept"
                    type="button"
                    onclick="updateStudentStatus('${child.id}', 'Accepted')"
                    ${
                        status === "Accepted"
                            ? "disabled"
                            : ""
                    }
                >
                    ✓ Accept
                </button>

                <button
                    class="active"
                    type="button"
                    onclick="updateStudentStatus('${child.id}', 'Active')"
                    ${
                        status === "Active"
                            ? "disabled"
                            : ""
                    }
                >
                    ● Mark Active
                </button>

                <button
                    class="reject"
                    type="button"
                    onclick="updateStudentStatus('${child.id}', 'Rejected')"
                    ${
                        status === "Rejected"
                            ? "disabled"
                            : ""
                    }
                >
                    × Reject
                </button>

                <button
                    class="remove"
                    type="button"
                    onclick="removeStudent('${child.id}')"
                >
                    🗑 Remove
                </button>
            </footer>
        </article>
    `;
}

function step81StudentSearchText(child) {
    return [
        child.name,
        child.id,
        child.parentName,
        child.parentPhone,
        child.parentEmail,
        child.school,
        child.kafa,
        child.classYear,
        child.session,
        child.status,
        child.paymentStatus
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function renderAdminStudentCards() {
    const container =
        document.getElementById(
            "adminStudentsGrid"
        );

    if (!container) return;

    const search = String(
        document.getElementById(
            "studentRecordSearch"
        )?.value || ""
    )
        .trim()
        .toLowerCase();

    const statusFilter =
        document.getElementById(
            "studentStatusFilter"
        )?.value || "";

    const sessionFilter =
        document.getElementById(
            "studentSessionFilter"
        )?.value || "";

    const sortMode =
        document.getElementById(
            "studentParentSort"
        )?.value || "az";

    const allFamilies =
        step82BuildStudentFamilies(
            window.adminStudentsData || []
        );

    const families = allFamilies
        .map(family => {
            const parentMatches =
                !search ||
                [
                    family.parentName,
                    family.parentPhone,
                    family.parentEmail
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(search);

            const filteredChildren =
                family.children.filter(
                    child => {
                        const matchesSearch =
                            !search ||
                            parentMatches ||
                            step81StudentSearchText(
                                child
                            ).includes(search);

                        const matchesStatus =
                            !statusFilter ||
                            (
                                child.status ||
                                "Pending Review"
                            ) === statusFilter;

                        const matchesSession =
                            !sessionFilter ||
                            (
                                child.session ||
                                "Not applicable"
                            ) === sessionFilter;

                        return (
                            matchesSearch &&
                            matchesStatus &&
                            matchesSession
                        );
                    }
                );

            return {
                ...family,
                children: filteredChildren,
                originalChildren:
                    family.children
            };
        })
        .filter(family =>
            family.children.length > 0
        );

    families.sort((first, second) => {
        if (sortMode === "za") {
            return second.parentName.localeCompare(
                first.parentName
            );
        }

        if (sortMode === "children") {
            return (
                second.children.length -
                first.children.length ||
                first.parentName.localeCompare(
                    second.parentName
                )
            );
        }

        if (sortMode === "pending") {
            return (
                step82FamilyPendingCount(second) -
                step82FamilyPendingCount(first) ||
                first.parentName.localeCompare(
                    second.parentName
                )
            );
        }

        return first.parentName.localeCompare(
            second.parentName
        );
    });

    const familyCount =
        document.getElementById(
            "studentVisibleCount"
        );

    const studentCount =
        document.getElementById(
            "studentVisibleStudentCount"
        );

    if (familyCount) {
        familyCount.innerText =
            families.length;
    }

    if (studentCount) {
        studentCount.innerText =
            families.reduce(
                (sum, family) =>
                    sum +
                    family.children.length,
                0
            );
    }

    container.innerHTML = "";

    if (!families.length) {
        container.innerHTML = `
            <div class="step81-student-empty">
                <span>👨‍👩‍👧</span>
                <strong>
                    No matching parent or student
                </strong>
                <p>
                    Try changing the search,
                    status or session filter.
                </p>
            </div>
        `;
        return;
    }

    if (!window.step82ExpandedFamilies) {
        window.step82ExpandedFamilies =
            new Set();
    }

    window.step82FamilyMap = {};

    families.forEach((family, index) => {
        const familyId =
            `family_${index}`;

        window.step82FamilyMap[
            familyId
        ] = family;

        const initial = String(
            family.parentName || "P"
        )
            .trim()
            .charAt(0)
            .toUpperCase();

        const pendingCount =
            step82FamilyPendingCount(
                family
            );

        const monthlyFee =
            step82FamilyMonthlyFee(
                family
            );

        const isExpanded =
            window.step82ExpandedFamilies.has(
                familyId
            ) ||
            Boolean(search);

        if (isExpanded) {
            window.step82ExpandedFamilies.add(
                familyId
            );
        }

        const childContent =
            family.children
                .map(child =>
                    step82StudentChildCard(
                        child,
                        familyId
                    )
                )
                .join("");

        container.innerHTML += `
            <article class="step82-family-card ${
                isExpanded
                    ? "is-open"
                    : ""
            }">
                <header class="step82-family-header">
                    <button
                        type="button"
                        class="step82-family-identity"
                        onclick="step82ToggleParentChildren('${familyId}')"
                    >
                        <span class="step82-parent-avatar">
                            ${mutahusSafeHtml(initial)}
                        </span>

                        <div>
                            <small>
                                Parent Account
                            </small>

                            <h3>
                                ${mutahusSafeHtml(
                                    family.parentName
                                )}
                            </h3>

                            <p>
                                📞 ${mutahusSafeHtml(
                                    family.parentPhone ||
                                    "No phone"
                                )}
                                <span>•</span>
                                ✉ ${mutahusSafeHtml(
                                    family.parentEmail ||
                                    "No email"
                                )}
                            </p>
                        </div>
                    </button>

                    <div class="step82-family-metrics">
                        <div>
                            <small>Children</small>
                            <strong>
                                ${family.children.length}
                            </strong>
                        </div>

                        <div>
                            <small>Pending</small>
                            <strong>
                                ${pendingCount}
                            </strong>
                        </div>

                        <div>
                            <small>Monthly Total</small>
                            <strong>
                                RM${monthlyFee.toFixed(2)}
                            </strong>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="step82-view-children"
                        onclick="step82ToggleParentChildren('${familyId}')"
                        aria-expanded="${
                            isExpanded
                                ? "true"
                                : "false"
                        }"
                    >
                        <span>
                            ${
                                isExpanded
                                    ? "Hide Children"
                                    : "View Children"
                            }
                        </span>

                        <b>
                            ${
                                isExpanded
                                    ? "−"
                                    : "+"
                            }
                        </b>
                    </button>
                </header>

                <div class="step82-family-bulk-actions">
                    <span>
                        Manage all children under
                        this parent:
                    </span>

                    <div>
                        <button
                            class="accept"
                            type="button"
                            onclick="step82BulkStudentStatus('${familyId}', 'Accepted')"
                        >
                            ✓ Accept All
                        </button>

                        <button
                            class="active"
                            type="button"
                            onclick="step82BulkStudentStatus('${familyId}', 'Active')"
                        >
                            ● Activate All
                        </button>

                        <button
                            class="reject"
                            type="button"
                            onclick="step82BulkStudentStatus('${familyId}', 'Rejected')"
                        >
                            × Reject All
                        </button>
                    </div>
                </div>

                <section
                    class="step82-family-children"
                    ${
                        isExpanded
                            ? ""
                            : "hidden"
                    }
                >
                    <div class="step82-family-children-head">
                        <div>
                            <small>
                                CHILD RECORDS
                            </small>

                            <h4>
                                Children under
                                ${mutahusSafeHtml(
                                    family.parentName
                                )}
                            </h4>
                        </div>

                        <span>
                            ${family.children.length}
                            ${
                                family.children.length === 1
                                    ? "Child"
                                    : "Children"
                            }
                        </span>
                    </div>

                    <div class="step82-child-grid">
                        ${childContent}
                    </div>
                </section>
            </article>
        `;
    });
}

function resetAdminStudentFilters() {
    const search =
        document.getElementById(
            "studentRecordSearch"
        );

    const status =
        document.getElementById(
            "studentStatusFilter"
        );

    const session =
        document.getElementById(
            "studentSessionFilter"
        );

    const sort =
        document.getElementById(
            "studentParentSort"
        );

    if (search) search.value = "";
    if (status) status.value = "";
    if (session) session.value = "";
    if (sort) sort.value = "az";

    window.step82ExpandedFamilies =
        new Set();

    renderAdminStudentCards();
}

async function loadAdminStudents() {
    const grid = document.getElementById("adminStudentsGrid");

    if (grid) {
        grid.innerHTML = `
            <div class="step81-student-empty loading">
                <span>⏳</span>
                <strong>Loading student records...</strong>
            </div>
        `;
    }

    try {
        const response = await fetch("/api/admin-students");
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "Failed to load students.");
        }

        const children = result.students || [];
        const summary = result.summary || {
            totalStudents: children.length,
            morningCount: 0,
            afternoonCount: 0,
            totalSchools: 0
        };

        window.adminStudentsData = children;

        const values = {
            adminTotalStudents: summary.totalStudents || 0,
            adminMorningStudents: summary.morningCount || 0,
            adminAfternoonStudents: summary.afternoonCount || 0,
            adminTotalSchools: summary.totalSchools || 0
        };

        Object.entries(values).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.innerText = value;
        });

        renderAdminStudentCards();
    } catch (error) {
        if (grid) {
            grid.innerHTML = `
                <div class="step81-student-empty">
                    <span>⚠️</span>
                    <strong>Unable to load student records</strong>
                    <p>${mutahusSafeHtml(error.message)}</p>
                </div>
            `;
        }
    }
}

function step78MonthInputFromDate(value) {
    const period = step77ParseChildStartPeriod(value);

    return period
        ? step77MonthKey(period.year, period.month)
        : "";
}

async function updateStudentServiceStartMonth(childId) {
    const input = document.getElementById(
        "serviceStart_" + childId
    );

    const serviceStartMonth = String(
        input ? input.value : ""
    ).trim();

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(serviceStartMonth)) {
        alert("Please choose a valid service start month.");
        return;
    }

    try {
        const response = await fetch(
            "/api/update-student-status",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "update-service-start",
                    studentId: childId,
                    serviceStartMonth
                })
            }
        );

        const result = await response.json();

        if (!result.success) {
            alert(
                result.message ||
                "Failed to update service start month."
            );
            return;
        }

        alert("Service start month updated successfully.");
        loadAdminStudents();
    } catch (error) {
        alert(
            "Update service start month error: " +
            error.message
        );
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

        alert("Student status updated to " + status + ".");
        loadAdminStudents();
    } catch (error) {
        alert("Update student error: " + error.message);
    }
}

async function removeStudent(childId) {
    const confirmRemove = confirm("Are you sure you want to remove this student? Related payment records will also be removed.");

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

        alert("Student removed successfully.");
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
                <td colspan="7" class="empty-row">Loading parent records...</td>
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
                                👁 View Details
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

    const parentChildren = Array.isArray(parent.children)
        ? parent.children
        : [];

    const parentPayments = Array.isArray(parent.payments)
        ? parent.payments
        : [];

    const modal = document.getElementById("parentDetailModal");
    const modalBody = document.getElementById("parentDetailBody");

    if (!modal || !modalBody) {
        alert("Parent detail modal is missing from this page.");
        return;
    }

    const status = parent.status || "Active";
    const accountStatusClass =
        status === "Pending"
            ? "pending"
            : status === "Rejected"
            ? "rejected"
            : "paid";

    const paidPayments = parentPayments.filter(
        payment => payment.status === "Paid"
    );

    const paidTotal = paidPayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
    );

    const pendingCount = parentPayments.filter(
        payment => payment.status === "Pending"
    ).length;

    const latestPayment = parentPayments[0] || null;
    const initial = String(parent.name || "P")
        .trim()
        .charAt(0)
        .toUpperCase();

    const cleanPhone = String(parent.phone || "")
        .replace(/[^\d+]/g, "");

    const whatsappPhone = cleanPhone.startsWith("0")
        ? "60" + cleanPhone.slice(1)
        : cleanPhone;

    window.parentDetailPaymentMap = {};

    let childrenContent = "";

    if (parentChildren.length === 0) {
        childrenContent = `
            <div class="step68-empty-panel">
                <span>🎒</span>
                <strong>No registered children</strong>
                <p>Children added by this parent will appear here.</p>
            </div>
        `;
    } else {
        childrenContent = parentChildren
            .map(child => {
                const childStatus = child.status || "Pending Review";
                const statusClass =
                    getStudentStatusBadgeClass(childStatus);

                const school = child.school || "Not applicable";
                const kafa = child.kafa
                    ? `${child.kafa}${
                          child.kafaSession
                              ? ` (${child.kafaSession})`
                              : ""
                      }`
                    : "Not applicable";

                return `
                    <article class="step68-child-card">
                        <div class="step68-child-card-head">
                            <div class="step68-child-identity">
                                <span>🎒</span>
                                <div>
                                    <h4>${mutahusSafeHtml(child.name || "Unnamed child")}</h4>
                                    <small>ID: ${mutahusSafeHtml(child.id || "-")}</small>
                                </div>
                            </div>

                            <span class="badge ${statusClass}">
                                ${mutahusSafeHtml(childStatus)}
                            </span>
                        </div>

                        <div class="step68-detail-list">
                            <div>
                                <span>School</span>
                                <strong>${mutahusSafeHtml(school)}</strong>
                            </div>

                            <div>
                                <span>KAFA</span>
                                <strong>${mutahusSafeHtml(kafa)}</strong>
                            </div>

                            <div>
                                <span>Class</span>
                                <strong>${mutahusSafeHtml(child.classYear || "-")}</strong>
                            </div>

                            <div>
                                <span>Session</span>
                                <strong>${mutahusSafeHtml(child.session || "Not applicable")}</strong>
                            </div>

                            <div class="step68-full-detail">
                                <span>Monthly Fee</span>
                                <strong>RM${Number(child.monthlyAmount || 0).toFixed(2)}</strong>
                            </div>
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    let paymentsContent = "";

    if (parentPayments.length === 0) {
        paymentsContent = `
            <div class="step68-empty-panel">
                <span>💳</span>
                <strong>No payment records</strong>
                <p>Payment submissions from this parent will appear here.</p>
            </div>
        `;
    } else {
        paymentsContent = parentPayments
            .map(payment => {
                window.parentDetailPaymentMap[payment.id] = payment;

                const paymentStatus = payment.status || "Pending";
                const badgeClass =
                    getPaymentBadgeClass(paymentStatus);

                const invoiceButton =
                    paymentStatus === "Paid"
                        ? `
                            <button
                                class="step68-payment-button invoice"
                                type="button"
                                onclick="downloadParentDetailInvoice('${payment.id}')"
                            >
                                ⬇ PDF Invoice
                            </button>
                        `
                        : "";

                return `
                    <article class="step68-payment-card">
                        <div class="step68-payment-card-head">
                            <div>
                                <span class="step68-payment-month">
                                    ${mutahusSafeHtml(payment.month || "Payment")}
                                </span>
                                <h4>${mutahusSafeHtml(payment.studentName || "All registered children")}</h4>
                            </div>

                            <span class="badge ${badgeClass}">
                                ${mutahusSafeHtml(paymentStatus)}
                            </span>
                        </div>

                        <div class="step68-payment-card-body">
                            <div>
                                <span>Amount</span>
                                <strong>RM${Number(payment.amount || 0).toFixed(2)}</strong>
                            </div>

                            <div>
                                <span>Receipt</span>
                                <strong>${mutahusSafeHtml(payment.receiptName || "No file")}</strong>
                            </div>
                        </div>

                        <div class="step68-payment-card-actions">
                            <button
                                class="step68-payment-button"
                                type="button"
                                onclick="viewParentDetailReceipt('${payment.id}')"
                            >
                                👁 View Receipt
                            </button>

                            ${invoiceButton}
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    modalBody.innerHTML = `
        <section class="step68-parent-detail-shell">
            <header class="step68-parent-detail-hero">
                <div class="step68-parent-main">
                    <div class="step68-parent-avatar">${mutahusSafeHtml(initial)}</div>

                    <div class="step68-parent-heading">
                        <span class="page-kicker">PARENT ACCOUNT</span>
                        <h2>${mutahusSafeHtml(parent.name || "Parent")}</h2>

                        <div class="step68-parent-contact-line">
                            <span>📞 ${mutahusSafeHtml(parent.phone || "-")}</span>
                            <span>✉️ ${mutahusSafeHtml(parent.email || "-")}</span>
                        </div>
                    </div>
                </div>

                <span class="badge ${accountStatusClass} step68-account-badge">
                    ${mutahusSafeHtml(status)}
                </span>
            </header>

            <div class="step68-contact-actions">
                <a
                    href="${cleanPhone ? `tel:${mutahusSafeHtml(cleanPhone)}` : "#"}"
                    class="${cleanPhone ? "" : "is-disabled"}"
                >
                    📞 Call Parent
                </a>

                <a
                    href="${parent.email ? `mailto:${mutahusSafeHtml(parent.email)}` : "#"}"
                    class="${parent.email ? "" : "is-disabled"}"
                >
                    ✉️ Send Email
                </a>

                <a
                    href="${whatsappPhone ? `https://api.whatsapp.com/send?phone=${mutahusSafeHtml(whatsappPhone)}&text=Assalamualaikum%2C%20ini%20daripada%20MUTHAQUS%20GLOBAL%20ENTERPRISE.` : "#"}"
                    class="${whatsappPhone ? "whatsapp" : "is-disabled"}"
                    target="_blank"
                    rel="noopener"
                >
                    💬 WhatsApp
                </a>
            </div>

            <section class="step68-parent-summary">
                <article>
                    <span>🎒</span>
                    <div>
                        <small>Registered Children</small>
                        <strong>${parentChildren.length}</strong>
                    </div>
                </article>

                <article>
                    <span>🧾</span>
                    <div>
                        <small>Payment Records</small>
                        <strong>${parentPayments.length}</strong>
                    </div>
                </article>

                <article>
                    <span>✅</span>
                    <div>
                        <small>Total Paid</small>
                        <strong>RM${paidTotal.toFixed(2)}</strong>
                    </div>
                </article>

                <article>
                    <span>⏳</span>
                    <div>
                        <small>Pending Payments</small>
                        <strong>${pendingCount}</strong>
                    </div>
                </article>
            </section>

            <section class="step68-detail-section">
                <div class="step68-section-heading">
                    <div>
                        <span class="page-kicker">CHILD RECORDS</span>
                        <h3>Registered Children</h3>
                        <p>School, class, session and monthly service fee.</p>
                    </div>

                    <span class="step68-record-count">
                        ${parentChildren.length} ${
                            parentChildren.length === 1
                                ? "Child"
                                : "Children"
                        }
                    </span>
                </div>

                <div class="step68-child-grid">
                    ${childrenContent}
                </div>
            </section>

            <section class="step68-detail-section">
                <div class="step68-section-heading">
                    <div>
                        <span class="page-kicker">PAYMENT HISTORY</span>
                        <h3>Payment Records</h3>
                        <p>Review receipt files and approved invoices.</p>
                    </div>

                    <span class="step68-record-count">
                        ${parentPayments.length} ${
                            parentPayments.length === 1
                                ? "Record"
                                : "Records"
                        }
                    </span>
                </div>

                <div class="step68-payment-grid">
                    ${paymentsContent}
                </div>
            </section>
        </section>
    `;

    modal.classList.add("show");
    document.body.classList.add("step68-parent-modal-open");

    modal.querySelector(".modal-close-btn")?.focus();
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

        alert("Parent status updated to " + status + ".");
        loadAdminParents();
    } catch (error) {
        alert("Update parent error: " + error.message);
    }
}

async function removeParentAndRecords(parentId) {
    const confirmRemove = confirm("Delete this parent account? This will also delete their children and payment records.");

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


function step94ExpenseCategoryIcon(category) {
    const icons = {
        Fuel: "⛽",
        Service: "🔧",
        Tyre: "🛞",
        "Road Tax": "📄",
        Insurance: "🛡️",
        Repair: "🧰",
        Cleaning: "🧼",
        "Parking / Toll": "🛣️",
        Other: "📦"
    };

    return icons[category] || "📦";
}

function step94FormatMoney(value) {
    return `RM${Number(value || 0).toFixed(2)}`;
}

function step94MonthKey(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function step94TodayInput() {
    const now = new Date();
    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}

async function loadMaintenancePage() {
    requireAdminLogin();

    const date = document.getElementById("expenseDate");
    if (date && !date.value) date.value = step94TodayInput();

    try {
        const response = await fetch("/api/admin-dashboard?action=van-expenses");
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "Failed to load expense records.");
        }

        window.muthaqusVanExpenses = result.expenses || [];
        renderMaintenanceRecords();
    } catch (error) {
        const list = document.getElementById("maintenanceExpenseList");
        if (list) {
            list.innerHTML = `
                <div class="step94-empty">
                    <span>⚠️</span>
                    <strong>Unable to load records</strong>
                    <p>${mutahusSafeHtml(error.message)}</p>
                </div>
            `;
        }
    }
}

async function saveVanExpense(event) {
    event.preventDefault();

    const id = document.getElementById("expenseRecordId")?.value || "";
    const data = {
        action: "save-van-expense",
        expenseId: id,
        vanPlate: document.getElementById("expenseVanPlate").value.trim(),
        date: document.getElementById("expenseDate").value,
        category: document.getElementById("expenseCategory").value,
        description: document.getElementById("expenseDescription").value.trim(),
        amount: Number(document.getElementById("expenseAmount").value || 0),
        nextServiceDate: document.getElementById("expenseNextService").value,
        status: document.getElementById("expenseStatus").value,
        note: document.getElementById("expenseNote").value.trim()
    };

    if (!data.vanPlate || !data.date || !data.category || data.amount <= 0) {
        alert("Please complete van plate, date, category and amount.");
        return;
    }

    const button = event.target.querySelector("button[type='submit']");
    const original = button?.innerText || "";

    if (button) {
        button.disabled = true;
        button.innerText = "Saving...";
    }

    try {
        const response = await fetch("/api/admin-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "Failed to save expense.");
        }

        alert(id ? "Expense record updated." : "Expense record added.");
        resetExpenseForm();
        loadMaintenancePage();
    } catch (error) {
        alert("Expense error: " + error.message);
    } finally {
        if (button) {
            button.disabled = false;
            button.innerText = original;
        }
    }
}

function editVanExpense(id) {
    const item = (window.muthaqusVanExpenses || []).find(record => record.id === id);
    if (!item) return;

    const values = {
        expenseRecordId: item.id,
        expenseVanPlate: item.vanPlate,
        expenseDate: item.date,
        expenseCategory: item.category,
        expenseDescription: item.description,
        expenseAmount: Number(item.amount || 0).toFixed(2),
        expenseNextService: item.nextServiceDate || "",
        expenseStatus: item.status || "Completed",
        expenseNote: item.note || ""
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });

    const title = document.getElementById("expenseFormTitle");
    if (title) title.innerText = "Edit Expense Record";

    document.getElementById("expenseFormCard")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function resetExpenseForm() {
    const form = document.getElementById("vanExpenseForm");
    form?.reset();

    const id = document.getElementById("expenseRecordId");
    if (id) id.value = "";

    const date = document.getElementById("expenseDate");
    if (date) date.value = step94TodayInput();

    const title = document.getElementById("expenseFormTitle");
    if (title) title.innerText = "Add Expense Record";
}

async function deleteVanExpense(id) {
    if (!confirm("Remove this expense record?")) return;

    try {
        const response = await fetch("/api/admin-dashboard", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "delete-van-expense",
                expenseId: id
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "Failed to remove expense.");
        }

        loadMaintenancePage();
    } catch (error) {
        alert("Delete error: " + error.message);
    }
}

function renderMaintenanceRecords() {
    const list = document.getElementById("maintenanceExpenseList");
    if (!list) return;

    const query = String(document.getElementById("expenseSearch")?.value || "")
        .trim().toLowerCase();
    const category = document.getElementById("expenseCategoryFilter")?.value || "";
    const month = document.getElementById("expenseMonthFilter")?.value || "";

    const records = (window.muthaqusVanExpenses || []).filter(item => {
        const text = [
            item.vanPlate,
            item.category,
            item.description,
            item.status,
            item.note
        ].join(" ").toLowerCase();

        return (
            (!query || text.includes(query)) &&
            (!category || item.category === category) &&
            (!month || step94MonthKey(item.date) === month)
        );
    });

    const total = records.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const fuel = records
        .filter(item => item.category === "Fuel")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const maintenance = records
        .filter(item => ["Service", "Repair", "Tyre"].includes(item.category))
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const upcoming = records.filter(item => {
        if (!item.nextServiceDate) return false;
        const days = (new Date(item.nextServiceDate) - new Date()) / 86400000;
        return days >= 0 && days <= 30;
    }).length;

    const summary = {
        maintenanceTotalExpense: step94FormatMoney(total),
        maintenanceFuelExpense: step94FormatMoney(fuel),
        maintenanceServiceExpense: step94FormatMoney(maintenance),
        maintenanceUpcomingCount: upcoming,
        maintenanceVisibleCount: records.length
    };

    Object.entries(summary).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.innerText = value;
    });

    if (!records.length) {
        list.innerHTML = `
            <div class="step94-empty">
                <span>🔧</span>
                <strong>No matching expense record</strong>
                <p>Add a new record or change the filters.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = records.map(item => `
        <article class="step94-expense-card">
            <header>
                <span>${step94ExpenseCategoryIcon(item.category)}</span>

                <div>
                    <small>${mutahusSafeHtml(item.category)}</small>
                    <strong>${mutahusSafeHtml(item.description || item.category)}</strong>
                    <p>${mutahusSafeHtml(item.vanPlate)} • ${mutahusSafeHtml(item.date)}</p>
                </div>

                <b>${step94FormatMoney(item.amount)}</b>
            </header>

            <div class="step94-expense-details">
                <div>
                    <small>Status</small>
                    <strong>${mutahusSafeHtml(item.status || "Completed")}</strong>
                </div>

                <div>
                    <small>Next Service / Renewal</small>
                    <strong>${mutahusSafeHtml(item.nextServiceDate || "Not set")}</strong>
                </div>
            </div>

            ${item.note ? `<p class="step94-expense-note">${mutahusSafeHtml(item.note)}</p>` : ""}

            <footer>
                <button type="button" onclick="editVanExpense('${item.id}')">
                    Edit
                </button>
                <button class="danger" type="button" onclick="deleteVanExpense('${item.id}')">
                    Remove
                </button>
            </footer>
        </article>
    `).join("");
}

function resetMaintenanceFilters() {
    ["expenseSearch", "expenseCategoryFilter", "expenseMonthFilter"].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = "";
    });
    renderMaintenanceRecords();
}

function exportMaintenanceCSV() {
    const records = window.muthaqusVanExpenses || [];
    if (!records.length) {
        alert("No expense records are available.");
        return;
    }

    const rows = [[
        "Date", "Van Plate", "Category", "Description",
        "Amount", "Status", "Next Service", "Note"
    ]];

    records.forEach(item => {
        rows.push([
            item.date,
            item.vanPlate,
            item.category,
            item.description,
            Number(item.amount || 0).toFixed(2),
            item.status,
            item.nextServiceDate,
            item.note
        ]);
    });

    downloadCSV(`muthaqus-van-expenses-${todayFileDate()}.csv`, rows);
}

async function loadBusinessAnalytics() {
    requireAdminLogin();

    try {
        const [paymentResponse, studentResponse, expenseResponse] = await Promise.all([
            fetch("/api/admin-payments"),
            fetch("/api/admin-students"),
            fetch("/api/admin-dashboard?action=van-expenses")
        ]);

        const paymentResult = await paymentResponse.json();
        const studentResult = await studentResponse.json();
        const expenseResult = await expenseResponse.json();

        if (!paymentResult.success || !studentResult.success || !expenseResult.success) {
            throw new Error("Unable to load complete business data.");
        }

        window.step95Payments = paymentResult.payments || [];
        window.step95Students = studentResult.students || [];
        window.step95Expenses = expenseResult.expenses || [];

        step95PrepareMonthOptions();
        renderBusinessAnalytics();
    } catch (error) {
        const panel = document.getElementById("analyticsMainContent");
        if (panel) {
            panel.innerHTML = `
                <div class="step94-empty">
                    <span>⚠️</span>
                    <strong>Unable to load analytics</strong>
                    <p>${mutahusSafeHtml(error.message)}</p>
                </div>
            `;
        }
    }
}

function step95PrepareMonthOptions() {
    const select = document.getElementById("analyticsMonth");
    if (!select) return;

    const periods = step82GetPaymentPeriods(
        window.step95Students || [],
        window.step95Payments || []
    );

    select.innerHTML = periods.map(period => `
        <option value="${period.key}">
            ${mutahusSafeHtml(step77PeriodLabel(period))}
        </option>
    `).join("");
}

function step95AnalyticsForPeriod(period) {
    const records = step82BuildMonthlyParentRecords(
        window.step95Students || [],
        window.step95Payments || [],
        period
    );

    const revenue = records.reduce((sum, item) => sum + Number(item.paid || 0), 0);
    const expected = records.reduce((sum, item) => sum + Number(item.expected || 0), 0);
    const outstanding = records.reduce((sum, item) => sum + Number(item.outstanding || 0), 0);

    const expenses = (window.step95Expenses || [])
        .filter(item => step94MonthKey(item.date) === period.key)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const activeStudents = (window.step95Students || []).filter(student => {
        const start = step77ParseChildStartPeriod(student.serviceStartMonth || student.createdAt);
        return student.status !== "Rejected" &&
            (!start || step77ComparePeriods(start, period) <= 0);
    });

    return {
        period,
        label: step77PeriodLabel(period),
        records,
        revenue,
        expected,
        outstanding,
        expenses,
        netProfit: revenue - expenses,
        collectionRate: expected > 0 ? revenue / expected * 100 : 0,
        activeStudents: activeStudents.length,
        activeParents: new Set(activeStudents.map(step82StudentParentKey)).size,
        averageFee: activeStudents.length
            ? activeStudents.reduce((sum, child) => sum + Number(child.monthlyAmount || 0), 0) / activeStudents.length
            : 0
    };
}

function renderBusinessAnalytics() {
    const period = step77PeriodFromKey(
        document.getElementById("analyticsMonth")?.value || ""
    );
    if (!period) return;

    const report = step95AnalyticsForPeriod(period);
    window.step95CurrentAnalytics = report;

    const previous = step95AnalyticsForPeriod(step77AddMonths(period, -1));
    const profitChange = report.netProfit - previous.netProfit;
    const revenueChange = report.revenue - previous.revenue;

    const values = {
        analyticsRevenue: step94FormatMoney(report.revenue),
        analyticsExpenses: step94FormatMoney(report.expenses),
        analyticsNetProfit: step94FormatMoney(report.netProfit),
        analyticsCollectionRate: `${report.collectionRate.toFixed(1)}%`,
        analyticsOutstanding: step94FormatMoney(report.outstanding),
        analyticsActiveStudents: report.activeStudents,
        analyticsActiveParents: report.activeParents,
        analyticsAverageFee: step94FormatMoney(report.averageFee),
        analyticsRevenueTrend: `${revenueChange >= 0 ? "↑" : "↓"} ${step94FormatMoney(Math.abs(revenueChange))}`,
        analyticsProfitTrend: `${profitChange >= 0 ? "↑" : "↓"} ${step94FormatMoney(Math.abs(profitChange))}`
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.innerText = value;
    });

    const max = Math.max(report.revenue, report.expenses, 1);
    const revenueBar = document.getElementById("analyticsRevenueBar");
    const expenseBar = document.getElementById("analyticsExpenseBar");
    if (revenueBar) revenueBar.style.width = `${report.revenue / max * 100}%`;
    if (expenseBar) expenseBar.style.width = `${report.expenses / max * 100}%`;

    const statusList = document.getElementById("analyticsPaymentStatus");
    if (statusList) {
        const statuses = [
            ["Paid", report.records.filter(r => r.status === "Paid").length],
            ["Under Review", report.records.filter(r => r.status === "Under Review").length],
            ["Partially Paid", report.records.filter(r => r.status === "Partially Paid").length],
            ["Unpaid / Rejected", report.records.filter(r => ["Unpaid", "Rejected"].includes(r.status)).length]
        ];

        statusList.innerHTML = statuses.map(([label, count]) => `
            <div>
                <span>${mutahusSafeHtml(label)}</span>
                <strong>${count}</strong>
            </div>
        `).join("");
    }

    const expenseBreakdown = document.getElementById("analyticsExpenseBreakdown");
    if (expenseBreakdown) {
        const groups = {};
        (window.step95Expenses || [])
            .filter(item => step94MonthKey(item.date) === period.key)
            .forEach(item => {
                groups[item.category] = (groups[item.category] || 0) + Number(item.amount || 0);
            });

        const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]);

        expenseBreakdown.innerHTML = entries.length
            ? entries.map(([category, amount]) => `
                <article>
                    <span>${step94ExpenseCategoryIcon(category)}</span>
                    <div>
                        <strong>${mutahusSafeHtml(category)}</strong>
                        <small>${step94FormatMoney(amount)}</small>
                    </div>
                </article>
            `).join("")
            : `
                <div class="step94-empty compact">
                    <span>📊</span>
                    <strong>No expenses for this month</strong>
                </div>
            `;
    }

    const forecastRevenue = report.expected;
    const averageExpense = [0, 1, 2].map(offset => {
        const p = step77AddMonths(period, -offset);
        return (window.step95Expenses || [])
            .filter(item => step94MonthKey(item.date) === p.key)
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    }).reduce((a, b) => a + b, 0) / 3;

    const forecast = {
        analyticsForecastRevenue: step94FormatMoney(forecastRevenue),
        analyticsForecastExpense: step94FormatMoney(averageExpense),
        analyticsForecastProfit: step94FormatMoney(forecastRevenue - averageExpense)
    };

    Object.entries(forecast).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.innerText = value;
    });
}

function exportBusinessAnalyticsCSV() {
    const report = window.step95CurrentAnalytics;
    if (!report) {
        alert("Analytics report is not ready.");
        return;
    }

    const rows = [
        ["MUTHAQUS GLOBAL ENTERPRISE", "Business Analytics"],
        ["Month", report.label],
        [],
        ["Revenue", report.revenue.toFixed(2)],
        ["Expenses", report.expenses.toFixed(2)],
        ["Net Profit", report.netProfit.toFixed(2)],
        ["Collection Rate", `${report.collectionRate.toFixed(1)}%`],
        ["Outstanding", report.outstanding.toFixed(2)],
        ["Active Students", report.activeStudents],
        ["Active Parents", report.activeParents],
        ["Average Fee", report.averageFee.toFixed(2)]
    ];

    downloadCSV(`muthaqus-business-analytics-${report.period.key}.csv`, rows);
}

(function installAdminOperationsNavigation() {
    const navItems = [
        {
            href: "admin-maintenance.html",
            label: "Maintenance",
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L4 17l3 3 7.7-8.3a4 4 0 0 0 5-5L17.4 9 15 6.6l2.3-2.3a4 4 0 0 0-2.6 2z"/>
                </svg>
            `
        },
        {
            href: "admin-analytics.html",
            label: "Analytics",
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 19V9M10 19V5M16 19v-7M22 19V2"/>
                    <path d="M2 19h21"/>
                </svg>
            `
        }
    ];

    function currentPage() {
        return String(
            window.location.pathname.split("/").pop() || ""
        ).split("?")[0].toLowerCase();
    }

    function isAdminPage() {
        const page = currentPage();
        return page.startsWith("admin-") ||
            Boolean(document.querySelector(".admin-side"));
    }

    function removeFromParentPortal() {
        document.querySelectorAll(
            '.parent-side a[href="admin-maintenance.html"], ' +
            '.parent-side a[href="admin-analytics.html"], ' +
            'body:not(.step94-maintenance-page):not(.step95-analytics-page) ' +
            '.sidebar-menu a.step98-admin-tools-link'
        ).forEach(link => {
            if (!isAdminPage()) link.remove();
        });
    }

    function normaliseAdminLinks() {
        if (!isAdminPage()) {
            removeFromParentPortal();
            return;
        }

        const page = currentPage();

        document.querySelectorAll(".admin-side .sidebar-menu").forEach(menu => {
            const settings = menu.querySelector('a[href="admin-settings.html"]');

            navItems.forEach(item => {
                let link = menu.querySelector(`a[href="${item.href}"]`);

                if (!link) {
                    link = document.createElement("a");
                    link.href = item.href;

                    if (settings) {
                        menu.insertBefore(link, settings);
                    } else {
                        menu.appendChild(link);
                    }
                }

                link.className = link.className
                    .split(/\s+/)
                    .filter(name => name && name !== "active" && name !== "step96-admin-operation-link")
                    .join(" ");

                link.classList.add("step98-admin-tools-link");

                if (page === item.href) {
                    link.classList.add("active");
                }

                link.innerHTML = `
                    <span class="step98-admin-tools-icon">${item.icon}</span>
                    <span class="step98-admin-tools-label">${item.label}</span>
                `;
            });
        });
    }

    removeFromParentPortal();
    normaliseAdminLinks();

    document.addEventListener("DOMContentLoaded", normaliseAdminLinks);
    window.addEventListener("load", normaliseAdminLinks);
    window.setTimeout(normaliseAdminLinks, 100);
})();

const MUTHAQUS_ADMIN_MAX_LOGIN_ATTEMPTS = 5;
const MUTHAQUS_ADMIN_LOCK_MINUTES = 15;

function step84FormatDateTime(value) {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("en-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function step84SecurityMessage(message, type = "info") {
    const box = document.getElementById("adminLoginSecurityStatus");
    if (!box) return;
    box.className = `step84-login-status ${type}`;
    box.innerHTML = `
        <span>${type === "danger" ? "🔒" : type === "warning" ? "⚠️" : type === "success" ? "✅" : "🛡️"}</span>
        <p>${mutahusSafeHtml(message)}</p>
    `;
    box.hidden = false;
}

function step84StartLoginLockCountdown(seconds) {
    const form = document.querySelector("form[onsubmit='adminLogin(event)']");
    const button = form?.querySelector("button[type='submit']");
    if (!button) return;

    let remaining = Math.max(1, Number(seconds || 0));
    button.disabled = true;
    button.dataset.securityLocked = "true";

    const render = () => {
        const minutes = Math.floor(remaining / 60);
        const secs = String(remaining % 60).padStart(2, "0");
        button.innerText = `Locked ${minutes}:${secs}`;
        step84SecurityMessage(
            `Too many incorrect attempts. Try again in ${minutes}:${secs}.`,
            "danger"
        );
    };

    render();
    clearInterval(window.step84LoginLockTimer);
    window.step84LoginLockTimer = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
            clearInterval(window.step84LoginLockTimer);
            button.disabled = false;
            button.dataset.securityLocked = "false";
            button.innerText = "Log In Securely";
            step84SecurityMessage(
                "The temporary lock has ended. You may try again.",
                "success"
            );
            return;
        }
        render();
    }, 1000);
}

function step84ActivityCategoryIcon(category) {
    return ({
        Security: "🛡️",
        Students: "🎒",
        Parents: "👨‍👩‍👧",
        Payments: "💳",
        Announcements: "📢",
        Rules: "📘",
        Backup: "💾",
        System: "⚙️"
    })[category] || "⚙️";
}

async function loadAdminSecurityOverview() {
    const admin = getCurrentAdmin();
    if (!admin) return;

    try {
        const response = await fetch(
            "/api/admin-dashboard?action=admin-security&username=" +
            encodeURIComponent(admin.username || "admin")
        );
        const result = await response.json();
        if (!result.success) return;

        const security = result.security || {};
        const values = {
            adminLastLoginDisplay: step84FormatDateTime(security.lastLoginAt),
            adminFailedAttemptsDisplay: Number(security.failedLoginAttempts || 0),
            adminLockStatusDisplay: security.isLocked ? "Temporarily Locked" : "Protected",
            adminSecurityLastLogin: step84FormatDateTime(security.lastLoginAt),
            adminSecurityTodayActions: Number(security.todayActions || 0)
        };

        Object.entries(values).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        });

        const badge = document.getElementById("adminLockStatusDisplay");
        if (badge) badge.className = security.isLocked ? "badge rejected" : "badge paid";
    } catch (error) {
        console.warn("Security overview unavailable:", error.message);
    }
}

async function loadAdminActivityLog() {
    const list = document.getElementById("adminActivityList");
    if (!list) return;

    list.innerHTML = `
        <div class="step84-activity-empty">
            <span>⏳</span>
            <strong>Loading activity history...</strong>
        </div>
    `;

    try {
        const response = await fetch("/api/admin-dashboard?action=activity-log&limit=250");
        const result = await response.json();
        if (!result.success) throw new Error(result.message || "Failed to load activity history.");

        window.muthaqusAdminActivity = result.activities || [];
        const summary = result.summary || {};
        const values = {
            activityTodayCount: summary.today || 0,
            activitySecurityCount: summary.security || 0,
            activityDataCount: summary.dataChanges || 0,
            activityTotalCount: summary.total || 0
        };

        Object.entries(values).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        });

        renderAdminActivityLog();
    } catch (error) {
        list.innerHTML = `
            <div class="step84-activity-empty">
                <span>⚠️</span>
                <strong>Unable to load activity history</strong>
                <p>${mutahusSafeHtml(error.message)}</p>
            </div>
        `;
    }
}

function renderAdminActivityLog() {
    const list = document.getElementById("adminActivityList");
    if (!list) return;

    const query = String(document.getElementById("activitySearchInput")?.value || "")
        .trim().toLowerCase();
    const category = document.getElementById("activityCategoryFilter")?.value || "";
    const selectedDate = document.getElementById("activityDateFilter")?.value || "";

    const activities = (window.muthaqusAdminActivity || []).filter(item => {
        const text = [
            item.action, item.category, item.target, item.details,
            item.adminName, item.adminUsername
        ].filter(Boolean).join(" ").toLowerCase();

        const date = item.createdAt ? new Date(item.createdAt) : null;
        const key = date && !Number.isNaN(date.getTime())
            ? [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, "0"),
                String(date.getDate()).padStart(2, "0")
              ].join("-")
            : "";

        return (!query || text.includes(query)) &&
               (!category || item.category === category) &&
               (!selectedDate || key === selectedDate);
    });

    const visible = document.getElementById("activityVisibleCount");
    if (visible) visible.innerText = activities.length;

    if (!activities.length) {
        list.innerHTML = `
            <div class="step84-activity-empty">
                <span>🗂️</span>
                <strong>No matching activity</strong>
                <p>Try changing the search, category or date.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = activities.map(item => `
        <article class="step84-activity-item">
            <span class="step84-activity-icon">${step84ActivityCategoryIcon(item.category)}</span>
            <div class="step84-activity-content">
                <div>
                    <strong>${mutahusSafeHtml(item.action || "Admin action")}</strong>
                    <span class="step84-category">${mutahusSafeHtml(item.category || "System")}</span>
                </div>
                <p>${mutahusSafeHtml(item.details || "Action completed.")}</p>
                <footer>
                    <span>👤 ${mutahusSafeHtml(item.adminName || item.adminUsername || "Admin")}</span>
                    ${item.target ? `<span>🎯 ${mutahusSafeHtml(item.target)}</span>` : ""}
                    <time>${mutahusSafeHtml(step84FormatDateTime(item.createdAt))}</time>
                </footer>
            </div>
        </article>
    `).join("");
}

function resetAdminActivityFilters() {
    const ids = ["activitySearchInput", "activityCategoryFilter", "activityDateFilter"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    renderAdminActivityLog();
}

function exportAdminActivityLogCSV() {
    const activities = window.muthaqusAdminActivity || [];
    if (!activities.length) {
        alert("No activity history is available.");
        return;
    }

    const rows = [[
        "Date and Time", "Admin", "Category", "Action", "Target", "Details"
    ]];

    activities.forEach(item => {
        rows.push([
            step84FormatDateTime(item.createdAt),
            item.adminName || item.adminUsername || "Admin",
            item.category || "System",
            item.action || "",
            item.target || "",
            item.details || ""
        ]);
    });

    downloadCSV(`muthaqus-admin-activity-${todayFileDate()}.csv`, rows);
}

function step84DescribeAdminMutation(url, body) {
    const path = String(url || "");

    if (path.includes("/api/update-student-status")) {
        if (body.action === "update-amount") {
            return {
                category: "Students",
                action: "Monthly fee updated",
                target: `Student ${body.studentId || ""}`,
                details: `Monthly fee changed to RM${Number(body.monthlyAmount || 0).toFixed(2)}.`
            };
        }
        if (body.action === "update-service-start") {
            return {
                category: "Students",
                action: "Service start updated",
                target: `Student ${body.studentId || ""}`,
                details: `Service start month changed to ${body.serviceStartMonth || "-"}.`
            };
        }
        if (body.action === "remove-student") {
            return {
                category: "Students",
                action: "Student removed",
                target: `Student ${body.studentId || ""}`,
                details: "Student and related records were removed."
            };
        }
        return {
            category: "Students",
            action: "Student status updated",
            target: `Student ${body.studentId || ""}`,
            details: `Status changed to ${body.status || "-"}.`
        };
    }

    if (path.includes("/api/update-payment-status")) {
        return {
            category: "Payments",
            action: "Payment status updated",
            target: `Payment ${body.paymentId || ""}`,
            details: `Status changed to ${body.status || "-"}.`
        };
    }

    if (path.includes("/api/admin-parents")) {
        if (body.action === "delete-parent") {
            return {
                category: "Parents",
                action: "Parent account removed",
                target: `Parent ${body.parentId || ""}`,
                details: "Parent account and related records were removed."
            };
        }
        return {
            category: "Parents",
            action: "Parent status updated",
            target: `Parent ${body.parentId || ""}`,
            details: `Status changed to ${body.status || "-"}.`
        };
    }

    if (path.includes("/api/admin-dashboard")) {
        const map = {
            "post-announcement": {
                category: "Announcements",
                action: "Announcement published",
                target: body.title || "Announcement",
                details: "A new announcement was published."
            },
            "update-announcement-status": {
                category: "Announcements",
                action: "Announcement status updated",
                target: body.announcementId || "Announcement",
                details: `Status changed to ${body.status || "-"}.`
            },
            "delete-announcement": {
                category: "Announcements",
                action: "Announcement removed",
                target: body.announcementId || "Announcement",
                details: "An announcement was removed."
            },
            "save-rule": {
                category: "Rules",
                action: body.ruleId ? "Rule updated" : "Rule added",
                target: body.title || "Rule",
                details: "Rules information was saved."
            },
            "delete-rule": {
                category: "Rules",
                action: "Rule removed",
                target: body.ruleId || "Rule",
                details: "A rule was removed."
            },
            "reset-rules": {
                category: "Rules",
                action: "Rules reset",
                target: "Rules",
                details: "Default rules were restored."
            }
        };
        return map[body.action] || null;
    }

    return null;
}

async function step84RecordActivity(activity) {
    const admin = getCurrentAdmin();
    if (!admin || !activity) return;

    try {
        await window.__muthaqusOriginalFetch("/api/admin-dashboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...activity,
                activityAction: activity.action || "Admin action",
                action: "record-activity",
                adminUsername: admin.username || "admin",
                adminName: admin.name || "Admin"
            }),
            keepalive: true
        });
    } catch (error) {
        console.warn("Activity record skipped:", error.message);
    }
}

(function installAdminActivityTracking() {
    if (window.__muthaqusAdminActivityTracking) return;
    window.__muthaqusAdminActivityTracking = true;

    const originalFetch = window.fetch.bind(window);
    window.__muthaqusOriginalFetch = originalFetch;

    window.fetch = async function(input, options = {}) {
        const response = await originalFetch(input, options);

        try {
            const url = typeof input === "string" ? input : input?.url || "";
            const method = String(
                options.method || (typeof input !== "string" ? input?.method : "GET") || "GET"
            ).toUpperCase();

            if (method !== "POST" || !getCurrentAdmin()) return response;

            let body = {};
            if (typeof options.body === "string") {
                try { body = JSON.parse(options.body); } catch (error) { body = {}; }
            }

            if ([
                "record-activity", "admin-login",
                "change-admin-password", "restore-backup"
            ].includes(body.action)) {
                return response;
            }

            const result = await response.clone().json().catch(() => null);
            if (!result?.success) return response;

            const activity = step84DescribeAdminMutation(url, body);
            if (activity) setTimeout(() => step84RecordActivity(activity), 0);
        } catch (error) {
            console.warn("Activity tracking skipped:", error.message);
        }

        return response;
    };
})();

async function adminLogin(event) {
    event.preventDefault();

    const submitButton = event.target.querySelector("button[type='submit']");
    if (submitButton?.dataset.securityLocked === "true") return;

    const originalText = submitButton ? submitButton.innerText : "";
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Checking account...";
    }

    const loginData = {
        action: "admin-login",
        username: document.getElementById("adminUsername").value.trim(),
        password: document.getElementById("adminPassword").value
    };

    try {
        const response = await fetch("/api/admin-dashboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (!result.success) {
            if (result.locked && result.remainingSeconds) {
                step84StartLoginLockCountdown(result.remainingSeconds);
                return;
            }

            const remaining = Number(result.attemptsRemaining);
            step84SecurityMessage(
                Number.isFinite(remaining)
                    ? `${result.message} ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
                    : (result.message || "Invalid admin username or password."),
                remaining <= 2 ? "warning" : "danger"
            );
            return;
        }

        localStorage.setItem(VS.adminKey, JSON.stringify(result.admin));
        localStorage.setItem("muthaqus_admin_last_activity", String(Date.now()));

        step84SecurityMessage(
            "Login successful. Opening Admin Control...",
            "success"
        );

        setTimeout(() => {
            window.location.href = "admin-dashboard.html";
        }, 350);
    } catch (error) {
        step84SecurityMessage("Login error: " + error.message, "danger");
    } finally {
        if (submitButton && submitButton.dataset.securityLocked !== "true") {
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
        renderStep70ProfileSummary(currentParent);

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

    const values = {
        adminNameDisplay: admin.name || "Admin",
        adminUsernameDisplay: admin.username || "admin",
        adminRoleDisplay: admin.role || "admin",
        adminStatusDisplay: admin.status || "Active"
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.innerText = value;
    });

    loadAdminSecurityOverview();
    loadAdminActivityLog();
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


function step89BackupCount(backup, key) {
    if (backup?.counts && Number.isFinite(Number(backup.counts[key]))) {
        return Number(backup.counts[key]);
    }

    return Array.isArray(backup?.[key])
        ? backup[key].length
        : 0;
}

function step89ValidateBackup(backup) {
    if (!backup || typeof backup !== "object") {
        throw new Error("The selected file is not a valid backup.");
    }

    const system = String(backup.system || "").toUpperCase();

    if (!system.includes("MUTHAQUS") && !system.includes("MUTAHUS")) {
        throw new Error("This file does not appear to be a MUTHAQUS system backup.");
    }

    const required = ["parents", "students", "payments", "announcements", "rules"];
    const missing = required.filter(key => !Array.isArray(backup[key]));

    if (missing.length) {
        throw new Error(`Backup is missing: ${missing.join(", ")}.`);
    }

    return true;
}

function step89RenderBackupPreview(backup, fileName) {
    const preview = document.getElementById("backupRestorePreview");
    const button = document.getElementById("restoreBackupButton");
    if (!preview) return;

    const counts = {
        parents: step89BackupCount(backup, "parents"),
        students: step89BackupCount(backup, "students"),
        payments: step89BackupCount(backup, "payments"),
        announcements: step89BackupCount(backup, "announcements"),
        rules: step89BackupCount(backup, "rules"),
        activities: step89BackupCount(backup, "adminActivityLogs")
    };

    preview.hidden = false;
    preview.innerHTML = `
        <header>
            <span>📦</span>
            <div>
                <strong>${mutahusSafeHtml(fileName)}</strong>
                <small>Exported: ${mutahusSafeHtml(step84FormatDateTime(backup.exportedAt))}</small>
            </div>
            <b>Ready</b>
        </header>

        <div class="step89-preview-counts">
            <div><span>${counts.parents}</span><small>Parents</small></div>
            <div><span>${counts.students}</span><small>Students</small></div>
            <div><span>${counts.payments}</span><small>Payments</small></div>
            <div><span>${counts.announcements}</span><small>Notices</small></div>
            <div><span>${counts.rules}</span><small>Rules</small></div>
            <div><span>${counts.activities}</span><small>Activities</small></div>
        </div>

        <p>
            Large receipt images may not be included.
            Existing matching receipt images are preserved during restore.
        </p>
    `;

    if (button) button.disabled = false;
}

async function handleBackupFileSelection(event) {
    const file = event.target.files?.[0];
    const preview = document.getElementById("backupRestorePreview");
    const button = document.getElementById("restoreBackupButton");

    if (!file) {
        window.step89SelectedBackup = null;
        if (preview) preview.hidden = true;
        if (button) button.disabled = true;
        return;
    }

    try {
        const backup = JSON.parse(await file.text());
        step89ValidateBackup(backup);
        window.step89SelectedBackup = backup;
        step89RenderBackupPreview(backup, file.name);
    } catch (error) {
        window.step89SelectedBackup = null;
        event.target.value = "";
        if (preview) preview.hidden = true;
        if (button) button.disabled = true;
        alert("Backup file error: " + error.message);
    }
}

function clearBackupRestoreSelection() {
    const input = document.getElementById("backupRestoreFile");
    const preview = document.getElementById("backupRestorePreview");
    const button = document.getElementById("restoreBackupButton");
    const confirmation = document.getElementById("restoreConfirmation");
    const checkbox = document.getElementById("restoreSafetyCheck");

    if (input) input.value = "";
    if (preview) preview.hidden = true;
    if (button) button.disabled = true;
    if (confirmation) confirmation.value = "";
    if (checkbox) checkbox.checked = false;

    window.step89SelectedBackup = null;
}

async function restoreSystemBackup() {
    const admin = requireAdminLogin();
    const backup = window.step89SelectedBackup;
    if (!admin) return;

    if (!backup) {
        alert("Please select and preview a backup file first.");
        return;
    }

    const mode = document.getElementById("restoreMode")?.value || "merge";
    const confirmation = String(
        document.getElementById("restoreConfirmation")?.value || ""
    ).trim().toUpperCase();
    const safetyChecked = Boolean(
        document.getElementById("restoreSafetyCheck")?.checked
    );

    if (!safetyChecked) {
        alert("Confirm that a current backup has been downloaded first.");
        return;
    }

    if (confirmation !== "RESTORE MUTHAQUS") {
        alert('Type "RESTORE MUTHAQUS" exactly to continue.');
        return;
    }

    const warning = mode === "replace"
        ? "Replace current operational records with this backup? This is a major change."
        : "Merge this backup with current records? Matching records will be updated.";

    if (!confirm(warning)) return;

    const button = document.getElementById("restoreBackupButton");
    const originalText = button?.innerText || "";

    if (button) {
        button.disabled = true;
        button.innerText = "Restoring records...";
    }

    try {
        const response = await fetch("/api/admin-dashboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "restore-backup",
                mode,
                confirmation,
                adminUsername: admin.username || "admin",
                adminName: admin.name || "Admin",
                backup
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "Restore failed.");
        }

        const warningText = Array.isArray(result.warnings) && result.warnings.length
            ? "\n\nNotes:\n- " + result.warnings.join("\n- ")
            : "";

        alert("Backup restored successfully." + warningText);
        clearBackupRestoreSelection();
        loadAdminSecurityOverview();
        loadAdminActivityLog();
    } catch (error) {
        alert("Restore error: " + error.message);
    } finally {
        if (button) {
            button.disabled = !window.step89SelectedBackup;
            button.innerText = originalText;
        }
    }
}

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

    const confirmBackup = confirm(
        "Download a secure JSON backup of accounts, students, payments, announcements, rules and recent activity?"
    );

    if (!confirmBackup) return;

    try {
        const response = await fetch(
            "/api/admin-dashboard?action=backup&username=" +
            encodeURIComponent(admin.username || "admin")
        );
        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Failed to download system backup.");
            return;
        }

        downloadJSON(
            `muthaqus-secure-backup-${todayBackupDate()}.json`,
            result.backup
        );

        alert("Secure backup downloaded successfully. Keep the file private.");
        loadAdminActivityLog();
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
    /*
     * Step 82 already contains the complete student search, filters
     * and parent sorting inside the Family Records section.
     *
     * Remove the old automatically injected search panel so the page
     * only displays one organised search area.
     */
    document
        .querySelectorAll("#studentFilterPanel")
        .forEach(panel => panel.remove());

    if (
        typeof renderAdminStudentCards ===
        "function"
    ) {
        renderAdminStudentCards();
    }
}

function applyStudentFilters() {
    document
        .querySelectorAll("#studentFilterPanel")
        .forEach(panel => panel.remove());

    if (
        typeof renderAdminStudentCards ===
        "function"
    ) {
        renderAdminStudentCards();
    }
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

function mutahusPdfStyledText(
    x,
    y,
    size,
    value,
    bold = false,
    color = "0.10 0.20 0.32"
) {
    const font = bold ? "F2" : "F1";

    return (
        `BT /${font} ${size} Tf ${color} rg ` +
        `${x} ${y} Td (${mutahusPdfAscii(value)}) Tj ET\n`
    );
}

function mutahusPdfFilledRect(
    x,
    y,
    width,
    height,
    fillColor
) {
    return `${fillColor} rg ${x} ${y} ${width} ${height} re f\n`;
}

function mutahusPdfStrokedRect(
    x,
    y,
    width,
    height,
    strokeColor = "0.82 0.88 0.94",
    lineWidth = 1
) {
    return (
        `${strokeColor} RG ${lineWidth} w ` +
        `${x} ${y} ${width} ${height} re S\n`
    );
}

function mutahusPdfLine(
    x1,
    y1,
    x2,
    y2,
    color = "0.82 0.88 0.94",
    lineWidth = 1
) {
    return (
        `${color} RG ${lineWidth} w ` +
        `${x1} ${y1} m ${x2} ${y2} l S\n`
    );
}

function mutahusPdfCircle(
    centerX,
    centerY,
    radius,
    fillColor
) {
    const control = radius * 0.5522847498;

    return (
        `${fillColor} rg ` +
        `${centerX + radius} ${centerY} m ` +
        `${centerX + radius} ${centerY + control} ` +
        `${centerX + control} ${centerY + radius} ` +
        `${centerX} ${centerY + radius} c ` +
        `${centerX - control} ${centerY + radius} ` +
        `${centerX - radius} ${centerY + control} ` +
        `${centerX - radius} ${centerY} c ` +
        `${centerX - radius} ${centerY - control} ` +
        `${centerX - control} ${centerY - radius} ` +
        `${centerX} ${centerY - radius} c ` +
        `${centerX + control} ${centerY - radius} ` +
        `${centerX + radius} ${centerY - control} ` +
        `${centerX + radius} ${centerY} c f\n`
    );
}

function mutahusInvoiceDisplayDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function mutahusInvoiceShortText(value, maxLength = 44) {
    const text = String(value ?? "").trim();

    if (text.length <= maxLength) {
        return text || "-";
    }

    return text.slice(0, Math.max(1, maxLength - 3)) + "...";
}

function mutahusBuildInvoicePdf(payment) {
    const invoiceNumber = `MGE-INV-${String(payment.id || Date.now())
        .replace(/[^a-z0-9]/gi, "")
        .slice(-10)
        .toUpperCase()}`;

    const paidDateValue =
        payment.reviewedAt ||
        payment.updatedAt ||
        payment.datePaid ||
        payment.createdAt ||
        new Date();

    const issueDate =
        mutahusInvoiceDisplayDate(paidDateValue);

    const servicePeriod =
        payment.month || "Monthly Service";

    const studentName =
        payment.studentName ||
        payment.studentNames ||
        "All registered children";

    const parentName =
        payment.parentName || "Parent";

    const parentPhone =
        payment.parentPhone || "-";

    const parentEmail =
        payment.parentEmail || "-";

    const amount =
        Number(payment.amount || 0).toFixed(2);

    const paymentReference =
        mutahusInvoiceShortText(
            payment.id || "-",
            24
        );

    const receiptName =
        mutahusInvoiceShortText(
            payment.receiptName || "Uploaded receipt",
            55
        );

    const description =
        `School van service fee`;

    const noteLines = mutahusPdfWrap(
        payment.note ||
            "Thank you. This document confirms that the monthly school van service payment has been approved.",
        78
    ).slice(0, 4);

    const parentNameLines =
        mutahusPdfWrap(parentName, 34).slice(0, 2);

    const studentLines =
        mutahusPdfWrap(studentName, 54).slice(0, 2);

    let stream = "";

    const navy = "0.055 0.235 0.405";
    const blue = "0.105 0.390 0.685";
    const green = "0.070 0.650 0.300";
    const paleBlue = "0.950 0.976 1.000";
    const paleGreen = "0.935 0.995 0.958";
    const darkText = "0.085 0.185 0.300";
    const mutedText = "0.365 0.455 0.545";
    const white = "1 1 1";

    // Premium header.
    stream += mutahusPdfFilledRect(
        0,
        738,
        595,
        104,
        navy
    );

    stream += mutahusPdfFilledRect(
        0,
        730,
        595,
        8,
        green
    );

    // Minimal van-style brand mark.
    stream += mutahusPdfFilledRect(
        44,
        778,
        46,
        30,
        white
    );

    stream += mutahusPdfFilledRect(
        50,
        789,
        28,
        13,
        blue
    );

    stream += mutahusPdfFilledRect(
        79,
        783,
        7,
        19,
        green
    );

    stream += mutahusPdfCircle(
        56,
        776,
        5,
        "0.10 0.20 0.32"
    );

    stream += mutahusPdfCircle(
        80,
        776,
        5,
        "0.10 0.20 0.32"
    );

    stream += mutahusPdfStyledText(
        104,
        802,
        16,
        "MUTHAQUS GLOBAL ENTERPRISE",
        true,
        white
    );

    stream += mutahusPdfStyledText(
        104,
        782,
        9,
        "Reliable School Van Service",
        false,
        "0.78 0.88 0.97"
    );

    stream += mutahusPdfStyledText(
        393,
        804,
        9,
        "PAYMENT DOCUMENT",
        true,
        "0.68 0.84 0.98"
    );

    stream += mutahusPdfStyledText(
        393,
        781,
        22,
        "INVOICE",
        true,
        white
    );

    // Paid status pill.
    stream += mutahusPdfFilledRect(
        454,
        747,
        98,
        25,
        green
    );

    stream += mutahusPdfStyledText(
        484,
        755,
        10,
        "PAID",
        true,
        white
    );

    // Invoice metadata strip.
    stream += mutahusPdfFilledRect(
        42,
        664,
        511,
        46,
        paleBlue
    );

    stream += mutahusPdfStrokedRect(
        42,
        664,
        511,
        46
    );

    stream += mutahusPdfStyledText(
        56,
        692,
        8,
        "INVOICE NUMBER",
        true,
        mutedText
    );

    stream += mutahusPdfStyledText(
        56,
        676,
        10,
        invoiceNumber,
        true,
        darkText
    );

    stream += mutahusPdfLine(
        220,
        672,
        220,
        702
    );

    stream += mutahusPdfStyledText(
        238,
        692,
        8,
        "ISSUE DATE",
        true,
        mutedText
    );

    stream += mutahusPdfStyledText(
        238,
        676,
        10,
        issueDate,
        true,
        darkText
    );

    stream += mutahusPdfLine(
        366,
        672,
        366,
        702
    );

    stream += mutahusPdfStyledText(
        384,
        692,
        8,
        "SERVICE PERIOD",
        true,
        mutedText
    );

    stream += mutahusPdfStyledText(
        384,
        676,
        10,
        mutahusInvoiceShortText(
            servicePeriod,
            24
        ),
        true,
        darkText
    );

    // Bill To card.
    stream += mutahusPdfFilledRect(
        42,
        556,
        247,
        88,
        white
    );

    stream += mutahusPdfStrokedRect(
        42,
        556,
        247,
        88
    );

    stream += mutahusPdfFilledRect(
        42,
        632,
        247,
        12,
        blue
    );

    stream += mutahusPdfStyledText(
        56,
        614,
        9,
        "BILL TO",
        true,
        blue
    );

    let parentY = 596;

    parentNameLines.forEach((line, index) => {
        stream += mutahusPdfStyledText(
            56,
            parentY - index * 15,
            index === 0 ? 12 : 10,
            line,
            true,
            darkText
        );
    });

    const parentDetailsY =
        parentNameLines.length > 1
            ? 560
            : 572;

    stream += mutahusPdfStyledText(
        56,
        parentDetailsY,
        8.5,
        parentPhone,
        false,
        mutedText
    );

    stream += mutahusPdfStyledText(
        146,
        parentDetailsY,
        8.5,
        mutahusInvoiceShortText(
            parentEmail,
            28
        ),
        false,
        mutedText
    );

    // Payment summary card.
    stream += mutahusPdfFilledRect(
        306,
        556,
        247,
        88,
        paleGreen
    );

    stream += mutahusPdfStrokedRect(
        306,
        556,
        247,
        88,
        "0.72 0.88 0.78"
    );

    stream += mutahusPdfFilledRect(
        306,
        632,
        247,
        12,
        green
    );

    stream += mutahusPdfStyledText(
        320,
        614,
        9,
        "PAYMENT SUMMARY",
        true,
        green
    );

    stream += mutahusPdfStyledText(
        320,
        594,
        8,
        "STATUS",
        true,
        mutedText
    );

    stream += mutahusPdfStyledText(
        320,
        578,
        11,
        "PAID",
        true,
        green
    );

    stream += mutahusPdfStyledText(
        409,
        594,
        8,
        "REFERENCE",
        true,
        mutedText
    );

    stream += mutahusPdfStyledText(
        409,
        578,
        9,
        paymentReference,
        true,
        darkText
    );

    // Service item table.
    stream += mutahusPdfFilledRect(
        42,
        500,
        511,
        34,
        navy
    );

    stream += mutahusPdfStyledText(
        56,
        512,
        9,
        "SERVICE DESCRIPTION",
        true,
        white
    );

    stream += mutahusPdfStyledText(
        459,
        512,
        9,
        "AMOUNT",
        true,
        white
    );

    stream += mutahusPdfFilledRect(
        42,
        407,
        511,
        93,
        white
    );

    stream += mutahusPdfStrokedRect(
        42,
        407,
        511,
        93
    );

    stream += mutahusPdfStyledText(
        56,
        477,
        11,
        description,
        true,
        darkText
    );

    stream += mutahusPdfStyledText(
        56,
        458,
        8,
        `Service period: ${servicePeriod}`,
        false,
        mutedText
    );

    let studentY = 439;

    studentLines.forEach(line => {
        stream += mutahusPdfStyledText(
            56,
            studentY,
            8.5,
            `Student: ${line}`,
            false,
            mutedText
        );

        studentY -= 14;
    });

    stream += mutahusPdfStyledText(
        453,
        458,
        12,
        `RM ${amount}`,
        true,
        darkText
    );

    // Total paid card.
    stream += mutahusPdfFilledRect(
        337,
        342,
        216,
        48,
        navy
    );

    stream += mutahusPdfStyledText(
        354,
        371,
        8,
        "TOTAL PAYMENT",
        true,
        "0.70 0.84 0.96"
    );

    stream += mutahusPdfStyledText(
        354,
        352,
        12,
        "TOTAL PAID",
        true,
        white
    );

    stream += mutahusPdfStyledText(
        470,
        355,
        16,
        `RM ${amount}`,
        true,
        white
    );

    // Payment details panel.
    stream += mutahusPdfFilledRect(
        42,
        252,
        511,
        70,
        paleBlue
    );

    stream += mutahusPdfStrokedRect(
        42,
        252,
        511,
        70
    );

    stream += mutahusPdfStyledText(
        56,
        303,
        10,
        "PAYMENT DETAILS",
        true,
        darkText
    );

    stream += mutahusPdfStyledText(
        56,
        283,
        8,
        "PAYMENT MONTH",
        true,
        mutedText
    );

    stream += mutahusPdfStyledText(
        56,
        267,
        9.5,
        servicePeriod,
        true,
        darkText
    );

    stream += mutahusPdfStyledText(
        218,
        283,
        8,
        "DATE APPROVED",
        true,
        mutedText
    );

    stream += mutahusPdfStyledText(
        218,
        267,
        9.5,
        issueDate,
        true,
        darkText
    );

    stream += mutahusPdfStyledText(
        382,
        283,
        8,
        "RECEIPT FILE",
        true,
        mutedText
    );

    stream += mutahusPdfStyledText(
        382,
        267,
        8.5,
        receiptName,
        true,
        darkText
    );

    // Confirmation note.
    stream += mutahusPdfFilledRect(
        42,
        159,
        511,
        72,
        white
    );

    stream += mutahusPdfStrokedRect(
        42,
        159,
        511,
        72
    );

    stream += mutahusPdfFilledRect(
        42,
        159,
        7,
        72,
        green
    );

    stream += mutahusPdfStyledText(
        62,
        211,
        10,
        "PAYMENT CONFIRMATION",
        true,
        darkText
    );

    let noteY = 192;

    noteLines.forEach(line => {
        stream += mutahusPdfStyledText(
            62,
            noteY,
            8.5,
            line,
            false,
            mutedText
        );

        noteY -= 14;
    });

    // Footer.
    stream += mutahusPdfLine(
        42,
        114,
        553,
        114,
        "0.78 0.85 0.91"
    );

    stream += mutahusPdfStyledText(
        42,
        91,
        9,
        "MUTHAQUS GLOBAL ENTERPRISE",
        true,
        darkText
    );

    stream += mutahusPdfStyledText(
        42,
        75,
        8,
        "School Van Service  |  Contact: 017-8078271",
        false,
        mutedText
    );

    stream += mutahusPdfStyledText(
        42,
        49,
        7.5,
        "This electronic invoice confirms an approved payment and does not require a signature.",
        false,
        mutedText
    );

    stream += mutahusPdfStyledText(
        505,
        49,
        7.5,
        "1 / 1",
        true,
        mutedText
    );

    const objects = [];

    objects[1] =
        "<< /Type /Catalog /Pages 2 0 R >>";

    objects[2] =
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";

    objects[3] =
        "<< /Type /Page /Parent 2 0 R " +
        "/MediaBox [0 0 595 842] " +
        "/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> " +
        "/Contents 4 0 R >>";

    objects[4] =
        `<< /Length ${stream.length} >>\n` +
        `stream\n${stream}endstream`;

    objects[5] =
        "<< /Type /Font /Subtype /Type1 " +
        "/BaseFont /Helvetica >>";

    objects[6] =
        "<< /Type /Font /Subtype /Type1 " +
        "/BaseFont /Helvetica-Bold >>";

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    for (let index = 1; index <= 6; index += 1) {
        offsets[index] = pdf.length;
        pdf += (
            `${index} 0 obj\n` +
            `${objects[index]}\n` +
            `endobj\n`
        );
    }

    const xrefOffset = pdf.length;

    pdf += "xref\n0 7\n";
    pdf += "0000000000 65535 f \n";

    for (let index = 1; index <= 6; index += 1) {
        pdf += (
            `${String(offsets[index]).padStart(10, "0")} ` +
            "00000 n \n"
        );
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
                        Loading dashboard securely...
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
function step82PaymentMonthKey(payment) {
    const period =
        step77ParsePaymentPeriod(
            payment.month
        );

    return period
        ? period.key
        : "other";
}

function step82GetPaymentPeriods(
    students,
    payments
) {
    const current =
        getCurrentPaymentPeriod();

    const currentPeriod = {
        year: current.year,
        month: current.month,
        key: step77MonthKey(
            current.year,
            current.month
        )
    };

    const candidates = [
        ...(students || []).map(student =>
            step77ParseChildStartPeriod(
                student.serviceStartMonth ||
                student.createdAt
            )
        ),
        ...step80ExpandArrearsPayments(
            payments || []
        ).map(payment =>
            step77ParsePaymentPeriod(
                payment.month
            )
        )
    ]
        .filter(Boolean)
        .filter(period =>
            step77ComparePeriods(
                period,
                currentPeriod
            ) <= 0
        );

    const earliest =
        candidates.length > 0
            ? candidates
                .slice()
                .sort(
                    step77ComparePeriods
                )[0]
            : currentPeriod;

    return step77BuildMonthRange(
        earliest,
        currentPeriod
    ).reverse();
}

function step82PreparePaymentMonthOptions() {
    const select =
        document.getElementById(
            "monthlyTrackerMonth"
        );

    if (!select) return;

    const previousValue =
        select.value;

    const periods =
        step82GetPaymentPeriods(
            window.adminStudentsForArrears ||
                [],
            window.adminPaymentsData ||
                []
        );

    select.innerHTML =
        periods
            .map(period => `
                <option value="${period.key}">
                    ${mutahusSafeHtml(
                        step77PeriodLabel(
                            period
                        )
                    )}
                </option>
            `)
            .join("");

    const current =
        getCurrentPaymentPeriod();

    const currentKey =
        step77MonthKey(
            current.year,
            current.month
        );

    select.value =
        periods.some(period =>
            period.key === previousValue
        )
            ? previousValue
            : (
                periods.some(period =>
                    period.key === currentKey
                )
                    ? currentKey
                    : periods[0]?.key || ""
            );
}

function step82BuildMonthlyParentRecords(
    students,
    payments,
    selectedPeriod
) {
    if (!selectedPeriod) return [];

    const expandedPayments =
        step77UniquePayments(
            step80ExpandArrearsPayments(
                payments || []
            )
        );

    const familyMap = new Map();

    (students || [])
        .filter(student =>
            student.status !== "Rejected"
        )
        .forEach(student => {
            const start =
                step77ParseChildStartPeriod(
                    student.serviceStartMonth ||
                    student.createdAt
                );

            if (
                start &&
                step77ComparePeriods(
                    start,
                    selectedPeriod
                ) > 0
            ) {
                return;
            }

            const key =
                step80GetParentKey(
                    student
                );

            if (!key) return;

            if (!familyMap.has(key)) {
                familyMap.set(key, {
                    key,
                    parentId:
                        student.parentId || "",
                    parentName:
                        student.parentName ||
                        "Parent",
                    parentPhone:
                        student.parentPhone ||
                        "",
                    parentEmail:
                        student.parentEmail ||
                        "",
                    children: []
                });
            }

            familyMap.get(key)
                .children.push(student);
        });

    const monthPayments =
        expandedPayments.filter(payment => {
            const period =
                step77ParsePaymentPeriod(
                    payment.month
                );

            return (
                period?.key ===
                selectedPeriod.key
            );
        });

    const records = [];

    familyMap.forEach(family => {
        const parentPayments =
            monthPayments.filter(
                payment =>
                    step80GetParentKey(
                        payment
                    ) === family.key
            );

        const expected =
            family.children.reduce(
                (sum, child) =>
                    sum +
                    Number(
                        child.monthlyAmount ||
                        0
                    ),
                0
            );

        if (expected <= 0) return;

        const totalForStatus =
            paymentStatus =>
                parentPayments
                    .filter(payment =>
                        payment.status ===
                        paymentStatus
                    )
                    .reduce(
                        (sum, payment) =>
                            sum +
                            Number(
                                payment.amount ||
                                0
                            ),
                        0
                    );

        const paid =
            totalForStatus("Paid");

        const pending =
            totalForStatus("Pending");

        const rejected =
            totalForStatus("Rejected");

        const remaining =
            Math.max(
                0,
                expected - paid
            );

        let status =
            "Unpaid";

        if (paid >= expected) {
            status = "Paid";
        } else if (
            remaining > 0 &&
            pending >= remaining
        ) {
            status = "Under Review";
        } else if (paid > 0) {
            status = "Partially Paid";
        } else if (rejected > 0) {
            status = "Rejected";
        }

        records.push({
            ...family,
            period: selectedPeriod,
            expected,
            paid,
            pending,
            rejected,
            outstanding:
                Math.max(
                    0,
                    expected -
                    paid -
                    pending
                ),
            status,
            payments: parentPayments
        });
    });

    return records.sort(
        (first, second) =>
            first.parentName.localeCompare(
                second.parentName
            )
    );
}

function step82MonthlyStatusClass(status) {
    if (status === "Paid") return "paid";
    if (status === "Under Review")
        return "review";
    if (status === "Partially Paid")
        return "partial";
    if (status === "Rejected")
        return "rejected";
    return "unpaid";
}

function step82MonthlyAccountCard(
    record,
    recordId
) {
    const statusClass =
        step82MonthlyStatusClass(
            record.status
        );

    const initial = String(
        record.parentName || "P"
    )
        .trim()
        .charAt(0)
        .toUpperCase();

    return `
        <article class="step82-month-account-card ${statusClass}">
            <header>
                <div class="step82-month-parent">
                    <span>
                        ${mutahusSafeHtml(initial)}
                    </span>

                    <div>
                        <strong>
                            ${mutahusSafeHtml(
                                record.parentName
                            )}
                        </strong>

                        <small>
                            ${mutahusSafeHtml(
                                record.parentPhone ||
                                record.parentEmail ||
                                "No contact"
                            )}
                        </small>
                    </div>
                </div>

                <span class="step82-month-status ${statusClass}">
                    ${mutahusSafeHtml(
                        record.status
                    )}
                </span>
            </header>

            <div class="step82-month-amounts">
                <div>
                    <small>Expected</small>
                    <strong>
                        RM${record.expected.toFixed(2)}
                    </strong>
                </div>

                <div>
                    <small>Paid</small>
                    <strong>
                        RM${record.paid.toFixed(2)}
                    </strong>
                </div>

                <div>
                    <small>Pending</small>
                    <strong>
                        RM${record.pending.toFixed(2)}
                    </strong>
                </div>

                <div>
                    <small>Balance</small>
                    <strong>
                        RM${record.outstanding.toFixed(2)}
                    </strong>
                </div>
            </div>

            <div class="step82-month-children">
                ${record.children
                    .map(child => `
                        <span>
                            🎒 ${mutahusSafeHtml(
                                child.name ||
                                "Student"
                            )}
                        </span>
                    `)
                    .join("")}
            </div>

            <footer>
                <button
                    type="button"
                    onclick="step82FilterMonthlyPayments('${recordId}')"
                >
                    View Payments
                </button>

                ${
                    record.status !== "Paid"
                        ? `
                            <button
                                type="button"
                                class="reminder"
                                onclick="step82WhatsAppMonthlyPayment('${recordId}')"
                            >
                                WhatsApp Reminder
                            </button>
                        `
                        : ""
                }
            </footer>
        </article>
    `;
}

function renderAdminMonthlyPaymentTracker() {
    const unpaidList =
        document.getElementById(
            "monthlyUnpaidList"
        );

    const statusList =
        document.getElementById(
            "monthlyPaymentStatusList"
        );

    if (!unpaidList || !statusList) {
        return;
    }

    const selectedKey =
        document.getElementById(
            "monthlyTrackerMonth"
        )?.value || "";

    const selectedPeriod =
        step77PeriodFromKey(
            selectedKey
        );

    const query = String(
        document.getElementById(
            "monthlyTrackerSearch"
        )?.value || ""
    )
        .trim()
        .toLowerCase();

    const statusFilter =
        document.getElementById(
            "monthlyTrackerStatus"
        )?.value || "";

    const allRecords =
        step82BuildMonthlyParentRecords(
            window.adminStudentsForArrears ||
                [],
            window.adminPaymentsData ||
                [],
            selectedPeriod
        );

    const filtered = allRecords.filter(
        record => {
            const text = [
                record.parentName,
                record.parentPhone,
                record.parentEmail,
                ...record.children.map(
                    child => child.name
                )
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !query ||
                text.includes(query);

            const matchesStatus =
                !statusFilter ||
                record.status ===
                    statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        }
    );

    const expectedTotal =
        allRecords.reduce(
            (sum, record) =>
                sum + record.expected,
            0
        );

    const paidTotal =
        allRecords.reduce(
            (sum, record) =>
                sum + record.paid,
            0
        );

    const pendingTotal =
        allRecords.reduce(
            (sum, record) =>
                sum + record.pending,
            0
        );

    const unpaidRecords =
        filtered.filter(record =>
            [
                "Unpaid",
                "Partially Paid",
                "Rejected"
            ].includes(record.status)
        );

    const submittedRecords =
        filtered.filter(record =>
            [
                "Paid",
                "Under Review"
            ].includes(record.status)
        );

    const values = {
        monthlyExpectedTotal:
            `RM${expectedTotal.toFixed(2)}`,
        monthlyPaidTotal:
            `RM${paidTotal.toFixed(2)}`,
        monthlyPendingTotal:
            `RM${pendingTotal.toFixed(2)}`,
        monthlyUnpaidCount:
            allRecords.filter(record =>
                [
                    "Unpaid",
                    "Partially Paid",
                    "Rejected"
                ].includes(record.status)
            ).length,
        monthlyUnpaidVisibleCount:
            unpaidRecords.length,
        monthlySubmittedVisibleCount:
            submittedRecords.length
    };

    Object.entries(values).forEach(
        ([id, value]) => {
            const element =
                document.getElementById(id);

            if (element) {
                element.innerText =
                    value;
            }
        }
    );

    window.step82MonthlyPaymentMap = {};

    const registerRecord =
        record => {
            const id =
                `monthly_${
                    Object.keys(
                        window
                            .step82MonthlyPaymentMap
                    ).length
                }`;

            window.step82MonthlyPaymentMap[
                id
            ] = record;

            return id;
        };

    unpaidList.innerHTML =
        unpaidRecords.length
            ? unpaidRecords
                .map(record =>
                    step82MonthlyAccountCard(
                        record,
                        registerRecord(record)
                    )
                )
                .join("")
            : `
                <div class="step82-month-empty success">
                    <span>✅</span>
                    <strong>
                        No unpaid account
                    </strong>
                    <p>
                        Every matching parent has
                        paid or submitted a receipt.
                    </p>
                </div>
            `;

    statusList.innerHTML =
        submittedRecords.length
            ? submittedRecords
                .map(record =>
                    step82MonthlyAccountCard(
                        record,
                        registerRecord(record)
                    )
                )
                .join("")
            : `
                <div class="step82-month-empty">
                    <span>💳</span>
                    <strong>
                        No paid or submitted record
                    </strong>
                    <p>
                        Payment activity for this
                        month will appear here.
                    </p>
                </div>
            `;
}

function resetAdminMonthlyTrackerFilters() {
    const search =
        document.getElementById(
            "monthlyTrackerSearch"
        );

    const status =
        document.getElementById(
            "monthlyTrackerStatus"
        );

    if (search) search.value = "";
    if (status) status.value = "";

    renderAdminMonthlyPaymentTracker();
}

function step82MonthlyReminderText(record) {
    return (
        `Assalamualaikum ${record.parentName}, ` +
        `bayaran servis van untuk ` +
        `${step77PeriodLabel(record.period)} ` +
        `masih berbaki ` +
        `RM${record.outstanding.toFixed(2)}. ` +
        `Sila semak Parent Portal dan ` +
        `muat naik bukti bayaran. ` +
        `Terima kasih.`
    );
}

function step82WhatsAppMonthlyPayment(
    recordId
) {
    const record =
        (window.step82MonthlyPaymentMap ||
            {})[recordId];

    if (!record) {
        alert(
            "Monthly payment record not found."
        );
        return;
    }

    const phone =
        step80NormalisePhone(
            record.parentPhone
        );

    if (!phone) {
        alert(
            "Parent phone number is not available."
        );
        return;
    }

    window.open(
        `https://api.whatsapp.com/send?phone=${phone}` +
        `&text=${encodeURIComponent(
            step82MonthlyReminderText(
                record
            )
        )}`,
        "_blank",
        "noopener"
    );
}

function step82FilterMonthlyPayments(
    recordId
) {
    const record =
        (window.step82MonthlyPaymentMap ||
            {})[recordId];

    if (!record) return;

    const search =
        document.getElementById(
            "paymentRecordSearch"
        );

    const status =
        document.getElementById(
            "paymentRecordStatus"
        );

    if (search) {
        search.value =
            record.parentName;
    }

    if (status) {
        status.value = "";
    }

    renderAdminPaymentRecords();

    document
        .getElementById(
            "paymentRecordsSection"
        )
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}

function step82PaymentRecordCard(payment) {
    const sourcePaymentId =
        payment.sourcePaymentId ||
        payment.id;

    const badgeClass =
        getPaymentBadgeClass(
            payment.status
        );

    const paid =
        payment.status === "Paid";

    const rejected =
        payment.status === "Rejected";

    const initial = String(
        payment.parentName || "P"
    )
        .trim()
        .charAt(0)
        .toUpperCase();

    const invoice = paid
        ? `
            <button
                class="small-btn invoice-admin-btn"
                type="button"
                onclick="downloadPaymentInvoice('${sourcePaymentId}', 'admin')"
            >
                PDF Invoice
            </button>
        `
        : "";

    return `
        <article class="step82-payment-record-card">
            <header>
                <div class="step82-payment-person">
                    <span>
                        ${mutahusSafeHtml(initial)}
                    </span>

                    <div>
                        <strong>
                            ${mutahusSafeHtml(
                                payment.parentName ||
                                "-"
                            )}
                        </strong>

                        <small>
                            ${mutahusSafeHtml(
                                payment.parentPhone ||
                                ""
                            )}
                        </small>
                    </div>
                </div>

                <div class="step93-payment-badges">
                    <span class="badge ${badgeClass}">
                        ${mutahusSafeHtml(
                            payment.status ||
                            "Pending"
                        )}
                    </span>

                    ${
                        step93IsDuplicatePayment(payment)
                            ? `
                                <span class="step93-duplicate-badge">
                                    Possible Duplicate
                                </span>
                            `
                            : `
                                <span class="step93-safe-badge">
                                    Checked
                                </span>
                            `
                    }
                </div>
            </header>

            <div class="step82-payment-record-info">
                <div>
                    <small>Student</small>
                    <strong>
                        ${mutahusSafeHtml(
                            payment.studentName ||
                            "All registered children"
                        )}
                    </strong>
                </div>

                <div>
                    <small>Amount</small>
                    <strong>
                        RM${Number(
                            payment.amount || 0
                        ).toFixed(2)}
                    </strong>
                </div>

                <div>
                    <small>Receipt</small>
                    <strong>
                        ${mutahusSafeHtml(
                            payment.receiptName ||
                            "No receipt file"
                        )}
                    </strong>
                </div>
            </div>

            <div class="step82-payment-record-actions">
                <button
                    class="receipt-button"
                    type="button"
                    onclick="viewAdminReceipt('${sourcePaymentId}')"
                >
                    View Receipt
                </button>

                <button
                    class="small-btn edit payment-action-btn"
                    data-id="${sourcePaymentId}"
                    data-status="Paid"
                    ${paid ? "disabled" : ""}
                >
                    Approve
                </button>

                <button
                    class="small-btn warning payment-action-btn"
                    data-id="${sourcePaymentId}"
                    data-status="Pending"
                    ${
                        payment.status ===
                        "Pending"
                            ? "disabled"
                            : ""
                    }
                >
                    Pending
                </button>

                <button
                    class="small-btn danger payment-action-btn"
                    data-id="${sourcePaymentId}"
                    data-status="Rejected"
                    ${
                        rejected
                            ? "disabled"
                            : ""
                    }
                >
                    Reject
                </button>

                ${invoice}
            </div>
        </article>
    `;
}

function renderAdminPaymentRecords() {
    const container =
        document.getElementById(
            "adminPaymentMonthGroups"
        );

    if (!container) return;

    const query = String(
        document.getElementById(
            "paymentRecordSearch"
        )?.value || ""
    )
        .trim()
        .toLowerCase();

    const statusFilter =
        document.getElementById(
            "paymentRecordStatus"
        )?.value || "";

    const sortMode =
        document.getElementById(
            "paymentMonthSort"
        )?.value || "newest";

    const expandedPayments =
        step80ExpandArrearsPayments(
            window.adminPaymentsData ||
            []
        );

    const records =
        expandedPayments.filter(payment => {
            const text = [
                payment.parentName,
                payment.parentPhone,
                payment.parentEmail,
                payment.studentName,
                payment.month,
                payment.receiptName,
                payment.status
            ]
                .join(" ")
                .toLowerCase();

            return (
                (!query ||
                    text.includes(query)) &&
                (!statusFilter ||
                    payment.status ===
                    statusFilter)
            );
        });

    const count =
        document.getElementById(
            "paymentVisibleCount"
        );

    if (count) {
        count.innerText =
            records.length;
    }

    container.innerHTML = "";

    if (!records.length) {
        container.innerHTML = `
            <div class="step82-month-empty">
                <span>💳</span>
                <strong>
                    No payment record matches
                </strong>
                <p>
                    Try another search,
                    month order or status.
                </p>
            </div>
        `;
        return;
    }

    const groups = new Map();

    records.forEach(payment => {
        const period =
            step77ParsePaymentPeriod(
                payment.month
            );

        const key =
            period?.key || "other";

        if (!groups.has(key)) {
            groups.set(key, {
                key,
                period,
                label:
                    period
                        ? step77PeriodLabel(
                            period
                        )
                        : "Other / Combined Records",
                records: []
            });
        }

        groups.get(key)
            .records.push(payment);
    });

    const groupList =
        Array.from(groups.values());

    groupList.sort((first, second) => {
        if (!first.period) return 1;
        if (!second.period) return -1;

        const comparison =
            step77ComparePeriods(
                first.period,
                second.period
            );

        return sortMode === "oldest"
            ? comparison
            : -comparison;
    });

    groupList.forEach(
        (group, index) => {
            const paidCount =
                group.records.filter(
                    payment =>
                        payment.status ===
                        "Paid"
                ).length;

            const pendingCount =
                group.records.filter(
                    payment =>
                        payment.status ===
                        "Pending"
                ).length;

            const totalAmount =
                group.records.reduce(
                    (sum, payment) =>
                        sum +
                        Number(
                            payment.amount ||
                            0
                        ),
                    0
                );

            container.innerHTML += `
                <details
                    class="step82-payment-month-group"
                    ${
                        index === 0 ||
                        query ||
                        statusFilter
                            ? "open"
                            : ""
                    }
                >
                    <summary>
                        <div class="step82-payment-month-heading">
                            <span>📅</span>

                            <div>
                                <small>
                                    PAYMENT MONTH
                                </small>

                                <h3>
                                    ${mutahusSafeHtml(
                                        group.label
                                    )}
                                </h3>
                            </div>
                        </div>

                        <div class="step82-payment-month-summary">
                            <span>
                                ${group.records.length}
                                Records
                            </span>

                            <span class="paid">
                                ${paidCount} Paid
                            </span>

                            <span class="pending">
                                ${pendingCount} Review
                            </span>

                            <strong>
                                RM${totalAmount.toFixed(2)}
                            </strong>

                            <b>⌄</b>
                        </div>
                    </summary>

                    <div class="step82-payment-record-grid">
                        ${group.records
                            .map(payment =>
                                step82PaymentRecordCard(
                                    payment
                                )
                            )
                            .join("")}
                    </div>
                </details>
            `;
        }
    );

    connectPaymentButtons();
}
function resetPaymentRecordFilters() {
    const search =
        document.getElementById(
            "paymentRecordSearch"
        );

    const status =
        document.getElementById(
            "paymentRecordStatus"
        );

    const sort =
        document.getElementById(
            "paymentMonthSort"
        );

    if (search) search.value = "";
    if (status) status.value = "";
    if (sort) sort.value = "newest";

    renderAdminPaymentRecords();
}
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



/* =========================================================
   MUTHAQUS_STEP68_PARENT_DETAILS_MODAL_POLISH
   ========================================================= */

function viewParentDetailReceipt(paymentId) {
    const payment =
        (window.parentDetailPaymentMap || {})[paymentId];

    if (!payment) {
        alert("Payment record not found. Please reopen Parent Details.");
        return;
    }

    showReceiptInfo(
        payment.receiptName || "",
        payment.note || "",
        payment.receiptDataUrl || ""
    );
}

function downloadParentDetailInvoice(paymentId) {
    const payment =
        (window.parentDetailPaymentMap || {})[paymentId];

    if (!payment) {
        alert("Payment record not found. Please reopen Parent Details.");
        return;
    }

    window.adminPaymentInvoiceMap =
        window.adminPaymentInvoiceMap || {};

    window.adminPaymentInvoiceMap[paymentId] = payment;

    downloadPaymentInvoice(paymentId, "admin");
}

document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;

    const modal = document.getElementById("parentDetailModal");

    if (modal?.classList.contains("show")) {
        closeParentDetails();
    }
});

// MUTHAQUS_STEP68_PARENT_DETAILS_MODAL_POLISH



/* =========================================================
   MUTHAQUS_STEP69_AUTO_SIGN_OUT_SECURITY

   Security policy:
   - Auto sign out after 15 minutes without user activity.
   - Warning appears during the final 60 seconds.
   - Works for both Admin and Parent protected pages.
   - Activity is shared between tabs using localStorage.
   ========================================================= */
(function () {
    "use strict";

    if (window.__muthaqusStep69Loaded) return;
    window.__muthaqusStep69Loaded = true;

    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
    const WARNING_DURATION_MS = 60 * 1000;
    const CHECK_INTERVAL_MS = 1000;
    const ACTIVITY_WRITE_THROTTLE_MS = 15000;

    const ADMIN_SESSION_KEY = "vansystem_admin_logged_in";
    const PARENT_SESSION_KEY = "vansystem_current_parent";

    const ADMIN_ACTIVITY_KEY = "muthaqus_admin_last_activity";
    const PARENT_ACTIVITY_KEY = "muthaqus_parent_last_activity";

    const ADMIN_PROTECTED_PAGES = new Set([
        "admin-dashboard.html",
        "admin-students.html",
        "admin-parents.html",
        "admin-payments.html",
        "admin-announcements.html",
        "admin-rules.html",
        "admin-settings.html"
    ]);

    const PARENT_PROTECTED_PAGES = new Set([
        "parent-dashboard.html",
        "parent-profile.html",
        "add-student.html",
        "upload-payment.html",
        "parent-rules.html"
    ]);

    let activeSession = null;
    let lastActivityWrite = 0;
    let countdownTimer = null;
    let securityCheckTimer = null;
    let isSigningOut = false;

    function currentPage() {
        return (
            window.location.pathname.split("/").pop() ||
            "index.html"
        );
    }

    function getSessionConfiguration() {
        const page = currentPage();

        if (
            ADMIN_PROTECTED_PAGES.has(page) &&
            localStorage.getItem(ADMIN_SESSION_KEY)
        ) {
            return {
                role: "admin",
                sessionKey: ADMIN_SESSION_KEY,
                activityKey: ADMIN_ACTIVITY_KEY,
                loginPage: "admin-login.html"
            };
        }

        if (
            PARENT_PROTECTED_PAGES.has(page) &&
            localStorage.getItem(PARENT_SESSION_KEY)
        ) {
            return {
                role: "parent",
                sessionKey: PARENT_SESSION_KEY,
                activityKey: PARENT_ACTIVITY_KEY,
                loginPage: "parent-login.html"
            };
        }

        return null;
    }

    function getLastActivity() {
        if (!activeSession) return 0;

        const stored = Number(
            localStorage.getItem(activeSession.activityKey)
        );

        return Number.isFinite(stored) ? stored : 0;
    }

    function setLastActivity(force = false) {
        if (!activeSession || isSigningOut) return;

        const now = Date.now();

        if (
            !force &&
            now - lastActivityWrite < ACTIVITY_WRITE_THROTTLE_MS
        ) {
            return;
        }

        lastActivityWrite = now;
        localStorage.setItem(
            activeSession.activityKey,
            String(now)
        );

        hideSecurityWarning();
    }

    function formatRemainingTime(milliseconds) {
        const totalSeconds = Math.max(
            0,
            Math.ceil(milliseconds / 1000)
        );

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return (
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0")
        );
    }

    function warningMessage() {
        return activeSession?.role === "admin"
            ? "Your admin session will end soon to protect system and parent data."
            : "Your parent session will end soon to protect your account information.";
    }

    function createSecurityWarning() {
        let modal = document.getElementById(
            "muthaqusSecurityWarning"
        );

        if (modal) return modal;

        modal = document.createElement("div");
        modal.id = "muthaqusSecurityWarning";
        modal.className = "muthaqus-security-warning";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute(
            "aria-label",
            "Session expiry warning"
        );

        modal.innerHTML = `
            <div class="muthaqus-security-card">
                <div class="muthaqus-security-icon">🔒</div>

                <span class="muthaqus-security-kicker">
                    SECURITY TIMEOUT
                </span>

                <h2>Are you still there?</h2>

                <p id="muthaqusSecurityMessage"></p>

                <div class="muthaqus-security-countdown">
                    <small>Automatic sign out in</small>
                    <strong id="muthaqusSecurityCountdown">
                        01:00
                    </strong>
                </div>

                <div class="muthaqus-security-actions">
                    <button
                        type="button"
                        class="btn btn-primary-pro"
                        id="muthaqusStaySignedIn"
                    >
                        Stay Signed In
                    </button>

                    <button
                        type="button"
                        class="btn btn-outline-pro"
                        id="muthaqusSignOutNow"
                    >
                        Sign Out Now
                    </button>
                </div>

                <small class="muthaqus-security-note">
                    Activity such as clicking, typing or scrolling
                    keeps the session active.
                </small>
            </div>
        `;

        modal
            .querySelector("#muthaqusStaySignedIn")
            ?.addEventListener("click", function () {
                setLastActivity(true);
                hideSecurityWarning();
            });

        modal
            .querySelector("#muthaqusSignOutNow")
            ?.addEventListener("click", function () {
                expireSession("manual-timeout");
            });

        document.body.appendChild(modal);

        return modal;
    }

    function showSecurityWarning(remainingTime) {
        const modal = createSecurityWarning();
        const message = modal.querySelector(
            "#muthaqusSecurityMessage"
        );
        const countdown = modal.querySelector(
            "#muthaqusSecurityCountdown"
        );

        if (message) {
            message.textContent = warningMessage();
        }

        if (countdown) {
            countdown.textContent =
                formatRemainingTime(remainingTime);
        }

        modal.classList.add("show");
        document.body.classList.add(
            "muthaqus-security-warning-open"
        );

        modal
            .querySelector("#muthaqusStaySignedIn")
            ?.focus();
    }

    function hideSecurityWarning() {
        const modal = document.getElementById(
            "muthaqusSecurityWarning"
        );

        modal?.classList.remove("show");
        document.body.classList.remove(
            "muthaqus-security-warning-open"
        );
    }

    function showExpiredNotice() {
        const parameters = new URLSearchParams(
            window.location.search
        );

        if (parameters.get("reason") !== "timeout") return;

        const notice = document.createElement("div");
        notice.className = "muthaqus-session-expired-notice";
        notice.innerHTML = `
            <span>🔒</span>
            <div>
                <strong>Session expired</strong>
                <p>
                    You were automatically signed out after
                    15 minutes of inactivity.
                </p>
            </div>

            <button
                type="button"
                aria-label="Close notice"
            >
                ×
            </button>
        `;

        notice
            .querySelector("button")
            ?.addEventListener("click", () => {
                notice.remove();
            });

        document.body.appendChild(notice);

        const cleanUrl =
            window.location.pathname +
            window.location.hash;

        window.history.replaceState(
            {},
            document.title,
            cleanUrl
        );

        window.setTimeout(() => {
            notice.classList.add("show");
        }, 60);

        window.setTimeout(() => {
            notice.classList.remove("show");

            window.setTimeout(() => {
                notice.remove();
            }, 350);
        }, 7000);
    }

    function expireSession(reason = "timeout") {
        if (!activeSession || isSigningOut) return;

        isSigningOut = true;

        localStorage.removeItem(activeSession.sessionKey);
        localStorage.removeItem(activeSession.activityKey);

        hideSecurityWarning();

        window.location.replace(
            activeSession.loginPage +
            "?reason=" +
            encodeURIComponent(reason)
        );
    }

    function checkSessionSecurity() {
        if (!activeSession || isSigningOut) return;

        if (!localStorage.getItem(activeSession.sessionKey)) {
            expireSession("timeout");
            return;
        }

        const lastActivity = getLastActivity();

        if (!lastActivity) {
            setLastActivity(true);
            return;
        }

        const elapsedTime = Date.now() - lastActivity;
        const remainingTime =
            INACTIVITY_TIMEOUT_MS - elapsedTime;

        if (remainingTime <= 0) {
            expireSession("timeout");
            return;
        }

        if (remainingTime <= WARNING_DURATION_MS) {
            showSecurityWarning(remainingTime);
        } else {
            hideSecurityWarning();
        }
    }

    function registerActivityListeners() {
        const activityEvents = [
            "pointerdown",
            "keydown",
            "touchstart",
            "scroll"
        ];

        activityEvents.forEach(eventName => {
            window.addEventListener(
                eventName,
                function (event) {
                    if (
                        event.isTrusted === false ||
                        !activeSession
                    ) {
                        return;
                    }

                    setLastActivity(false);
                },
                {
                    capture: true,
                    passive: eventName !== "keydown"
                }
            );
        });

        document.addEventListener(
            "visibilitychange",
            function () {
                if (
                    document.visibilityState !== "visible" ||
                    !activeSession
                ) {
                    return;
                }

                checkSessionSecurity();

                if (!isSigningOut) {
                    setLastActivity(true);
                }
            }
        );

        window.addEventListener("focus", function () {
            if (!activeSession) return;

            checkSessionSecurity();

            if (!isSigningOut) {
                setLastActivity(true);
            }
        });

        window.addEventListener("storage", function (event) {
            if (!activeSession) return;

            if (event.key === activeSession.sessionKey) {
                if (!event.newValue) {
                    expireSession("timeout");
                }
                return;
            }

            if (event.key === activeSession.activityKey) {
                hideSecurityWarning();
                checkSessionSecurity();
            }
        });
    }

    function startSecurityMonitor() {
        activeSession = getSessionConfiguration();

        if (!activeSession) return;

        const lastActivity = getLastActivity();

        if (
            !lastActivity ||
            Date.now() - lastActivity >=
                INACTIVITY_TIMEOUT_MS
        ) {
            setLastActivity(true);
        }

        registerActivityListeners();
        checkSessionSecurity();

        securityCheckTimer = window.setInterval(
            checkSessionSecurity,
            CHECK_INTERVAL_MS
        );
    }

    document.addEventListener(
        "DOMContentLoaded",
        function () {
            showExpiredNotice();
            startSecurityMonitor();
        }
    );

    window.addEventListener("beforeunload", function () {
        if (securityCheckTimer) {
            window.clearInterval(securityCheckTimer);
        }

        if (countdownTimer) {
            window.clearInterval(countdownTimer);
        }
    });
})();

// MUTHAQUS_STEP69_AUTO_SIGN_OUT_SECURITY



/* =========================================================
   MUTHAQUS_STEP70_PARENT_DUE_PROFILE_CHILD_RULES_POLISH
   ========================================================= */

const MUTHAQUS_PAYMENT_DUE_DAY = 7;

function getMalaysiaDateParts() {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kuala_Lumpur",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });

    const values = {};

    formatter.formatToParts(new Date()).forEach(part => {
        if (part.type !== "literal") {
            values[part.type] = part.value;
        }
    });

    return {
        year: Number(values.year),
        month: Number(values.month),
        day: Number(values.day)
    };
}

function getCurrentPaymentPeriod() {
    const parts = getMalaysiaDateParts();

    const date = new Date(
        Date.UTC(parts.year, parts.month - 1, 1)
    );

    const monthName = new Intl.DateTimeFormat("en-MY", {
        month: "long",
        timeZone: "UTC"
    }).format(date);

    return {
        year: parts.year,
        month: parts.month,
        day: parts.day,
        monthName,
        label: `${monthName} ${parts.year}`,
        isoPrefix:
            `${parts.year}-${String(parts.month).padStart(2, "0")}`
    };
}

function paymentMatchesCurrentPeriod(payment, period) {
    const value = String(payment?.month || "")
        .trim()
        .toLowerCase();

    if (!value) return false;

    const compactValue = value.replace(/\s+/g, " ");

    return (
        compactValue.includes(period.label.toLowerCase()) ||
        compactValue.includes(period.isoPrefix) ||
        (
            compactValue.includes(
                period.monthName.toLowerCase()
            ) &&
            compactValue.includes(String(period.year))
        )
    );
}

function getBestCurrentPayment(payments, period) {
    const currentPayments = payments.filter(payment =>
        paymentMatchesCurrentPeriod(payment, period)
    );

    const statusPriority = {
        Paid: 4,
        Pending: 3,
        Rejected: 2,
        Unpaid: 1
    };

    return currentPayments
        .slice()
        .sort((first, second) => {
            const statusDifference =
                (statusPriority[second.status] || 0) -
                (statusPriority[first.status] || 0);

            if (statusDifference !== 0) {
                return statusDifference;
            }

            return (
                new Date(second.createdSort || second.createdAt || 0) -
                new Date(first.createdSort || first.createdAt || 0)
            );
        })[0] || null;
}

function step77MonthKey(year, month) {
    return `${Number(year)}-${String(Number(month)).padStart(2, "0")}`;
}

function step77PeriodFromKey(key) {
    const match = String(key || "").match(/^(\d{4})-(\d{2})$/);

    if (!match) return null;

    return {
        year: Number(match[1]),
        month: Number(match[2]),
        key: step77MonthKey(match[1], match[2])
    };
}

function step77PeriodLabel(period, short = false) {
    if (!period) return "-";

    const date = new Date(
        Date.UTC(period.year, period.month - 1, 1)
    );

    return new Intl.DateTimeFormat("en-MY", {
        month: short ? "short" : "long",
        year: "numeric",
        timeZone: "UTC"
    }).format(date);
}

function step77ComparePeriods(first, second) {
    return (
        first.year * 12 + first.month -
        (second.year * 12 + second.month)
    );
}

function step77AddMonths(period, amount) {
    const date = new Date(
        Date.UTC(period.year, period.month - 1 + amount, 1)
    );

    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        key: step77MonthKey(
            date.getUTCFullYear(),
            date.getUTCMonth() + 1
        )
    };
}

function step77ParsePaymentPeriod(value) {
    const text = String(value || "").trim();

    if (!text) return null;

    const isoMatch = text.match(/\b(\d{4})[-/](0?[1-9]|1[0-2])\b/);

    if (isoMatch) {
        return {
            year: Number(isoMatch[1]),
            month: Number(isoMatch[2]),
            key: step77MonthKey(isoMatch[1], isoMatch[2])
        };
    }

    const monthNames = {
        january: 1,
        jan: 1,
        february: 2,
        feb: 2,
        march: 3,
        mar: 3,
        april: 4,
        apr: 4,
        may: 5,
        june: 6,
        jun: 6,
        july: 7,
        jul: 7,
        august: 8,
        aug: 8,
        september: 9,
        sep: 9,
        sept: 9,
        october: 10,
        oct: 10,
        november: 11,
        nov: 11,
        december: 12,
        dec: 12
    };

    const normalised = text
        .toLowerCase()
        .replace(/[.,]/g, " ")
        .replace(/\s+/g, " ");

    const yearMatch = normalised.match(/\b(20\d{2})\b/);

    if (!yearMatch) return null;

    const monthEntry = Object.entries(monthNames).find(
        ([monthName]) =>
            new RegExp(`\\b${monthName}\\b`, "i").test(normalised)
    );

    if (!monthEntry) return null;

    return {
        year: Number(yearMatch[1]),
        month: Number(monthEntry[1]),
        key: step77MonthKey(
            yearMatch[1],
            monthEntry[1]
        )
    };
}

function step77ParseChildStartPeriod(value) {
    if (!value) return null;

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return {
            year: value.getFullYear(),
            month: value.getMonth() + 1,
            key: step77MonthKey(
                value.getFullYear(),
                value.getMonth() + 1
            )
        };
    }

    const text = String(value).trim();

    const dayFirstMatch = text.match(
        /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
    );

    if (dayFirstMatch) {
        return {
            year: Number(dayFirstMatch[3]),
            month: Number(dayFirstMatch[2]),
            key: step77MonthKey(
                dayFirstMatch[3],
                dayFirstMatch[2]
            )
        };
    }

    const isoMatch = text.match(
        /^(\d{4})-(\d{1,2})(?:-\d{1,2})?/
    );

    if (isoMatch) {
        return {
            year: Number(isoMatch[1]),
            month: Number(isoMatch[2]),
            key: step77MonthKey(
                isoMatch[1],
                isoMatch[2]
            )
        };
    }

    const parsedDate = new Date(text);

    if (!Number.isNaN(parsedDate.getTime())) {
        return {
            year: parsedDate.getFullYear(),
            month: parsedDate.getMonth() + 1,
            key: step77MonthKey(
                parsedDate.getFullYear(),
                parsedDate.getMonth() + 1
            )
        };
    }

    return step77ParsePaymentPeriod(text);
}

function step77UniquePayments(payments) {
    const seen = new Set();

    return payments.filter(payment => {
        const uniqueKey = String(
            payment.id ||
            [
                payment.month,
                payment.amount,
                payment.studentId,
                payment.studentName,
                payment.receiptName,
                payment.createdAt
            ].join("|")
        );

        if (seen.has(uniqueKey)) {
            return false;
        }

        seen.add(uniqueKey);
        return true;
    });
}

function step77ExpectedAmountForPeriod(
    children,
    targetPeriod,
    fallbackStartPeriod
) {
    return children.reduce((sum, child) => {
        const amount = Number(child.monthlyAmount || 0);

        if (amount <= 0) return sum;

        const childStart =
            step77ParseChildStartPeriod(
                child.serviceStartMonth ||
                child.createdAt
            ) ||
            fallbackStartPeriod;

        if (
            childStart &&
            step77ComparePeriods(childStart, targetPeriod) > 0
        ) {
            return sum;
        }

        return sum + amount;
    }, 0);
}

function step77BuildMonthRange(startPeriod, endPeriod) {
    if (!startPeriod || !endPeriod) return [];

    const periods = [];
    let cursor = {
        year: startPeriod.year,
        month: startPeriod.month,
        key: startPeriod.key
    };

    /*
     * Maximum 36 months prevents accidental huge reminders when old
     * or invalid dates exist.
     */
    while (
        step77ComparePeriods(cursor, endPeriod) <= 0 &&
        periods.length < 36
    ) {
        periods.push(cursor);
        cursor = step77AddMonths(cursor, 1);
    }

    return periods;
}

function step77EnsureArrearsBreakdown(card, dateText) {
    let breakdown = document.getElementById(
        "paymentDueBreakdown"
    );

    if (breakdown) return breakdown;

    breakdown = document.createElement("div");
    breakdown.id = "paymentDueBreakdown";
    breakdown.className = "step77-due-breakdown";
    breakdown.hidden = true;

    dateText.insertAdjacentElement("afterend", breakdown);

    return breakdown;
}

function step77RenderArrearsBreakdown(
    breakdown,
    outstandingMonths,
    pendingPastMonths = []
) {
    if (!breakdown) return;

    const visibleOutstanding = outstandingMonths.slice(-4);
    const hiddenOutstandingCount = Math.max(
        0,
        outstandingMonths.length - visibleOutstanding.length
    );

    const outstandingRows = visibleOutstanding
        .map(item => `
            <article class="step98-arrears-row overdue">
                <div class="step98-arrears-row-main">
                    <span class="step98-arrears-row-icon">📅</span>
                    <div>
                        <strong>${mutahusSafeHtml(step77PeriodLabel(item.period))}</strong>
                        <small>Outstanding payment</small>
                    </div>
                </div>

                <b class="step98-arrears-value">
                    RM${Number(item.outstanding || 0).toFixed(2)}
                </b>
            </article>
        `)
        .join("");

    const pendingRows = pendingPastMonths
        .slice(-2)
        .map(item => `
            <article class="step98-arrears-row review">
                <div class="step98-arrears-row-main">
                    <span class="step98-arrears-row-icon">⏳</span>
                    <div>
                        <strong>${mutahusSafeHtml(step77PeriodLabel(item.period))}</strong>
                        <small>Receipt submitted</small>
                    </div>
                </div>

                <b class="step98-arrears-value">
                    Under Review
                </b>
            </article>
        `)
        .join("");

    const moreRow = hiddenOutstandingCount > 0
        ? `
            <article class="step98-arrears-row more">
                <div class="step98-arrears-row-main">
                    <span class="step98-arrears-row-icon">＋</span>
                    <div>
                        <strong>
                            ${hiddenOutstandingCount} earlier unpaid
                            ${hiddenOutstandingCount === 1 ? "month" : "months"}
                        </strong>
                        <small>Included in the total outstanding balance</small>
                    </div>
                </div>

                <b class="step98-arrears-value">
                    +${hiddenOutstandingCount}
                </b>
            </article>
        `
        : "";

    const totalMonths =
        outstandingMonths.length + pendingPastMonths.length;

    breakdown.className =
        "step77-due-breakdown step98-arrears-panel";

    breakdown.innerHTML = `
        <header class="step98-arrears-panel-head">
            <div class="step98-arrears-heading">
                <span>!</span>
                <div>
                    <strong>Payment breakdown</strong>
                    <small>Every outstanding month is listed clearly below.</small>
                </div>
            </div>

            <b class="step98-arrears-count">
                ${totalMonths}
                ${totalMonths === 1 ? "month" : "months"}
            </b>
        </header>

        <div class="step98-arrears-list">
            ${outstandingRows}
            ${pendingRows}
            ${moreRow}
        </div>
    `;
}

function renderParentPaymentDueReminder(children, payments) {
    const card = document.getElementById("paymentDueCard");
    const amount = document.getElementById("paymentDueAmount");
    const status = document.getElementById("paymentDueStatus");
    const dateText = document.getElementById("paymentDueDate");
    const monthText = document.getElementById("paymentDueMonth");
    const action = document.getElementById("paymentDueAction");

    if (!card || !amount || !status || !dateText) return;

    const currentPeriod = getCurrentPaymentPeriod();

    const currentPeriodInfo = {
        year: currentPeriod.year,
        month: currentPeriod.month,
        key: step77MonthKey(
            currentPeriod.year,
            currentPeriod.month
        )
    };

    const eligibleChildren = children.filter(
        child => child.status !== "Rejected"
    );

    const uniquePayments =
        step77UniquePayments(
            step80ExpandArrearsPayments(payments)
        );

    const paymentPeriods = uniquePayments
        .map(payment => step77ParsePaymentPeriod(payment.month))
        .filter(Boolean);

    const childStartPeriods = eligibleChildren
        .map(child =>
            step77ParseChildStartPeriod(
                child.serviceStartMonth ||
                child.createdAt
            )
        )
        .filter(Boolean);

    const possibleStartPeriods = [
        ...paymentPeriods,
        ...childStartPeriods
    ].filter(period =>
        step77ComparePeriods(period, currentPeriodInfo) <= 0
    );

    const earliestStartPeriod =
        possibleStartPeriods.length > 0
            ? possibleStartPeriods
                .slice()
                .sort(step77ComparePeriods)[0]
            : currentPeriodInfo;

    const monthRange = step77BuildMonthRange(
        earliestStartPeriod,
        currentPeriodInfo
    );

    const paymentGroups = new Map();

    uniquePayments.forEach(payment => {
        const period = step77ParsePaymentPeriod(
            payment.month
        );

        if (!period) return;

        if (!paymentGroups.has(period.key)) {
            paymentGroups.set(period.key, []);
        }

        paymentGroups.get(period.key).push(payment);
    });

    const monthSummaries = monthRange.map(period => {
        const monthPayments =
            paymentGroups.get(period.key) || [];

        const expected = step77ExpectedAmountForPeriod(
            eligibleChildren,
            period,
            earliestStartPeriod
        );

        const totalForStatus = paymentStatus => {
            return monthPayments
                .filter(
                    payment =>
                        payment.status === paymentStatus
                )
                .reduce(
                    (sum, payment) =>
                        sum + Number(payment.amount || 0),
                    0
                );
        };

        const paid = totalForStatus("Paid");
        const pending = totalForStatus("Pending");
        const rejected = totalForStatus("Rejected");
        const remaining = Math.max(0, expected - paid);

        return {
            period,
            expected,
            paid,
            pending,
            rejected,
            remaining,
            payments: monthPayments
        };
    });

    const currentSummary =
        monthSummaries.find(
            item => item.period.key === currentPeriodInfo.key
        ) || {
            period: currentPeriodInfo,
            expected: eligibleChildren.reduce(
                (sum, child) =>
                    sum + Number(child.monthlyAmount || 0),
                0
            ),
            paid: 0,
            pending: 0,
            rejected: 0,
            remaining: eligibleChildren.reduce(
                (sum, child) =>
                    sum + Number(child.monthlyAmount || 0),
                0
            ),
            payments: []
        };

    /*
     * A previous month is outstanding when:
     * - an amount was expected,
     * - approved payments are still below that amount, and
     * - there is no pending submission covering the remaining balance.
     */
    const previousSummaries = monthSummaries.filter(
        item =>
            step77ComparePeriods(
                item.period,
                currentPeriodInfo
            ) < 0
    );

    const outstandingPastMonths =
        previousSummaries
            .filter(item => {
                if (item.expected <= 0) return false;
                if (item.remaining <= 0) return false;

                return item.pending < item.remaining;
            })
            .map(item => ({
                ...item,
                outstanding: Math.max(
                    0,
                    item.remaining - item.pending
                )
            }));

    const pendingPastMonths =
        previousSummaries.filter(item => {
            if (item.expected <= 0) return false;
            if (item.remaining <= 0) return false;

            return item.pending >= item.remaining;
        });

    const previousOutstandingTotal =
        outstandingPastMonths.reduce(
            (sum, item) =>
                sum + Number(item.outstanding || 0),
            0
        );

    const currentPendingCoversBalance =
        currentSummary.pending >=
        currentSummary.remaining &&
        currentSummary.remaining > 0;

    const currentOutstanding =
        currentSummary.remaining > 0 &&
        !currentPendingCoversBalance
            ? Math.max(
                0,
                currentSummary.remaining -
                currentSummary.pending
            )
            : 0;

    const totalOutstanding =
        previousOutstandingTotal +
        currentOutstanding;

    const breakdown = step77EnsureArrearsBreakdown(
        card,
        dateText
    );

    step77RenderArrearsBreakdown(
        breakdown,
        outstandingPastMonths,
        pendingPastMonths
    );

    card.classList.remove(
        "is-paid",
        "is-pending",
        "is-overdue",
        "is-rejected",
        "is-empty",
        "is-arrears"
    );

    if (monthText) {
        monthText.innerText = currentPeriod.label;
    }

    /*
     * Previous unpaid months always take priority in the reminder,
     * even when the current month is already Paid.
     */
    if (previousOutstandingTotal > 0) {
        card.classList.add(
            "is-overdue",
            "is-arrears"
        );

        status.innerText =
            outstandingPastMonths.length === 1
                ? "1 Month Overdue"
                : `${outstandingPastMonths.length} Months Overdue`;

        amount.innerText =
            `RM${totalOutstanding.toFixed(2)}`;

        const monthNames = outstandingPastMonths
            .slice(-3)
            .map(item =>
                step77PeriodLabel(item.period, true)
            )
            .join(", ");

        const extraCount =
            Math.max(
                0,
                outstandingPastMonths.length - 3
            );

        dateText.innerText =
            extraCount > 0
                ? `Outstanding balance from ${monthNames} and ${extraCount} earlier month${extraCount > 1 ? "s" : ""}`
                : `Outstanding balance from ${monthNames}`;

        if (currentSummary.pending > 0) {
            dateText.innerText +=
                ". Current payment is under review.";
        } else if (
            currentSummary.paid >= currentSummary.expected &&
            currentSummary.expected > 0
        ) {
            dateText.innerText +=
                ". Current month is already paid.";
        }

        if (action) {
            const payableItems = outstandingPastMonths.map(
                item => ({
                    period: item.period,
                    amount: item.outstanding
                })
            );

            if (currentOutstanding > 0) {
                payableItems.push({
                    period: currentPeriodInfo,
                    amount: currentOutstanding
                });
            }

            action.innerText = "Pay Outstanding Balance";
            action.href =
                step80BuildArrearsPaymentUrl(
                    payableItems
                );
        }

        return;
    }

    if (pendingPastMonths.length > 0) {
        card.classList.add("is-pending");
        status.innerText = "Under Review";

        const pendingPastTotal =
            pendingPastMonths.reduce(
                (sum, item) =>
                    sum + Number(item.pending || 0),
                0
            );

        amount.innerText =
            `RM${pendingPastTotal.toFixed(2)}`;

        dateText.innerText =
            pendingPastMonths.length === 1
                ? `${step77PeriodLabel(pendingPastMonths[0].period)} payment is waiting for approval`
                : `${pendingPastMonths.length} previous payments are waiting for approval`;

        if (action) {
            action.innerText = "View Submissions";
            action.href = "#paymentHistorySection";
        }

        return;
    }

    if (eligibleChildren.length === 0) {
        card.classList.add("is-empty");
        status.innerText = "Not Available";
        amount.innerText = "No Child";
        dateText.innerText =
            "Register a child to receive monthly reminders.";

        if (breakdown) {
            breakdown.hidden = true;
        }

        if (action) {
            action.innerText = "Register Child";
            action.href = "add-student.html";
        }

        return;
    }

    if (
        currentSummary.paid > 0 &&
        (
            currentSummary.expected <= 0 ||
            currentSummary.paid >= currentSummary.expected
        )
    ) {
        card.classList.add("is-paid");
        status.innerText = "Paid";
        amount.innerText =
            `RM${currentSummary.paid.toFixed(2)}`;

        dateText.innerText =
            currentSummary.payments.filter(
                payment => payment.status === "Paid"
            ).length > 1
                ? `${currentPeriod.label} payment completed across ${
                    currentSummary.payments.filter(
                        payment => payment.status === "Paid"
                    ).length
                } records`
                : `${currentPeriod.label} payment completed`;

        if (action) {
            action.innerText = "View Payment History";
            action.href = "#paymentHistorySection";
        }

        return;
    }

    if (currentSummary.paid > 0) {
        card.classList.add("is-pending");
        status.innerText = "Partially Paid";
        amount.innerText =
            `RM${currentSummary.paid.toFixed(2)}`;

        dateText.innerText =
            currentSummary.expected > 0
                ? `RM${currentSummary.paid.toFixed(2)} paid of RM${currentSummary.expected.toFixed(2)}`
                : `${currentPeriod.label} payment is partially completed`;

        if (action) {
            action.innerText =
                currentSummary.pending > 0
                    ? "View Submission"
                    : "Upload Remaining Payment";

            action.href =
                currentSummary.pending > 0
                    ? "#paymentHistorySection"
                    : step80BuildArrearsPaymentUrl([
                        {
                            period: currentPeriodInfo,
                            amount: Math.max(
                                0,
                                currentSummary.remaining
                            )
                        }
                    ]);
        }

        return;
    }

    if (
        currentSummary.pending > 0 ||
        currentSummary.payments.some(
            payment => payment.status === "Pending"
        )
    ) {
        card.classList.add("is-pending");
        status.innerText = "Under Review";

        amount.innerText =
            currentSummary.pending > 0
                ? `RM${currentSummary.pending.toFixed(2)}`
                : (
                    currentSummary.expected > 0
                        ? `RM${currentSummary.expected.toFixed(2)}`
                        : "Submitted"
                );

        dateText.innerText =
            "Receipt submitted — waiting for admin approval";

        if (action) {
            action.innerText = "View Submission";
            action.href = "#paymentHistorySection";
        }

        return;
    }

    if (
        currentSummary.rejected > 0 ||
        currentSummary.payments.some(
            payment => payment.status === "Rejected"
        )
    ) {
        card.classList.add("is-rejected");
        status.innerText = "Action Needed";

        amount.innerText =
            currentSummary.expected > 0
                ? `RM${currentSummary.expected.toFixed(2)}`
                : (
                    currentSummary.rejected > 0
                        ? `RM${currentSummary.rejected.toFixed(2)}`
                        : "Resubmit"
                );

        dateText.innerText =
            "Previous payment was rejected. Upload a new receipt.";

        if (action) {
            action.innerText = "Upload New Receipt";
            action.href = "upload-payment.html";
        }

        return;
    }

    const dueDate =
        `${MUTHAQUS_PAYMENT_DUE_DAY} ${currentPeriod.label}`;

    if (currentPeriod.day > MUTHAQUS_PAYMENT_DUE_DAY) {
        card.classList.add("is-overdue");
        status.innerText = "Overdue";
        dateText.innerText = `Due date was ${dueDate}`;
    } else {
        status.innerText = "Payment Due";
        dateText.innerText = `Due by ${dueDate}`;
    }

    amount.innerText =
        currentSummary.expected > 0
            ? `RM${currentSummary.expected.toFixed(2)}`
            : "Fee Pending";

    if (action) {
        action.innerText =
            currentPeriod.day >
            MUTHAQUS_PAYMENT_DUE_DAY
                ? "Pay Outstanding Balance"
                : "Upload Payment";

        action.href =
            currentPeriod.day >
            MUTHAQUS_PAYMENT_DUE_DAY
                ? step80BuildArrearsPaymentUrl([
                    {
                        period: currentPeriodInfo,
                        amount:
                            currentSummary.expected
                    }
                ])
                : "upload-payment.html";
    }
}

function renderStep70ProfileSummary(parent) {
    if (!parent) return;

    const avatar = document.getElementById("profileAvatar");
    const displayName =
        document.getElementById("step70ProfileName");
    const phone =
        document.getElementById("step70ProfilePhone");
    const email =
        document.getElementById("step70ProfileEmail");
    const completionValue =
        document.getElementById("step70ProfileCompletion");
    const completionBar =
        document.getElementById("step70ProfileCompletionBar");

    const fields = [
        parent.name,
        parent.phone,
        parent.email
    ];

    const completedFields = fields.filter(value =>
        String(value || "").trim()
    ).length;

    const completion = Math.round(
        (completedFields / fields.length) * 100
    );

    if (avatar) {
        avatar.textContent =
            String(parent.name || "P")
                .trim()
                .charAt(0)
                .toUpperCase() || "P";
    }

    if (displayName) {
        displayName.innerText = parent.name || "Parent";
    }

    if (phone) {
        phone.innerText = parent.phone || "Not provided";
    }

    if (email) {
        email.innerText = parent.email || "Not provided";
    }

    if (completionValue) {
        completionValue.innerText = `${completion}%`;
    }

    if (completionBar) {
        completionBar.style.width = `${completion}%`;
    }
}

function setupStep70ChildRegistration() {
    const form = document.getElementById("step70ChildForm");
    if (!form) return;

    const school = document.getElementById("schoolName");
    const session = document.getElementById("session");
    const kafa = document.getElementById("kafaName");
    const kafaSession = document.getElementById("kafaSession");
    const progressBar =
        document.getElementById("step70ChildProgressBar");
    const progressText =
        document.getElementById("step70ChildProgressText");

    function syncSchoolSession() {
        if (!school || !session) return;

        const notApplicable =
            school.value === "Not applicable";

        if (notApplicable) {
            session.value = "Not applicable";
        }
    }

    function syncKafaSession() {
        if (!kafa || !kafaSession) return;

        const hasKafa = Boolean(kafa.value);

        kafaSession.disabled = !hasKafa;

        if (!hasKafa) {
            kafaSession.value = "";
        }
    }

    function updateProgress() {
        const requiredFields = Array.from(
            form.querySelectorAll("[required]")
        );

        const completed = requiredFields.filter(field =>
            String(field.value || "").trim()
        ).length;

        const percentage = requiredFields.length
            ? Math.round(
                  (completed / requiredFields.length) * 100
              )
            : 0;

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }

        if (progressText) {
            progressText.innerText =
                percentage === 100
                    ? "Ready to submit"
                    : `${percentage}% completed`;
        }
    }

    school?.addEventListener("change", function () {
        syncSchoolSession();
        updateProgress();
    });

    kafa?.addEventListener("change", function () {
        syncKafaSession();
        updateProgress();
    });

    form.addEventListener("input", updateProgress);
    form.addEventListener("change", updateProgress);

    syncSchoolSession();
    syncKafaSession();
    updateProgress();
}

document.addEventListener("DOMContentLoaded", function () {
    setupStep70ChildRegistration();

    const parent = getCurrentParent?.();

    if (parent) {
        renderStep70ProfileSummary(parent);
    }
});

window.addEventListener("load", function () {
    const parent = getCurrentParent?.();

    if (parent) {
        renderStep70ProfileSummary(parent);
    }
});

// MUTHAQUS_STEP70_PARENT_DUE_PROFILE_CHILD_RULES_POLISH

// MUTHAQUS_STEP71_PARENT_DASHBOARD_MOBILE_POLISH

// MUTHAQUS_STEP74_PREMIUM_INVOICE_LAYOUT

// MUTHAQUS_STEP75_PAYMENT_DUE_TOTAL_FIX



/* =========================================================
   MUTHAQUS_STEP76_FRIENDLY_TEXT_ALL_MOBILE_POLISH

   1. Removes technical database wording from user-facing text.
   2. Adds consistent mobile page identity and table labels.
   3. Prevents duplicate mobile headers/navigation.
   4. Makes fixed bottom navigation reliable on all portal pages.
   ========================================================= */

(function () {
    "use strict";

    if (window.__muthaqusStep76Loaded) return;
    window.__muthaqusStep76Loaded = true;

    const MOBILE_QUERY = window.matchMedia("(max-width: 860px)");

    function friendlyUserText(value) {
        let text = String(value ?? "");

        const replacements = [
            [/Loading dashboard from MongoDB\.\.\./gi, "Loading dashboard securely..."],
            [/Loading students from MongoDB\.\.\./gi, "Loading student records..."],
            [/Loading parents from MongoDB\.\.\./gi, "Loading parent records..."],
            [/saved successfully in MongoDB/gi, "saved successfully"],
            [/saved to MongoDB/gi, "saved successfully"],
            [/updated successfully in MongoDB/gi, "updated successfully"],
            [/updated to ([^.]+) in MongoDB/gi, "updated to $1"],
            [/reset to default in MongoDB/gi, "reset to default successfully"],
            [/from MongoDB/gi, ""],
            [/to MongoDB/gi, ""],
            [/in MongoDB/gi, ""],
            [/MongoDB admins/gi, "secure admin records"],
            [/MongoDB database/gi, "secure records"],
            [/\bMongoDB\b/gi, "the system"]
        ];

        replacements.forEach(([pattern, replacement]) => {
            text = text.replace(pattern, replacement);
        });

        return text
            .replace(/\s{2,}/g, " ")
            .replace(/\s+([?.!,])/g, "$1")
            .trim();
    }

    /*
     * Alerts and confirmations are passed through friendly wording,
     * including messages returned from API responses.
     */
    const originalAlert = window.alert.bind(window);
    const originalConfirm = window.confirm.bind(window);

    window.alert = function (message) {
        return originalAlert(friendlyUserText(message));
    };

    window.confirm = function (message) {
        return originalConfirm(friendlyUserText(message));
    };

    function shouldSkipTextNode(node) {
        const parent = node.parentElement;

        return !parent || Boolean(
            parent.closest(
                "script, style, noscript, code, pre, textarea"
            )
        );
    }

    function sanitiseNode(root) {
        if (!root) return;

        if (root.nodeType === Node.TEXT_NODE) {
            if (shouldSkipTextNode(root)) return;

            const nextText = friendlyUserText(root.nodeValue);

            if (nextText && nextText !== root.nodeValue.trim()) {
                root.nodeValue = nextText;
            }

            return;
        }

        if (root.nodeType !== Node.ELEMENT_NODE &&
            root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
            return;
        }

        if (root.nodeType === Node.ELEMENT_NODE) {
            ["placeholder", "title", "aria-label", "data-message"].forEach(
                attributeName => {
                    if (!root.hasAttribute?.(attributeName)) return;

                    const currentValue = root.getAttribute(attributeName);
                    const nextValue = friendlyUserText(currentValue);

                    if (nextValue !== currentValue) {
                        root.setAttribute(attributeName, nextValue);
                    }
                }
            );

            if (
                root.matches?.(
                    'input[type="button"], input[type="submit"], input[type="reset"]'
                )
            ) {
                const nextValue = friendlyUserText(root.value);

                if (nextValue !== root.value) {
                    root.value = nextValue;
                }
            }
        }

        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    return shouldSkipTextNode(node)
                        ? NodeFilter.FILTER_REJECT
                        : NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;

        while ((node = walker.nextNode())) {
            const currentValue = node.nodeValue;
            const nextValue = friendlyUserText(currentValue);

            if (nextValue && nextValue !== currentValue.trim()) {
                node.nodeValue = nextValue;
            }
        }
    }

    function currentPageName() {
        return (
            window.location.pathname.split("/").pop() ||
            "index.html"
        )
            .replace(/\.html$/i, "")
            .replace(/[^a-z0-9_-]+/gi, "-")
            .toLowerCase();
    }

    function addStep76PageIdentity() {
        const pageName = currentPageName();

        document.body?.classList.add(
            "muthaqus-step76",
            "muthaqus-mobile-perfect",
            `step76-page-${pageName}`
        );

        document.documentElement.dataset.step76Page = pageName;
    }

    function addTableLabels(table) {
        if (
            !table ||
            table.dataset.step76Labels === "true" ||
            table.closest(".muthaqus-receipt-modal")
        ) {
            return;
        }

        const headers = Array.from(
            table.querySelectorAll("thead th")
        ).map(header =>
            friendlyUserText(header.textContent) || "Details"
        );

        if (!headers.length) return;

        table.querySelectorAll("tbody tr").forEach(row => {
            Array.from(row.children).forEach((cell, index) => {
                if (
                    cell.tagName !== "TD" ||
                    cell.hasAttribute("data-label")
                ) {
                    return;
                }

                cell.setAttribute(
                    "data-label",
                    headers[index] || "Details"
                );
            });
        });

        table.dataset.step76Labels = "true";
    }

    function improveTables(root = document) {
        root.querySelectorAll?.("table").forEach(addTableLabels);
    }

    function removeDuplicateElements(selector) {
        const elements = Array.from(
            document.querySelectorAll(selector)
        );

        elements.slice(1).forEach(element => element.remove());
    }

    function keepSingleMobileChrome() {
        removeDuplicateElements(".mobile-app-header");
        removeDuplicateElements(".admin-mobile-bottom");
        removeDuplicateElements(
            ".mobile-bottom-nav:not(.admin-mobile-bottom)"
        );
        removeDuplicateElements("#mutahusMobileFeatureBtn");
    }

    function moveBottomNavigationToBody() {
        if (!MOBILE_QUERY.matches || !document.body) return;

        document
            .querySelectorAll(
                ".mobile-bottom-nav, .admin-mobile-bottom"
            )
            .forEach(nav => {
                if (nav.parentElement !== document.body) {
                    document.body.appendChild(nav);
                }
            });
    }

    function normaliseMobileButtons(root = document) {
        root.querySelectorAll?.(
            "button, .btn, .small-btn, a.btn, input[type='submit']"
        ).forEach(button => {
            if (!button.hasAttribute("type") &&
                button.tagName === "BUTTON") {
                button.type = "button";
            }

            button.classList.add("step76-touch-target");
        });
    }

    function applyMobileReadyState() {
        addStep76PageIdentity();
        keepSingleMobileChrome();
        improveTables();
        normaliseMobileButtons();

        if (MOBILE_QUERY.matches) {
            moveBottomNavigationToBody();

            /*
             * Fixed elements become unreliable when a transformed ancestor
             * exists. Removing body transforms keeps the header/nav attached
             * to the phone viewport while scrolling.
             */
            document.documentElement.style.transform = "none";
            document.body.style.transform = "none";
            document.body.classList.add("step76-mobile-ready");
        }

        sanitiseNode(document.body);
    }

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== Node.ELEMENT_NODE) {
                    sanitiseNode(node);
                    return;
                }

                sanitiseNode(node);
                improveTables(node);
                normaliseMobileButtons(node);
            });
        });

        if (MOBILE_QUERY.matches) {
            keepSingleMobileChrome();
            moveBottomNavigationToBody();
        }
    });

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        applyMobileReadyState();
    }

    document.addEventListener(
        "DOMContentLoaded",
        applyMobileReadyState
    );

    window.addEventListener("load", applyMobileReadyState);
    window.addEventListener("pageshow", applyMobileReadyState);
    window.addEventListener("resize", applyMobileReadyState);

    MOBILE_QUERY.addEventListener?.(
        "change",
        applyMobileReadyState
    );

    window.setTimeout(applyMobileReadyState, 150);
    window.setTimeout(applyMobileReadyState, 600);
})();

// MUTHAQUS_STEP76_FRIENDLY_TEXT_ALL_MOBILE_POLISH

// MUTHAQUS_STEP77_PREVIOUS_MONTH_ARREARS_REMINDER

// MUTHAQUS_STEP78_SERVICE_START_MONTH_ARREARS_FIX


// MUTHAQUS_STEP79_ARREARS_ADMIN_STUDENTS_POLISH

// MUTHAQUS_STEP80_PAYMENT_ARREARS_MANAGEMENT


// MUTHAQUS_STEP81_PREMIUM_ADMIN_UI_REDESIGN

// MUTHAQUS_STEP82_FAMILY_STUDENT_MONTHLY_PAYMENT_SYSTEM



(function removeLegacyStudentSearchPanel() {
    function removePanel() {
        document
            .querySelectorAll(
                "#studentFilterPanel"
            )
            .forEach(panel => panel.remove());
    }

    removePanel();

    document.addEventListener(
        "DOMContentLoaded",
        removePanel
    );

    window.addEventListener(
        "load",
        removePanel
    );

    window.setTimeout(
        removePanel,
        100
    );

    window.setTimeout(
        removePanel,
        600
    );
})();

// MUTHAQUS_STEP83_SINGLE_STUDENT_SEARCH_FIX

// MUTHAQUS_STEP84_86_89_SECURITY_REPORT_BACKUP_RESTORE

// MUTHAQUS_STEP93_94_95_DUPLICATE_MAINTENANCE_ANALYTICS

// MUTHAQUS_STEP96_ADMIN_NAV_PARENT_PAYMENT_REMINDER_POLISH

// MUTHAQUS_STEP101_SEPARATE_ADMIN_PARENT_DARK_MODE
