// Unified QR Scan - Automatic Visitor/Staff Detection
// This script automatically determines if the user is a visitor or staff member based on phone number

let currentPhone = '';
let userType = ''; // 'visitor' or 'staff'
let isNewVisitor = false;
let hasActiveVisit = false;

// Step 1: Check phone number and determine user type
async function checkPhoneNumber() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();

    if (!phoneNumber || phoneNumber.length < 10) {
        showMessage('Please enter a valid phone number (at least 10 digits)', 'error');
        return;
    }

    currentPhone = phoneNumber;
    showMessage('Checking phone number...', 'info');

    try {
        // Check if phone belongs to staff
        console.log('Checking staff:', `${API_BASE_URL}/staff/check/${phoneNumber}`);
        const staffResponse = await fetch(`${API_BASE_URL}/staff/check/${phoneNumber}`);
        
        if (!staffResponse.ok) {
            throw new Error(`Staff check failed: ${staffResponse.status} ${staffResponse.statusText}`);
        }
        
        const staffData = await staffResponse.json();
        console.log('Staff check result:', staffData);

        if (staffData.exists && staffData.isStaff) {
            // User is STAFF
            userType = 'staff';
            showStaffSection(staffData.staff);
            return;
        }

        // Check if phone belongs to visitor
        console.log('Checking visitor:', `${API_BASE_URL}/visitors/check/${phoneNumber}`);
        const visitorResponse = await fetch(`${API_BASE_URL}/visitors/check/${phoneNumber}`);
        
        if (!visitorResponse.ok) {
            throw new Error(`Visitor check failed: ${visitorResponse.status} ${visitorResponse.statusText}`);
        }
        
        const visitorData = await visitorResponse.json();
        console.log('Visitor check result:', visitorData);

        if (visitorData.exists) {
            // Existing VISITOR
            userType = 'visitor';
            isNewVisitor = false;
            
            // Check if visitor has an active visit (already checked in)
            if (visitorData.hasActiveVisit) {
                hasActiveVisit = true;
                showVisitorCheckoutSection(visitorData.visitor);
            } else {
                showVisitorSection(visitorData.visitor);
            }
        } else {
            // New VISITOR
            userType = 'visitor';
            isNewVisitor = true;
            showVisitorSection(null);
        }

    } catch (error) {
        console.error('Error checking phone number:', error);
        showMessage(`Error: ${error.message}. Check console for details.`, 'error');
    }
}

// Show Visitor Section
function showVisitorSection(visitorData) {
    document.getElementById('phoneEntrySection').style.display = 'none';
    document.getElementById('staffSection').style.display = 'none';
    document.getElementById('visitorCheckoutSection').style.display = 'none';
    document.getElementById('visitorSection').style.display = 'block';

    if (isNewVisitor) {
        // New visitor - show registration form
        document.getElementById('newVisitorForm').style.display = 'block';
        document.getElementById('visitDetailsForm').style.display = 'none';
        showMessage('Welcome! Please complete registration first.', 'info');
    } else {
        // Existing visitor - show visit details form directly
        document.getElementById('newVisitorForm').style.display = 'none';
        document.getElementById('visitDetailsForm').style.display = 'block';
        showMessage(`Welcome back, ${visitorData.name}!`, 'success');
    }
}

// Show Visitor Checkout Section
function showVisitorCheckoutSection(visitorData) {
    document.getElementById('phoneEntrySection').style.display = 'none';
    document.getElementById('visitorSection').style.display = 'none';
    document.getElementById('staffSection').style.display = 'none';
    document.getElementById('visitorCheckoutSection').style.display = 'block';
    showMessage(`${visitorData.name}, you are currently checked in. Would you like to check out?`, 'info');
}

// Show Staff Section
async function showStaffSection(staffData) {
    document.getElementById('phoneEntrySection').style.display = 'none';
    document.getElementById('visitorSection').style.display = 'none';
    document.getElementById('visitorCheckoutSection').style.display = 'none';
    
    try {
        // Check staff's last log to determine if they're inside or outside
        const response = await fetch(`${API_BASE_URL}/staff/status/${currentPhone}`);
        const statusData = await response.json();
        
        if (response.ok && statusData.success) {
            // Show staff section with appropriate form
            document.getElementById('staffSection').style.display = 'block';
            
            if (statusData.isInside) {
                // Staff is inside - show EXIT form (Going Out)
                document.getElementById('staffOutForm').style.display = 'block';
                document.getElementById('staffInForm').style.display = 'none';
                showMessage(`${staffData.name}, please fill in your exit details.`, 'info');
            } else {
                // Staff is outside - show ENTRY form (Coming In)
                document.getElementById('staffInForm').style.display = 'block';
                document.getElementById('staffOutForm').style.display = 'none';
                showMessage(`Welcome back, ${staffData.name}!`, 'success');
            }
        } else {
            throw new Error('Failed to get staff status');
        }
    } catch (error) {
        console.error('Error checking staff status:', error);
        showMessage('Error checking your status. Please try again.', 'error');
    }
}

// Send OTP for new visitor
async function sendVisitorOTP() {
    const email = document.getElementById('visitorEmail').value.trim();
    
    if (!email) {
        showMessage('Please enter your email address first', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phoneNumber: currentPhone,
                email: email,
                userType: 'visitor' 
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showMessage('OTP sent to your email successfully!', 'success');
            
            // Show OTP in development mode
            if (data.otp) {
                showMessage(`Development Mode - Your OTP: ${data.otp}`, 'info');
            }
        } else {
            showMessage(data.message || 'Failed to send OTP', 'error');
        }
    } catch (error) {
        showMessage('Failed to send OTP. Please try again.', 'error');
    }
}

// Register new visitor
async function registerVisitor() {
    const name = document.getElementById('visitorName').value.trim();
    const email = document.getElementById('visitorEmail').value.trim();
    const place = document.getElementById('visitorPlace').value.trim();
    const otp = document.getElementById('visitorOTP').value.trim() || '000000'; // Default OTP if email not working

    // ✅ VALIDATION: New Visitor - All fields mandatory
    if (!name) {
        showMessage('❌ Name is required. Please enter your name.', 'error');
        document.getElementById('visitorName').focus();
        return;
    }
    if (!email) {
        showMessage('❌ Email is required. Please enter your email.', 'error');
        document.getElementById('visitorEmail').focus();
        return;
    }
    if (!place) {
        showMessage('❌ Place/Address is required. Please enter your place.', 'error');
        document.getElementById('visitorPlace').focus();
        return;
    }
    if (!otp || otp.length < 6) {
        showMessage('❌ Valid OTP is required. Please enter the 6-digit OTP sent to your email.', 'error');
        document.getElementById('visitorOTP').focus();
        return;
    }

    try {
        // ✅ STEP 1: Verify OTP and store registration data temporarily
        const registerResponse = await fetch(`${API_BASE_URL}/visitors/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name,
                phoneNumber: currentPhone,
                email,
                place,
                otp
            })
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok || !registerData.success) {
            showMessage(registerData.message || 'Registration failed. Please try again.', 'error');
            return;
        }

        // Store registration data in sessionStorage for Step 2
        sessionStorage.setItem('newVisitorData', JSON.stringify({
            name,
            email,
            place,
            phoneNumber: currentPhone
        }));

        showMessage('✅ Registration successful! Now enter visit details.', 'success');
        document.getElementById('newVisitorForm').style.display = 'none';
        document.getElementById('visitDetailsForm').style.display = 'block';
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Registration failed. Please try again.', 'error');
    }
}

// Submit visitor request (after registration or for returning visitors)
async function submitVisitorRequest() {
    const purpose = document.getElementById('visitPurpose').value.trim();
    const whomToMeet = document.getElementById('whomToMeet').value.trim();

    // ✅ VALIDATION: Old Visitor - Purpose and Whom to Meet are mandatory
    if (!purpose) {
        showMessage('❌ Purpose of Visit is required. Please enter the purpose of your visit.', 'error');
        document.getElementById('visitPurpose').focus();
        return;
    }
    if (!whomToMeet) {
        showMessage('❌ Whom to Meet is required. Please select the person you want to meet.', 'error');
        document.getElementById('whomToMeet').focus();
        return;
    }

    try {
        // ✅ STEP 2: Submit visit request with registration data if new visitor
        const newVisitorData = sessionStorage.getItem('newVisitorData');
        let requestBody = {
            phoneNumber: currentPhone, 
            purpose, 
            whomToMeet
        };

        // If new visitor, include registration data
        if (newVisitorData) {
            const visitorInfo = JSON.parse(newVisitorData);
            requestBody = {
                ...requestBody,
                name: visitorInfo.name,
                email: visitorInfo.email,
                place: visitorInfo.place,
                isNewVisitor: true
            };
            // Clear stored data after use
            sessionStorage.removeItem('newVisitorData');
        }

        const response = await fetch(`${API_BASE_URL}/visitors/check-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showMessage('✅ Visit request submitted! Please wait for receptionist approval. This page will close in 3 seconds...', 'success');
            
            // Close the page after check-in to prevent manipulation
            setTimeout(() => {
                // Try to close the window/tab
                window.close();
                
                // If window.close() doesn't work (some browsers block it), redirect to a thank you page
                setTimeout(() => {
                    window.location.href = 'about:blank';
                }, 500);
            }, 3000);
        } else {
            showMessage(data.message || 'Failed to submit request', 'error');
        }
    } catch (error) {
        showMessage('Failed to submit request. Please try again.', 'error');
    }
}

// Submit visitor checkout
async function submitVisitorCheckout() {
    try {
        const response = await fetch(`${API_BASE_URL}/visitors/check-out`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: currentPhone })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showMessage('✅ Check-out successful! Exit time recorded. Thank you for visiting! This page will close in 2 seconds...', 'success');
            
            // Close the page after checkout
            setTimeout(() => {
                window.close();
                
                // Fallback if window.close() doesn't work
                setTimeout(() => {
                    window.location.href = 'about:blank';
                }, 500);
            }, 2000);
        } else {
            showMessage(data.message || 'Check-out failed', 'error');
        }
    } catch (error) {
        showMessage('Check-out failed. Please try again.', 'error');
    }
}

// Staff action selection
function showStaffAction(action) {
    const buttons = document.querySelectorAll('.action-select-btn');
    
    if (action === 'out') {
        document.getElementById('staffOutForm').style.display = 'block';
        document.getElementById('staffInForm').style.display = 'none';
        buttons[0].classList.add('active');
        buttons[1].classList.remove('active');
    } else {
        document.getElementById('staffOutForm').style.display = 'none';
        document.getElementById('staffInForm').style.display = 'block';
        buttons[0].classList.remove('active');
        buttons[1].classList.add('active');
    }
}

// Submit staff going out
async function submitStaffOut() {
    const purpose = document.getElementById('staffPurpose').value.trim();

    // ✅ VALIDATION: Staff - Purpose is mandatory
    if (!purpose) {
        showMessage('❌ Purpose is required. Please enter the reason for going out.', 'error');
        document.getElementById('staffPurpose').focus();
        return;
    }
    if (purpose.length < 5) {
        showMessage('❌ Please provide a more detailed purpose (at least 5 characters).', 'error');
        document.getElementById('staffPurpose').focus();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/staff/out`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phoneNumber: currentPhone, 
                purpose 
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const time = new Date().toLocaleTimeString();
            showMessage(`✅ Exit recorded at ${time}. Details sent to security. This page will close in 2 seconds...`, 'success');
            
            // Close the page after checkout
            setTimeout(() => {
                window.close();
                
                // Fallback if window.close() doesn't work
                setTimeout(() => {
                    window.location.href = 'about:blank';
                }, 500);
            }, 2000);
        } else {
            showMessage(data.message || 'Failed to record exit', 'error');
        }
    } catch (error) {
        showMessage('Failed to record exit. Please try again.', 'error');
    }
}

// Submit staff coming in
async function submitStaffIn() {
    try {
        const response = await fetch(`${API_BASE_URL}/staff/in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: currentPhone })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const time = new Date().toLocaleTimeString();
            showMessage(`✅ Entry recorded at ${time}. Details sent to security. This page will close in 2 seconds...`, 'success');
            
            // Close the page after checkin
            setTimeout(() => {
                window.close();
                
                // Fallback if window.close() doesn't work
                setTimeout(() => {
                    window.location.href = 'about:blank';
                }, 500);
            }, 2000);
        } else {
            showMessage(data.message || 'Failed to record entry', 'error');
        }
    } catch (error) {
        showMessage('Failed to record entry. Please try again.', 'error');
    }
}

// Reset form to initial state
function resetForm() {
    // Hide all sections
    document.getElementById('visitorSection').style.display = 'none';
    document.getElementById('staffSection').style.display = 'none';
    document.getElementById('visitorCheckoutSection').style.display = 'none';
    
    // Show phone entry
    document.getElementById('phoneEntrySection').style.display = 'block';
    
    // Clear all inputs
    document.getElementById('phoneNumber').value = '';
    document.getElementById('visitorName').value = '';
    document.getElementById('visitorPlace').value = '';
    document.getElementById('visitorOTP').value = '';
    document.getElementById('visitPurpose').value = '';
    document.getElementById('whomToMeet').value = '';
    document.getElementById('staffPurpose').value = '';
    
    // Reset variables
    currentPhone = '';
    userType = '';
    isNewVisitor = false;
    hasActiveVisit = false;
    
    // Clear message
    document.getElementById('messageBox').style.display = 'none';
}

// Show message helper
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';

    // Auto-hide info messages after 5 seconds
    if (type === 'info') {
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }
}
