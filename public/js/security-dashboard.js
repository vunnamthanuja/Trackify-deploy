// Security Dashboard JavaScript

// Check authentication on page load
if (!checkAuth()) {
    window.location.href = 'security-login.html';
}

// Load dashboard data
async function loadDashboard() {
    await Promise.all([
        loadStats(),
        loadVisitorVisits(),
        loadStaffLogs()
    ]);
}

// Load statistics
async function loadStats() {
    try {
        const response = await apiRequest(API_ENDPOINTS.securityStats);

        if (response.success) {
            const visitorStats = response.stats.visitors;
            const staffStats = response.stats.staff;

            document.getElementById('totalVisitors').textContent = visitorStats.total_visitors || 0;
            document.getElementById('currentlyInside').textContent = visitorStats.currently_inside || 0;
            document.getElementById('staffOut').textContent = staffStats.staff_out || 0;
            document.getElementById('staffIn').textContent = staffStats.staff_in || 0;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Load visitor visits
async function loadVisitorVisits() {
    try {
        const response = await apiRequest(API_ENDPOINTS.securityVisitorVisits);

        if (response.success && response.visits.length > 0) {
            const tbody = document.getElementById('visitorVisitsBody');
            tbody.innerHTML = response.visits.map(visit => {
                let statusColor = 'status-pending';
                if (visit.status === 'accepted') statusColor = 'color-green';
                else if (visit.status === 'rejected') statusColor = 'color-red';

                // Determine Out Time display based on status
                let outTimeDisplay;
                if (visit.out_time) {
                    outTimeDisplay = formatDateTime(visit.out_time);
                } else if (visit.status === 'accepted') {
                    outTimeDisplay = 'Inside';
                } else {
                    // For pending and rejected visitors, show "-"
                    outTimeDisplay = '-';
                }

                return `
                    <tr>
                        <td>${visit.name}</td>
                        <td>${visit.phone_number}</td>
                        <td>${visit.purpose}</td>
                        <td>${visit.whom_to_meet}</td>
                        <td>${formatDateTime(visit.in_time)}</td>
                        <td>${outTimeDisplay}</td>
                        <td>
                            <span class="status-badge status-${visit.status}">
                                ${visit.status.toUpperCase()}
                            </span>
                        </td>
                        <td class="${statusColor}">
                            ${visit.status === 'accepted' ? '🟢 ALLOWED' : 
                              visit.status === 'rejected' ? '🔴 DENIED' : 
                              '🟡 PENDING'}
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            document.getElementById('visitorVisitsBody').innerHTML = 
                '<tr><td colspan="8" class="no-data">No visitors today</td></tr>';
        }
    } catch (error) {
        console.error('Failed to load visitor visits:', error);
    }
}

// Load staff logs
async function loadStaffLogs() {
    try {
        const response = await apiRequest(API_ENDPOINTS.securityStaffLogs);

        if (response.success && response.logs.length > 0) {
            const tbody = document.getElementById('staffLogsBody');
            tbody.innerHTML = response.logs.map(log => `
                <tr>
                    <td>${log.staff_id}</td>
                    <td>${log.name}</td>
                    <td>${log.department}</td>
                    <td>${log.purpose || 'N/A'}</td>
                    <td>${log.out_time ? formatDateTime(log.out_time) : 'N/A'}</td>
                    <td>${log.in_time ? formatDateTime(log.in_time) : 'Pending'}</td>
                    <td>
                        <span class="status-badge status-${log.log_type}">
                            ${log.log_type === 'exit' ? 'EXIT' : log.log_type === 'complete' ? 'COMPLETE' : log.log_type.toUpperCase()}
                        </span>
                    </td>
                </tr>
            `).join('');
        } else {
            document.getElementById('staffLogsBody').innerHTML = 
                '<tr><td colspan="7" class="no-data">No staff movements today</td></tr>';
        }
    } catch (error) {
        console.error('Failed to load staff logs:', error);
    }
}

// Auto-refresh every 30 seconds
setInterval(() => {
    loadDashboard();
}, 30000);

// Load dashboard on page load
loadDashboard();
