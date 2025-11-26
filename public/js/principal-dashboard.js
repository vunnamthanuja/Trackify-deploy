// Principal Dashboard JavaScript

// Check authentication on page load
if (!checkAuth()) {
    window.location.href = 'principal-login.html';
}

let currentReportData = null;

// Load dashboard data
async function loadDashboard() {
    await loadStats();
}

// Load statistics
async function loadStats() {
    try {
        const response = await apiRequest(API_ENDPOINTS.principalStats);

        if (response.success) {
            const todayStats = response.stats.today;
            const monthlyStats = response.stats.monthly;

            document.getElementById('todayVisitors').textContent = todayStats.today_visitors || 0;
            document.getElementById('todayStaffLogs').textContent = todayStats.today_staff_logs || 0;
            document.getElementById('monthVisitors').textContent = monthlyStats.month_visitors || 0;
            document.getElementById('activeVisitors').textContent = todayStats.active_visitors || 0;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Get today's report
async function getTodayReport() {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log('Fetching today report for date:', today);
        const response = await apiRequest(`${API_ENDPOINTS.dailyReport}?date=${today}`);

        console.log('Report API response:', response);
        if (response.success) {
            displayReport(response.report);
        } else {
            showMessage(response.message || 'Failed to generate report', 'error');
        }
    } catch (error) {
        console.error('Report generation error:', error);
        showMessage(error.message || 'Failed to generate report', 'error');
    }
}

// Generate custom date range report
async function generateReport() {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    if (!fromDate || !toDate) {
        showMessage('Please select both from and to dates', 'error');
        return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
        showMessage('From date must be before to date', 'error');
        return;
    }

    try {
        console.log('Fetching report range:', fromDate, 'to', toDate);
        const response = await apiRequest(
            `${API_ENDPOINTS.reportRange}?fromDate=${fromDate}&toDate=${toDate}`
        );

        console.log('Report range API response:', response);
        if (response.success) {
            displayReport(response.report);
        } else {
            showMessage(response.message || 'Failed to generate report', 'error');
        }
    } catch (error) {
        console.error('Report range generation error:', error);
        showMessage(error.message || 'Failed to generate report', 'error');
    }
}

// Display report
function displayReport(report) {
    currentReportData = report;
    
    // Show report section
    document.getElementById('reportSection').style.display = 'block';

    // Set report date/range
    if (report.fromDate && report.toDate) {
        document.getElementById('reportDate').textContent = 
            `${formatDate(report.fromDate)} to ${formatDate(report.toDate)}`;
    } else {
        document.getElementById('reportDate').textContent = formatDate(report.date);
    }

    // Set counts
    document.getElementById('reportVisitorCount').textContent = report.visitors.count;
    document.getElementById('reportStaffCount').textContent = report.staffLogs.count;

    // Display visitor details
    if (report.visitors.data.length > 0) {
        const visitorBody = document.getElementById('reportVisitorsBody');
        visitorBody.innerHTML = report.visitors.data.map(visitor => {
            // Determine Out Time display based on status
            let outTimeDisplay;
            if (visitor.out_time) {
                outTimeDisplay = formatDateTime(visitor.out_time);
            } else if (visitor.status === 'accepted') {
                outTimeDisplay = 'Not checked out';
            } else {
                // For pending and rejected visitors, show "-"
                outTimeDisplay = '-';
            }
            
            return `
            <tr>
                <td>${visitor.number}</td>
                <td>${visitor.name}</td>
                <td>${visitor.phone_number}</td>
                <td>${visitor.place}</td>
                <td>${visitor.purpose}</td>
                <td>${visitor.whom_to_meet}</td>
                <td>${formatDateTime(visitor.in_time)}</td>
                <td>${outTimeDisplay}</td>
                <td>
                    <span class="status-badge status-${visitor.status}">
                        ${visitor.status.toUpperCase()}
                    </span>
                </td>
            </tr>
            `;
        }).join('');
    } else {
        document.getElementById('reportVisitorsBody').innerHTML = 
            '<tr><td colspan="9" class="no-data">No visitor data</td></tr>';
    }

    // Display staff log details
    if (report.staffLogs.data.length > 0) {
        const staffBody = document.getElementById('reportStaffBody');
        staffBody.innerHTML = report.staffLogs.data.map(log => `
            <tr>
                <td>${log.number}</td>
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
        document.getElementById('reportStaffBody').innerHTML = 
            '<tr><td colspan="8" class="no-data">No staff log data</td></tr>';
    }

    showMessage('Report generated successfully', 'success');
    
    // Scroll to report
    document.getElementById('reportSection').scrollIntoView({ behavior: 'smooth' });
}

// Download report as CSV with proper Excel formatting
function downloadReportCSV() {
    if (!currentReportData) {
        showMessage('No report data to download', 'error');
        return;
    }

    let csv = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    csv += 'TRACKIFY - Visitor & Staff Report\n\n';
    
    // Add date range
    if (currentReportData.fromDate && currentReportData.toDate) {
        csv += `Report Period:,${currentReportData.fromDate} to ${currentReportData.toDate}\n\n`;
    } else {
        csv += `Report Date:,${currentReportData.date}\n\n`;
    }

    // Visitor section
    csv += 'VISITOR DETAILS\n';
    csv += 'No.,Name,Phone,Place,Purpose,Whom to Meet,In Time,Out Time,Status\n';
    
    currentReportData.visitors.data.forEach(visitor => {
        const inTime = visitor.in_time ? formatDateTime(visitor.in_time) : 'N/A';
        // Determine Out Time for CSV based on status
        let outTime;
        if (visitor.out_time) {
            outTime = formatDateTime(visitor.out_time);
        } else if (visitor.status === 'accepted') {
            outTime = 'Not checked out';
        } else {
            // For pending and rejected visitors, show "-"
            outTime = '-';
        }
        csv += `${visitor.number},"${visitor.name}","${visitor.phone_number}","${visitor.place}","${visitor.purpose}","${visitor.whom_to_meet}","${inTime}","${outTime}",${visitor.status}\n`;
    });

    csv += `\nTotal Visitors:,${currentReportData.visitors.count}\n\n`;

    // Staff section
    csv += 'STAFF LOG DETAILS\n';
    csv += 'No.,Staff ID,Name,Department,Purpose,Out Time,In Time,Type\n';
    
    currentReportData.staffLogs.data.forEach(log => {
        const outTime = log.out_time ? formatDateTime(log.out_time) : 'N/A';
        const inTime = log.in_time ? formatDateTime(log.in_time) : 'N/A';
        csv += `${log.number},"${log.staff_id}","${log.name}","${log.department}","${log.purpose || 'Return'}","${outTime}","${inTime}",${log.log_type}\n`;
    });

    csv += `\nTotal Staff Logs:,${currentReportData.staffLogs.count}\n`;

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TRACKIFY_Report_${currentReportData.date || 'custom'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showMessage('CSV Report downloaded successfully', 'success');
}

// Download report as PDF
function downloadReportPDF() {
    if (!currentReportData) {
        showMessage('No report data to download', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

    // Title
    doc.setFontSize(18);
    doc.setTextColor(51, 51, 51);
    doc.text('TRACKIFY - Visitor & Staff Report', 14, 15);

    // Date range
    doc.setFontSize(10);
    let dateText = '';
    if (currentReportData.fromDate && currentReportData.toDate) {
        dateText = `Report Period: ${currentReportData.fromDate} to ${currentReportData.toDate}`;
    } else {
        dateText = `Report Date: ${currentReportData.date}`;
    }
    doc.text(dateText, 14, 22);

    let yPos = 30;

    // Visitor Details Table
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('VISITOR DETAILS', 14, yPos);
    yPos += 5;

    const visitorHeaders = [['No.', 'Name', 'Phone', 'Place', 'Purpose', 'Whom to Meet', 'In Time', 'Out Time', 'Status']];
    const visitorRows = currentReportData.visitors.data.map(visitor => {
        // Determine Out Time for PDF based on status
        let outTime;
        if (visitor.out_time) {
            outTime = formatDateTime(visitor.out_time);
        } else if (visitor.status === 'accepted') {
            outTime = 'Not checked out';
        } else {
            // For pending and rejected visitors, show "-"
            outTime = '-';
        }
        
        return [
            visitor.number,
            visitor.name,
            visitor.phone_number,
            visitor.place,
            visitor.purpose,
            visitor.whom_to_meet,
            formatDateTime(visitor.in_time),
            outTime,
            visitor.status
        ];
    });

    doc.autoTable({
        head: visitorHeaders,
        body: visitorRows,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 25 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 },
            6: { cellWidth: 30 },
            7: { cellWidth: 30 },
            8: { cellWidth: 20 }
        },
        margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Total visitors
    doc.setFontSize(9);
    doc.text(`Total Visitors: ${currentReportData.visitors.count}`, 14, yPos);
    yPos += 10;

    // Staff Log Details Table
    doc.setFontSize(12);
    doc.text('STAFF LOG DETAILS', 14, yPos);
    yPos += 5;

    const staffHeaders = [['No.', 'Staff ID', 'Name', 'Department', 'Purpose', 'Out Time', 'In Time', 'Type']];
    const staffRows = currentReportData.staffLogs.data.map(log => [
        log.number,
        log.staff_id,
        log.name,
        log.department,
        log.purpose || 'Return',
        log.out_time ? formatDateTime(log.out_time) : 'N/A',
        log.in_time ? formatDateTime(log.in_time) : 'N/A',
        log.log_type
    ]);

    doc.autoTable({
        head: staffHeaders,
        body: staffRows,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 },
            5: { cellWidth: 30 },
            6: { cellWidth: 30 },
            7: { cellWidth: 15 }
        },
        margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 5;

    // Total staff logs
    doc.setFontSize(9);
    doc.text(`Total Staff Logs: ${currentReportData.staffLogs.count}`, 14, yPos);

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }

    // Save PDF
    doc.save(`TRACKIFY_Report_${currentReportData.date || 'custom'}.pdf`);
    showMessage('PDF Report downloaded successfully', 'success');
}

// Set default dates
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    document.getElementById('fromDate').value = weekAgo;
    document.getElementById('toDate').value = today;
});

// Load dashboard on page load
loadDashboard();
