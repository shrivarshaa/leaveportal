// The API is served from the exact same domain and port as this frontend page
const API_URL = '';

// DOM Elements
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const studentView = document.getElementById('student-view');
const approverView = document.getElementById('approver-view');
const analyticsView = document.getElementById('analytics-view');
const userDisplayName = document.getElementById('user-display-name');
const userRoleBadge = document.getElementById('user-role-badge');
const logoutBtn = document.getElementById('logout-btn');
const toggleAnalyticsBtn = document.getElementById('toggle-analytics-btn');
let trendsChartInstance = null;
let patternsChartInstance = null;

// State
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Populate minute dropdowns
    const startMin = document.getElementById('start-min');
    const endMin = document.getElementById('end-min');
    if (startMin && endMin) {
        let minOptions = '';
        for (let i = 0; i < 60; i++) {
            const val = i.toString().padStart(2, '0');
            minOptions += `<option value="${val}">${val}</option>`;
        }
        startMin.innerHTML = minOptions;
        endMin.innerHTML = minOptions;
    }

    // Attendance predictor logic
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const predictorDiv = document.getElementById('attendance-predictor');
    
    function updatePredictor() {
        if (!startDateInput || !endDateInput || !predictorDiv) return;
        if (!startDateInput.value || !endDateInput.value || !currentUser || currentUser.role !== 'student') {
            predictorDiv.textContent = '';
            return;
        }
        const start = new Date(startDateInput.value);
        const end = new Date(endDateInput.value);
        if (end >= start) {
            let days_requested = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            let days_present = currentUser.days_present;
            let current_total = currentUser.days_present + (currentUser.days_absent || 0);
            let new_total = current_total + days_requested;
            let projected_att = Math.floor((days_present / new_total) * 100);
            
            predictorDiv.innerHTML = `If you take <strong style="color:var(--primary);">${days_requested}</strong> more days leave &rarr; attendance = <strong style="color: ${projected_att < 75 ? 'var(--danger)' : 'var(--success)'};">${projected_att}%</strong>`;
        } else {
            predictorDiv.textContent = 'End date must be after start date.';
        }
    }
    
    if (startDateInput) startDateInput.addEventListener('change', updatePredictor);
    if (endDateInput) endDateInput.addEventListener('change', updatePredictor);

    const savedUser = localStorage.getItem('leavePortalUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showAppLayout();
    }
});

// Auth
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');

showRegisterBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    document.querySelector('.subtitle').textContent = 'Create an account to get started';
    document.getElementById('login-error').textContent = '';
});

showLoginBtn.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    document.querySelector('.subtitle').textContent = 'Enter your credentials to access the portal';
    document.getElementById('reg-error').textContent = '';
});

// Dynamic role selection for register
const regRoleSelect = document.getElementById('reg-role');
const regSubroleGroup = document.getElementById('reg-subrole-group');

regRoleSelect.addEventListener('change', (e) => {
    const role = e.target.value;
    if (role === 'student') {
        regSubroleGroup.classList.remove('hidden');
        document.getElementById('reg-subrole').required = true;
    } else if (role === 'parent') {
        regSubroleGroup.classList.add('hidden');
        document.getElementById('reg-subrole').required = false;
        document.getElementById('reg-subrole').value = '';
    } else {
        regSubroleGroup.classList.add('hidden');
        document.getElementById('reg-subrole').required = false;
        document.getElementById('reg-subrole').value = '';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorMsg = document.getElementById('login-error');
    errorMsg.textContent = '';
    
    // We send 'email' to the backend, but the backend schema might still call it 'username' 
    // depending on how we structured UserLogin schema. 
    // Let's send it as email according to the new schema we will create.
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Invalid email or password');
        }

        const user = await response.json();
        currentUser = user;
        localStorage.setItem('leavePortalUser', JSON.stringify(user));
        
        document.getElementById('login-email').value = '';
        document.getElementById('password').value = '';
        showAppLayout();
    } catch (err) {
        errorMsg.textContent = err.message;
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorMsg = document.getElementById('reg-error');
    errorMsg.textContent = '';
    
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const role = document.getElementById('reg-role').value;
    const sub_role = document.getElementById('reg-subrole').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role, sub_role })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Registration failed');
        }

        const user = await response.json();
        
        // Auto-login after successful registration
        currentUser = user;
        localStorage.setItem('leavePortalUser', JSON.stringify(user));
        
        e.target.reset();
        document.getElementById('reg-subrole-group').classList.add('hidden');
        showAppLayout();
    } catch (err) {
        errorMsg.textContent = err.message || 'Registration failed';
    }
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('leavePortalUser');
    
    appContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    
    studentView.classList.add('hidden');
    approverView.classList.add('hidden');
    if (analyticsView) analyticsView.classList.add('hidden');
});

if (toggleAnalyticsBtn) {
    toggleAnalyticsBtn.addEventListener('click', () => {
        const isCurrentlyAnalytics = !analyticsView.classList.contains('hidden');
        if (isCurrentlyAnalytics) {
            // go back to normal dashboard
            toggleAnalyticsBtn.textContent = 'Analytics';
            if (currentUser.role === 'student') {
                setupStudentView();
            } else {
                setupApproverView();
            }
        } else {
            // go to analytics
            toggleAnalyticsBtn.textContent = 'Back to Dashboard';
            showAnalyticsView();
        }
    });
}

// App Layout Switching
function showAppLayout() {
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    
    let displayRole = currentUser.role;
    if(currentUser.role === 'student' && currentUser.sub_role) {
        displayRole = currentUser.sub_role;
    }
    
    userDisplayName.textContent = currentUser.username;
    userRoleBadge.textContent = displayRole;

    const attendContainer = document.getElementById('user-attendance-container');
    const userAttendanceBadge = document.getElementById('user-attendance-badge');
    const userDaysAbsent = document.getElementById('user-days-absent');

    if (currentUser.role === 'student' && attendContainer) {
        attendContainer.classList.remove('hidden');
        userAttendanceBadge.textContent = (currentUser.attendance_percentage || 0) + '%';
        userDaysAbsent.textContent = currentUser.days_absent || 0;

        // Color coding for percentage
        if (currentUser.attendance_percentage < 75) {
            userAttendanceBadge.style.color = 'var(--danger)';
        } else if (currentUser.attendance_percentage < 85) {
            userAttendanceBadge.style.color = '#fbbf24'; // Warning yellow
        } else {
            userAttendanceBadge.style.color = 'var(--success)';
        }
    } else if (attendContainer) {
        attendContainer.classList.add('hidden');
    }

    if (currentUser.role === 'student') {
        setupStudentView();
    } else {
        // Parents, Mentors, Wardens, Incharges all use the approver view
        setupApproverView();
    }
}

function setupStudentView() {
    studentView.classList.remove('hidden');
    approverView.classList.add('hidden');
    if (analyticsView) analyticsView.classList.add('hidden');

    // UI specific rules
    const hostellerOnlyOptions = document.querySelectorAll('.hosteller-only');
    if (currentUser.sub_role !== 'hosteller') {
        hostellerOnlyOptions.forEach(opt => opt.style.display = 'none');
    } else {
        hostellerOnlyOptions.forEach(opt => opt.style.display = 'block');
    }

    fetchStudentHistory();

    // Proof field dynamism
    const leaveTypeSelect = document.getElementById('leave-type');
    const proofGroup = document.getElementById('proof-group');
    if (leaveTypeSelect && proofGroup) {
        leaveTypeSelect.addEventListener('change', (e) => {
            if (e.target.value.toLowerCase() === 'medical') {
                proofGroup.classList.remove('hidden');
                document.getElementById('proof-file').required = true;
            } else {
                proofGroup.classList.add('hidden');
                document.getElementById('proof-file').required = false;
            }
        });
    }
}

document.getElementById('leave-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('leave-type').value;
    
    // Process Start
    const startDate = document.getElementById('start-date').value;
    let startHr = parseInt(document.getElementById('start-hr').value, 10);
    const startMin = document.getElementById('start-min').value;
    const startAmPm = document.getElementById('start-ampm').value;
    if (startAmPm === 'PM' && startHr !== 12) startHr += 12;
    if (startAmPm === 'AM' && startHr === 12) startHr = 0;
    const start = `${startDate}T${startHr.toString().padStart(2, '0')}:${startMin}`;

    // Process End
    const endDate = document.getElementById('end-date').value;
    let endHr = parseInt(document.getElementById('end-hr').value, 10);
    const endMin = document.getElementById('end-min').value;
    const endAmPm = document.getElementById('end-ampm').value;
    if (endAmPm === 'PM' && endHr !== 12) endHr += 12;
    if (endAmPm === 'AM' && endHr === 12) endHr = 0;
    const end = `${endDate}T${endHr.toString().padStart(2, '0')}:${endMin}`;

    const reason = document.getElementById('reason').value.trim();
    if (!reason) {
        alert("Please provide a reason for your leave request.");
        return;
    }

    const formData = new FormData();
    formData.append('student_id', currentUser.id);
    formData.append('leave_type', type);
    formData.append('start_date', start);
    formData.append('end_date', end);
    formData.append('reason', reason);
    
    const fileInput = document.getElementById('proof-file');
    if (fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
    }

    try {
        const response = await fetch(`${API_URL}/leave`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Submission failed');
        }
        
        const savedLeave = await response.json();
        
        // Reset form
        e.target.reset();
        
        fetchStudentHistory();
    } catch (err) {
        alert(err.message);
    }
});

async function fetchStudentHistory() {
    try {
        const response = await fetch(`${API_URL}/leaves?user_id=${currentUser.id}`);
        const leaves = await response.json();
        
        // Sort: pending first, then others, tie-breaker newer ID first
        leaves.sort((a, b) => {
            const aPending = a.status.startsWith('pending_');
            const bPending = b.status.startsWith('pending_');
            if (aPending && !bPending) return -1;
            if (!aPending && bPending) return 1;
            return b.id - a.id;
        });
        
        const tbody = document.querySelector('#student-history-table tbody');
        tbody.innerHTML = '';
        
        leaves.forEach(leave => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${leave.leave_type}</strong></td>
                <td>${formatDateTime(leave.start_date)} <br>to<br> ${formatDateTime(leave.end_date)}</td>
                <td>${leave.reason}</td>
                <td>
                    ${formatStatusBadge(leave)}
                    ${leave.status.startsWith('pending_') ? `<span style="color: var(--danger); font-size: 1.1rem; cursor: pointer; font-weight: bold; margin-left: 8px;" onclick="cancelLeave(${leave.id})" title="Cancel Request">&#10006;</span>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) {
        console.error(err);
    }
}

// Approver View Logic
function setupApproverView() {
    studentView.classList.add('hidden');
    approverView.classList.remove('hidden');
    if (analyticsView) analyticsView.classList.add('hidden');
    
    // Update title for Parent
    const approverTitle = document.querySelector('#approver-view h3');
    if (approverTitle) {
        approverTitle.textContent = currentUser.role === 'parent' ? 'Parent Approval Dashboard' : 'Approver Dashboard';
    }
    
    fetchApproverLeaves();
    
    // Load students for Silent Leave Panel if Faculty
    if (currentUser.role !== 'parent' && currentUser.role !== 'student') {
        const silentPanel = document.getElementById('silent-leave-panel');
        if(silentPanel) silentPanel.style.display = 'block';
        fetchManagedStudents();
    } else {
        const silentPanel = document.getElementById('silent-leave-panel');
        if(silentPanel) silentPanel.style.display = 'none';
    }
}

async function fetchManagedStudents() {
    try {
        const response = await fetch(`${API_URL}/managed_students/${currentUser.id}`);
        if(response.ok) {
            const students = await response.json();
            const select = document.getElementById('silent-student-select');
            if(select) {
                select.innerHTML = '<option value="" disabled selected>Select a student...</option>';
                students.forEach(s => {
                    select.innerHTML += `<option value="${s.id}">${s.username} (${s.sub_role || 'Student'})</option>`;
                });
            }
        }
    } catch(e) {
        console.error("Failed to load managed students for silent leave reporting", e);
    }
}

const silentLeaveForm = document.getElementById('silent-leave-form');
if (silentLeaveForm) {
    silentLeaveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('silent-student-select').value;
        if (!studentId) return alert('Please select a student');
        
        if(!confirm(`Mark this student as absent without leave and notify their parent?`)) return;
        
        try {
            const formData = new FormData();
            formData.append('student_id', studentId);
            const response = await fetch(`${API_URL}/mark_absent`, {
                method: 'POST',
                body: formData
            });
            if(!response.ok) throw new Error("Failed to mark absent");
            alert("Student marked absent and parent notified successfully.");
            silentLeaveForm.reset();
        } catch(err) {
            alert(err.message);
        }
    });
}

async function fetchApproverLeaves() {
    try {
        const response = await fetch(`${API_URL}/leaves?user_id=${currentUser.id}`);
        const leaves = await response.json();
        
        const pendingTbody = document.querySelector('#approver-table tbody');
        const historyTbody = document.querySelector('#approver-history-table tbody');
        
        pendingTbody.innerHTML = '';
        historyTbody.innerHTML = '';
        
        // Filter logic: 
        // Pending = status matches current role's pending status
        // History = current user's role ID matches current user's ID
        const pendingLeaves = [];
        const historyLeaves = [];

        leaves.forEach(leave => {
            const isPendingForMe = (
                (currentUser.role === 'mentor' && leave.status === 'pending_mentor') ||
                (currentUser.role === 'incharge' && leave.status === 'pending_incharge') ||
                (currentUser.role === 'warden' && leave.status === 'pending_warden') ||
                (currentUser.role === 'parent' && leave.status === 'pending_parent')
            );
            
            const iAlreadyActioned = (
                (currentUser.role === 'mentor' && leave.mentor_id === currentUser.id) ||
                (currentUser.role === 'incharge' && leave.incharge_id === currentUser.id) ||
                (currentUser.role === 'warden' && leave.warden_id === currentUser.id) ||
                (currentUser.role === 'parent' && leave.parent_id === currentUser.id)
            );

            if (isPendingForMe) pendingLeaves.push(leave);
            else if (iAlreadyActioned) historyLeaves.push(leave);
        });

        // Render Pending
        if(pendingLeaves.length === 0) {
            pendingTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No pending requests found.</td></tr>';
        } else {
            pendingLeaves.forEach(leave => {
                let urgencyBadge = '';
                const appliedAt = new Date(leave.created_at || new Date());
                const start = new Date(leave.start_date);
                const diffDays = (start - appliedAt) / (1000 * 60 * 60 * 24);

                let urgencyClass = '';
                let urgencyText = '';
                
                if (diffDays <= 1.5) {
                    urgencyClass = 'border: 1px solid var(--danger); color: var(--danger); background: rgba(239,68,68,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; display: inline-block; margin-top: 4px;';
                    urgencyText = '🔴 Emergency';
                } else {
                    urgencyClass = 'border: 1px solid var(--success); color: var(--success); background: rgba(16,185,129,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; display: inline-block; margin-top: 4px;';
                    urgencyText = '🟢 Planned';
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${leave.student.username}</strong></td>
                    <td><span class="badge">${leave.student.sub_role || 'student'}</span></td>
                    <td>
                        <div style="font-weight: 500;">${leave.leave_type}</div>
                        <div style="${urgencyClass}">${urgencyText}</div>
                    </td>
                    <td>${formatDateTime(leave.start_date)} <br>to<br> ${formatDateTime(leave.end_date)}</td>
                    <td>${leave.reason}</td>
                    <td>
                        <div class="action-buttons">
                            ${currentUser.role === 'parent' ? `
                                <button class="btn-approve" onclick="openParentApprove(${leave.id})">Approve</button>
                                <button class="btn-reject" onclick="openParentReject(${leave.id})">Reject</button>
                            ` : `
                                <button class="btn-approve" onclick="actionLeave(${leave.id}, 'approve')">Approve</button>
                                <button class="btn-reject" onclick="actionLeave(${leave.id}, 'reject')">Reject</button>
                            `}
                        </div>
                    </td>
                `;
                pendingTbody.appendChild(tr);
            });
        }

        // Render History
        if(historyLeaves.length === 0) {
            historyTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No actioned requests yet.</td></tr>';
        } else {
            historyLeaves.forEach(leave => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${leave.student.username}</strong></td>
                    <td>${leave.leave_type}</td>
                    <td>${formatDateTime(leave.start_date)} <br>to<br> ${formatDateTime(leave.end_date)}</td>
                    <td>${leave.reason}</td>
                    <td>${formatStatusBadge(leave)}</td>
                `;
                historyTbody.appendChild(tr);
            });
        }
    } catch(err) {
        console.error(err);
    }
}

window.actionLeave = async function(leaveId, action, remarks = null) {
    if(!remarks && !confirm(`Are you sure you want to ${action} this request?`)) return;
    try {
        let url = `${API_URL}/leave/${leaveId}/action?user_id=${currentUser.id}&action=${action}`;
        if (remarks) url += `&remarks=${encodeURIComponent(remarks)}`;
        
        const response = await fetch(url, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error(`Failed to ${action}`);
        fetchApproverLeaves();
    } catch(err) {
        alert(err.message);
    }
}

window.cancelLeave = async function(leaveId) {
    if(!confirm("Are you sure you want to cancel this leave application?")) return;
    try {
        const response = await fetch(`${API_URL}/leave/${leaveId}/action?user_id=${currentUser.id}&action=cancel`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error("Failed to cancel leave");
        fetchStudentHistory(); // Refresh the student table
    } catch(err) {
        alert(err.message);
    }
}
// Utils
function formatDateTime(dateStr) {
    if (!dateStr) return '';
    
    // If it's a legacy date without a time component
    if (!dateStr.includes('T')) {
        const dateObj = new Date(dateStr);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
    }
    
    const [datePart, timePart] = dateStr.split('T');
    
    // Parse time
    let [hours, minutes] = timePart.split(':');
    let ampm = 'AM';
    hours = parseInt(hours, 10);
    
    if (hours >= 12) {
        ampm = 'PM';
        if (hours > 12) hours -= 12;
    }
    if (hours === 0) hours = 12;
    
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    
    // Parse date 
    const dateObj = new Date(datePart);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const formattedDate = dateObj.toLocaleDateString('en-US', options);

    return `${formattedDate} at ${formattedTime} IST`;
}

function formatStatusBadge(leave) {
    let status = leave.status;
    let cssClass = 'status-pending';
    let label = status.replace('_', ' ').toUpperCase();
    let onClickAttr = `onclick='showLeaveDetails(${JSON.stringify(leave).replace(/'/g, "&apos;")})' style="cursor: pointer;" title="Click to view details"`;
    
    if (status === 'approved') {
        cssClass = 'status-approved';
    } else if (status === 'rejected') {
        cssClass = 'status-rejected';
    } else if (status === 'cancelled') {
        cssClass = 'status-cancelled';
    } else if (status.startsWith('pending_')) {
        label = 'PENDING';
    }

    return `<span class="status-badge ${cssClass}" ${onClickAttr}>${label}</span>`;
}

// Analytics Logic
async function showAnalyticsView() {
    studentView.classList.add('hidden');
    approverView.classList.add('hidden');
    if (analyticsView) analyticsView.classList.remove('hidden');

    try {
        const response = await fetch(`${API_URL}/analytics/${currentUser.id}`);
        const data = await response.json();
        
        // 1. KPIs
        document.getElementById('kpi-total-leaves').textContent = data.total_leaves;
        
        const attendCard = document.getElementById('kpi-attendance-card');
        if (currentUser.role === 'student' && attendCard) {
            attendCard.classList.remove('hidden');
            
            const newAtt = data.attendance_impact.attendance_percentage || 0;
            const newAbs = data.attendance_impact.days_absent || 0;
            
            document.getElementById('kpi-attendance-val').textContent = newAtt + '%';
            
            // Keep header synced with live data
            const headerAtt = document.getElementById('user-attendance-badge');
            const headerAbs = document.getElementById('user-days-absent');
            if (headerAtt) {
                headerAtt.textContent = newAtt + '%';
                if (newAtt < 75) headerAtt.style.color = 'var(--danger)';
                else if (newAtt < 85) headerAtt.style.color = '#fbbf24';
                else headerAtt.style.color = 'var(--success)';
            }
            if (headerAbs) headerAbs.textContent = newAbs;
            
            currentUser.attendance_percentage = newAtt;
            currentUser.days_absent = newAbs;
            localStorage.setItem('leavePortalUser', JSON.stringify(currentUser));
            
        } else if (attendCard) {
            attendCard.classList.add('hidden');
        }

        // 2. Clear old charts
        if (trendsChartInstance) trendsChartInstance.destroy();
        if (patternsChartInstance) patternsChartInstance.destroy();

        // 3. Render Monthly Trends Chart
        const trendLabels = Object.keys(data.monthly_trends);
        const trendData = Object.values(data.monthly_trends);
        
        const trendsCtx = document.getElementById('monthly-trends-chart').getContext('2d');
        trendsChartInstance = new Chart(trendsCtx, {
            type: 'bar',
            data: {
                labels: trendLabels.length ? trendLabels : ['No Data'],
                datasets: [{
                    label: 'Approved Leaves',
                    data: trendLabels.length ? trendData : [0],
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#94a3b8', stepSize: 1 } },
                    x: { ticks: { color: '#94a3b8' } }
                },
                plugins: {
                    legend: { labels: { color: '#f8fafc' } }
                }
            }
        });

        // 4. Faculty Specific Data
        const facultyCharts = document.getElementById('faculty-charts-container');
        const absenteesPanel = document.getElementById('frequent-absentees-panel');
        
        if (currentUser.role !== 'student') {
            if (facultyCharts) facultyCharts.classList.remove('hidden');
            if (absenteesPanel) absenteesPanel.classList.remove('hidden');

            // Render Class Patterns Chart
            const patternsLabels = Object.keys(data.class_patterns).map(l => l.charAt(0).toUpperCase() + l.slice(1));
            const patternsVals = Object.values(data.class_patterns);

            const patternsCtx = document.getElementById('class-patterns-chart').getContext('2d');
            patternsChartInstance = new Chart(patternsCtx, {
                type: 'doughnut',
                data: {
                    labels: patternsLabels.length ? patternsLabels : ['No Data'],
                    datasets: [{
                        data: patternsLabels.length ? patternsVals : [1],
                        backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(245, 158, 11, 0.6)', 'rgba(239, 68, 68, 0.6)'],
                        borderColor: ['#1e293b'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#f8fafc' } }
                    }
                }
            });

            // Populating Frequent Absentees Table
            const tbody = document.querySelector('#frequent-absentees-table tbody');
            if (tbody) {
                tbody.innerHTML = '';
                if (data.frequent_absentees && data.frequent_absentees.length > 0) {
                    data.frequent_absentees.forEach(student => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><strong>${student.username}</strong></td>
                            <td><span class="badge">${student.sub_role || 'student'}</span></td>
                            <td style="color: var(--danger); font-weight: bold;">${student.days_absent}</td>
                            <td style="color: ${student.attendance_percentage < 75 ? 'var(--danger)' : 'var(--success)'};">${student.attendance_percentage}%</td>
                        `;
                        tbody.appendChild(tr);
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No data found.</td></tr>';
                }
            }
        } else {
            if (facultyCharts) facultyCharts.classList.add('hidden');
            if (absenteesPanel) absenteesPanel.classList.add('hidden');
        }

    } catch (err) {
        console.error(err);
        alert('Failed to load analytics: ' + err.message);
    }
}

// Modal Logic
const modal = document.getElementById('leave-modal');
const closeBtn = document.getElementById('modal-close');

closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

window.showLeaveDetails = function(leave) {
    // Populate simple fields
    document.getElementById('modal-leave-type').textContent = leave.leave_type;
    document.getElementById('modal-duration').innerHTML = `${formatDateTime(leave.start_date)} <br>to<br> ${formatDateTime(leave.end_date)}`;
    document.getElementById('modal-reason').textContent = leave.reason;
    document.getElementById('modal-status').innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.1); color: white;">${leave.status.replace('_', ' ').toUpperCase()}</span>`;

    // Process Timeline
    const timeline = document.getElementById('modal-timeline');
    timeline.innerHTML = ''; // clear

    const type = leave.leave_type.toLowerCase();
    const currStatus = leave.status.toLowerCase();

    // Define the expected path based on rules configured in main.py
    let path = [];
    
    // Parent approval is now required for ALL types
    path.push({ role: 'parent', label: 'Parent Approval' });

    if (type === 'casual') {
        path.push({ role: 'mentor', label: 'Mentor Approval' });
        if(currentUser.sub_role === 'hosteller') {
            path.push({ role: 'warden', label: 'Hostel Warden' });
        }
    } else if (type === 'od') {
        path.push({ role: 'incharge', label: 'Club / Event Incharge' });
        path.push({ role: 'mentor', label: 'Mentor Approval' });
        if(currentUser.sub_role === 'hosteller') {
            path.push({ role: 'warden', label: 'Hostel Warden' });
        }
    } else if (type === 'emergency' || type === 'sick') {
        path.push({ role: 'warden', label: 'Hostel Warden' });
    } else if (type === 'medical') {
        path.push({ role: 'mentor', label: 'Mentor Approval' });
        if(currentUser.sub_role === 'hosteller') {
            path.push({ role: 'warden', label: 'Hostel Warden' });
        }
    }

    // Determine current state
    let isRejected = currStatus === 'rejected';
    let isFullyApproved = currStatus === 'approved';
    let pendingRole = currStatus.startsWith('pending_') ? currStatus.split('_')[1] : null;

    let reachedPending = false;

    path.forEach((step, index) => {
        let nodeClass = 'pending';
        let statusText = 'Pending';
        let bodyText = 'Awaiting review';

        if (isFullyApproved) {
            nodeClass = 'approved';
            statusText = 'Approved';
            bodyText = 'Reviewed and accepted';
        } else if (isRejected) {
            // If rejected, determine if this specific node was the one that rejected it.
            // Simplified logic: the node that it was *supposed* to be pending at is the one that rejected it.
            // If we don't know, we mark all previous as approved, current as rejected, future as skipped.
            if (!reachedPending && pendingRole === null) {
                // We're just assuming the last node rejected it for now if we don't have historical logs
                 if(index === path.length - 1){
                     nodeClass = 'rejected';
                     statusText = 'Rejected';
                     bodyText = 'Request denied at this stage';
                 } else {
                     nodeClass = 'approved';
                     statusText = 'Approved';
                     bodyText = 'Passed';
                 }
            } else if (reachedPending) {
                 nodeClass = 'pending'; // visually skipped/irrelevant
                 statusText = 'Cancelled';
                 bodyText = '-';
            } else {
                 nodeClass = 'approved';
                 statusText = 'Approved';
                 bodyText = 'Passed';
            }
        } else {
            // It's currently pending somewhere
            if (step.role === pendingRole) {
                nodeClass = 'pending';
                statusText = 'Current Stage';
                bodyText = 'Action required from ' + step.label;
                reachedPending = true;
            } else if (reachedPending) {
                // Future steps
                nodeClass = 'pending';
                statusText = 'Waiting';
                bodyText = 'Awaiting previous approvals';
            } else {
                // Past steps
                nodeClass = 'approved';
                statusText = 'Approved';
                bodyText = 'Passed';
            }
        }

        const nodeEl = document.createElement('div');
        nodeEl.className = `timeline-node ${nodeClass}`;
        nodeEl.innerHTML = `
            <div class="node-header">
                <span class="node-title">${step.label}</span>
                <span class="status-badge ${nodeClass === 'approved' ? 'status-approved' : nodeClass === 'rejected' ? 'status-rejected' : 'status-pending'}">${statusText}</span>
            </div>
            <div class="node-body">${bodyText}</div>
        `;
        timeline.appendChild(nodeEl);
    });

    // Proof Display
    const proofContainer = document.getElementById('modal-proof-container');
    const proofContent = document.getElementById('modal-proof-content');
    
    if (leave.attachment_path && proofContainer && proofContent) {
        proofContainer.classList.remove('hidden');
        if (leave.attachment_path.toLowerCase().endsWith('.pdf')) {
            proofContent.innerHTML = `<a href="${leave.attachment_path}" target="_blank" class="btn-primary" style="display:inline-block; padding: 0.4rem 0.8rem; font-size: 0.8rem; text-decoration: none;">View Medical Certificate</a>`;
        } else {
            proofContent.innerHTML = `<img src="${leave.attachment_path}" alt="Medical Proof" style="max-width: 100%; border-radius: 8px; margin-top: 0.5rem; cursor: pointer;" onclick="window.open('${leave.attachment_path}', '_blank')">`;
        }
    } else if (proofContainer) {
        proofContainer.classList.add('hidden');
        proofContent.innerHTML = '';
    }

    modal.classList.remove('hidden');
}

// ==========================================
// Parent Modal Logic
// ==========================================
let currentParentLeaveId = null;

window.openParentApprove = function(leaveId) {
    currentParentLeaveId = leaveId;
    const modal = document.getElementById('parent-approve-modal');
    const cb = document.getElementById('parent-ack-checkbox');
    const btn = document.getElementById('parent-confirm-approve-btn');
    
    cb.checked = false;
    btn.disabled = true;
    
    cb.onchange = () => {
        btn.disabled = !cb.checked;
    };
    
    btn.onclick = () => {
        if(cb.checked) {
            actionLeave(currentParentLeaveId, 'approve', "Parent acknowledged and approved.");
            closeParentModals();
        }
    };
    
    modal.classList.remove('hidden');
}

window.openParentReject = function(leaveId) {
    currentParentLeaveId = leaveId;
    const modal = document.getElementById('parent-reject-modal');
    const radios = document.getElementsByName('parent-reject-reason');
    const otherText = document.getElementById('parent-reject-other-text');
    const btn = document.getElementById('parent-confirm-reject-btn');
    
    // reset
    radios.forEach(r => r.checked = false);
    otherText.value = '';
    otherText.classList.add('hidden');
    
    radios.forEach(r => {
        r.onchange = () => {
            if (r.value === 'Other') {
                otherText.classList.remove('hidden');
                otherText.focus();
            } else {
                otherText.classList.add('hidden');
            }
        };
    });
    
    btn.onclick = () => {
        let reason = null;
        for (const r of radios) {
            if (r.checked) {
                reason = r.value === 'Other' ? otherText.value.trim() : r.value;
                break;
            }
        }
        
        if (!reason) {
            alert("Please select a reason for rejection.");
            return;
        }
        if (reason.length === 0) {
            alert("Please specify the reason.");
            return;
        }
        
        actionLeave(currentParentLeaveId, 'reject', reason);
        closeParentModals();
    };
    
    modal.classList.remove('hidden');
}

window.closeParentModals = function() {
    currentParentLeaveId = null;
    document.getElementById('parent-approve-modal').classList.add('hidden');
    document.getElementById('parent-reject-modal').classList.add('hidden');
}
