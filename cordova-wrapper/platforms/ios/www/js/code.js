// code.js - Simple OTP verification with EmailJS
document.addEventListener('DOMContentLoaded', function() {
    console.log('Code verification page loaded');

    // Generate OTP code (6 digits)
    const code = Math.floor(100000 + Math.random() * 900000);
    console.log('Generated OTP code:', code);

    // Store in localStorage for verification
    localStorage.setItem('otpCode', code.toString());

    // Get the email from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email') || 'user@example.com';

    console.log('Email from URL:', userEmail);

    // Store email for reference
    localStorage.setItem('otpEmail', userEmail);

    // Initialize EmailJS - ADD YOUR USER ID HERE
    // Uncomment and add your EmailJS User ID:
    // emailjs.init("YOUR_EMAILJS_USER_ID_HERE");

    // Your EmailJS service and template IDs
    const serviceID = "service_gcekgr6";
    const templateID = "template_2kbzbpp";

    // Send OTP email using EmailJS
    function sendMail() {
        console.log('=== DEBUG: Starting sendMail ===');

        // Get the email from localStorage
        const userEmail = localStorage.getItem('otpEmail');

        // Validate email
        if (!userEmail || userEmail === 'user@example.com') {
            console.error('Invalid email:', userEmail);
            alert('Error: Email address not found. Please restart the signup process.');
            return;
        }

        console.log('Sending OTP email to:', userEmail);
        console.log('OTP code:', localStorage.getItem('otpCode'));

        // Show loading state
        const sendButton = document.getElementById('sendCode');
        if (sendButton) {
            sendButton.disabled = true;
            sendButton.textContent = 'Sending...';
        }

        // Use exact parameter names from your EmailJS template
        const params = {
            email: userEmail,               // Matches {{email}} in template
            code: localStorage.getItem('otpCode')  // Matches {{code}} in template
        };

        console.log('EmailJS params:', params);
        console.log('Using Service ID:', serviceID);
        console.log('Using Template ID:', templateID);

        emailjs.send(serviceID, templateID, params)
            .then(function(res) {
                console.log('✅ Email sent successfully:', res);
                alert('Verification code sent to your email!');

                // Enable OTP input
                const otpInput = document.getElementById('otpInput');
                if (otpInput) {
                    otpInput.disabled = false;
                    otpInput.focus();
                }
            })
            .catch(function(err) {
                console.error('❌ Email sending error:', err);
                console.error('Full error details:', {
                    status: err.status,
                    text: err.text,
                    emailUsed: userEmail,
                    params: params,
                    serviceID: serviceID,
                    templateID: templateID
                });

                // Try alternative: use fresh code instead of localStorage
                const alternativeParams = {
                    email: userEmail,
                    code: code.toString()  // Use the original code variable
                };

                console.log('Trying alternative params:', alternativeParams);

                // Try sending with alternative params
                emailjs.send(serviceID, templateID, alternativeParams)
                    .then(res => {
                        console.log('✅ Success with alternative params!');
                        alert('Verification code sent!');
                    })
                    .catch(altErr => {
                        console.error('❌ Alternative also failed:', altErr);
                        alert('Error: ' + (altErr.text || 'Check console for details'));
                    });
            })
            .finally(function() {
                // Reset button state
                if (sendButton) {
                    sendButton.disabled = false;
                    sendButton.textContent = 'Send Verification Code';
                }
            });
    }

    // Verify the entered OTP code
    function verifyCode() {
        const userInput = document.getElementById('otpInput').value.trim();
        const storedCode = localStorage.getItem('otpCode');

        console.log('User input:', userInput);
        console.log('Stored code:', storedCode);

        // Basic validation
        if (!userInput) {
            alert('Please enter the verification code.');
            return;
        }

        if (userInput.length !== 6) {
            alert('Code must be 6 digits.');
            return;
        }

        // Show loading state
        const verifyButton = document.getElementById('email');
        if (verifyButton) {
            verifyButton.disabled = true;
            verifyButton.textContent = 'Verifying...';
        }

        // Verify code
        if (userInput === storedCode) {
            console.log('OTP verification successful!');
            alert('Login successful!');

            // Clear OTP from localStorage
            localStorage.removeItem('otpCode');
            localStorage.removeItem('otpEmail');

            // Redirect to home page
            window.location.href = 'home.html';
        } else {
            console.log('OTP verification failed');
            alert('Invalid code. Please try again.');

            // Clear input field
            document.getElementById('otpInput').value = '';
            document.getElementById('otpInput').focus();

            // Reset button state
            if (verifyButton) {
                verifyButton.disabled = false;
                verifyButton.textContent = 'Begin Sharing!';
            }
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Send code button
        const sendButton = document.getElementById('sendCode');
        if (sendButton) {
            sendButton.addEventListener('click', sendMail);
        }

        // Verify button
        const verifyButton = document.getElementById('email');
        if (verifyButton) {
            verifyButton.addEventListener('click', verifyCode);
        }

        // OTP input - allow Enter key
        const otpInput = document.getElementById('otpInput');
        if (otpInput) {
            otpInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    verifyCode();
                }
            });

            // Auto-verify when 6 digits entered
            otpInput.addEventListener('input', function(e) {
                // Only allow digits
                this.value = this.value.replace(/[^0-9]/g, '');

                // Auto-submit when 6 digits entered
                if (this.value.length === 6) {
                    verifyCode();
                }
            });
        }

        // Auto-send email on page load (optional)
        // Uncomment if you want to automatically send on page load:
        // setTimeout(sendMail, 1000);
    }

    // Initialize
    setupEventListeners();

    // Make functions available globally for onclick handlers
    window.sendMail = sendMail;
    window.verifyCode = verifyCode;

    // Test function for debugging
    window.testEmailJS = function() {
        console.log('=== Testing EmailJS Configuration ===');
        console.log('Service ID:', serviceID);
        console.log('Template ID:', templateID);

        const testParams = {
            email: 'test@student.cis.edu.hk',
            code: '123456'
        };

        console.log('Test params:', testParams);

        emailjs.send(serviceID, templateID, testParams)
            .then(res => console.log('✅ Test successful:', res))
            .catch(err => console.error('❌ Test failed:', err));
    };
});
