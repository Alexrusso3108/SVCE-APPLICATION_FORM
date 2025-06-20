// Form data storage
let formData = JSON.parse(localStorage.getItem('admissionFormData')) || {};

// Supabase configuration (for demonstration - not recommended for sensitive keys in production)
const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

// Form pages configuration
const formPages = [
    { id: 'personalDetailsForm', title: 'Personal Details' },
    { id: 'coursePreferencesForm', title: 'Course Preferences' },
    { id: 'addressDetailsForm', title: 'Address Details' },
    { id: 'parentDetailsForm', title: 'Parent Details' },
    { id: 'educationalDetailsForm', title: 'Educational Details' },
    { id: 'declarationForm', title: 'Declaration' }
];

let currentPage = 0;

// Course options for UG and PG programs
const courseOptions = {
    ug: [
        { value: "cse", label: "Computer Science and Engineering" },
        { value: "cse-ds", label: "Computer Science and Engineering - Data Science" },
        { value: "cse-ai", label: "Computer Science and Engineering - AI" },
        { value: "cse-cyber", label: "Computer Science and Engineering - Cyber Security" },
        { value: "ise", label: "Information Science and Engineering" },
        { value: "ece", label: "Electronics and Communication Engineering" },
        { value: "mech", label: "Mechanical Engineering" },
        { value: "civil", label: "Civil Engineering" }
    ],
    pg: [
        { value: "mtech", label: "M.Tech" },
        { value: "mba", label: "MBA" },
        { value: "mca", label: "MCA" }
    ]
};

// Initialize Supabase client
let supabaseClient;
window.addEventListener('DOMContentLoaded', function() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
});

function updateCourseOptions() {
    const programSelect = document.getElementById('programPreference');
    const courseSelect = document.getElementById('coursePreference');
    
    // Clear existing options
    courseSelect.innerHTML = '<option value="">Select Course</option>';
    
    if (!programSelect.value) return;
    
    // Add new options based on program selection
    const options = courseOptions[programSelect.value] || [];
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        courseSelect.appendChild(optionElement);
    });
}

// Helper to prefill declaration fields
function prefillDeclarationFields() {
    const studentNameInput = document.getElementById('studentName');
    const dateInput = document.getElementById('date');
    // Fetch name from localStorage (formData)
    let localData = JSON.parse(localStorage.getItem('admissionFormData')) || {};
    let nameValue = localData.name || '';

    // Fallback: if name is missing, try to get from first page input
    if (!nameValue) {
        const firstPageNameInput = document.getElementById('name');
        if (firstPageNameInput && firstPageNameInput.value) {
            nameValue = firstPageNameInput.value;
        }
    }

    if (studentNameInput) {
        studentNameInput.value = nameValue; // Set value directly
        studentNameInput.readOnly = true;   // Set readOnly directly

        // CRITICAL CHECK: Verify if the value actually stuck
        if (studentNameInput.value !== nameValue) {
            // Intentionally left blank as logs are being removed
        }

        // Dispatch an input event to ensure UI updates, as if user typed it
        studentNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        // Intentionally left blank as logs are being removed
    }

    if (dateInput) {
        // Get current date in IST (Indian Standard Time)
        const now = new Date();
        const istOffset = 5.5 * 60; // IST is UTC+5:30 in minutes
        const localOffset = now.getTimezoneOffset();
        const istTime = new Date(now.getTime() + (istOffset + localOffset) * 60000);
        const istDateString = istTime.toISOString().split('T')[0];
        dateInput.value = istDateString;
        dateInput.readOnly = true;
    }
}

// Initialize form
window.onload = function() {
    // Removed: Reset all forms on load, as this clears data
    // const allForms = document.querySelectorAll('form');
    // allForms.forEach(form => {
    //     form.reset();
    // });
    
    updateProgressBar();
    
    // Set current date in the declaration form
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // Add validation for mobile number
    const mobileInput = document.getElementById('mobile');
    const mobileError = document.getElementById('mobileError');
    if (mobileInput && mobileError) {
        mobileInput.addEventListener('input', function() {
            // Remove any non-digit characters
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Limit to 10 digits
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
            
            // Validate length
            if (this.value.length !== 10) {
                mobileError.textContent = 'Please enter 10 digits valid mobile number';
                this.classList.add('error');
            } else {
                mobileError.textContent = '';
                this.classList.remove('error');
            }
        });

        // Validate on blur as well
        mobileInput.addEventListener('blur', function() {
            if (this.value.length !== 10) {
                mobileError.textContent = 'Please enter 10 digits valid mobile number';
                this.classList.add('error');
            }
        });
    }

    // Add validation for email
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    if (emailInput && emailError) {
        emailInput.addEventListener('input', function() {
            const email = this.value.trim();
            const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
            
            if (!email) {
                emailError.textContent = 'Please enter valid Email address';
                this.classList.add('error');
            } else if (!gmailRegex.test(email)) {
                emailError.textContent = 'Please enter valid Email address';
                this.classList.add('error');
            } else {
                emailError.textContent = '';
                this.classList.remove('error');
            }
        });

        // Validate on blur as well
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
            
            if (!email) {
                emailError.textContent = 'Email is required';
                this.classList.add('error');
            } else if (!gmailRegex.test(email)) {
                emailError.textContent = 'Please enter a valid Gmail address';
                this.classList.add('error');
            }
        });
    }

    // Add real-time validation for Aadhaar numbers
    const aadhaarInputs = [
        { input: document.getElementById('aadharNo'), error: document.getElementById('aadharError') },
        { input: document.getElementById('fatherAadhaar'), error: document.getElementById('fatherAadhaarError') },
        { input: document.getElementById('motherAadhaar'), error: document.getElementById('motherAadhaarError') }
    ];
    
    aadhaarInputs.forEach(({input, error}) => {
        if (input && error) {
            input.addEventListener('input', function() {
                if (this.value.length > 0 && (this.value.length !== 12 || !/^\d{12}$/.test(this.value))) {
                    error.textContent = 'Please enter a valid 12-digit Aadhaar number';
                    this.classList.add('error');
                } else {
                    error.textContent = '';
                    this.classList.remove('error');
                }
            });
        }
    });

    // Initialize course options if program is already selected
    const programSelect = document.getElementById('programPreference');
    if (programSelect && programSelect.value) {
        updateCourseOptions();
    }

    // Prefill declaration fields if on declaration page (this will now get data from localStorage)
    if (document.getElementById('declarationForm') && document.getElementById('declarationForm').classList.contains('active')) {
        prefillDeclarationFields();
    }

    setupParentMobileValidation();
    setupParentAadhaarValidation();

    // Add event listener for qualification type select
    const qualificationTypeSelect = document.getElementById('qualificationTypeSelect');
    const dynamicQualificationHeading = document.getElementById('dynamicQualificationHeading');
    const twelfthSchoolLabel = document.querySelector('label[for="twelfthSchool"]');
    const twelfthBoardLabel = document.querySelector('label[for="twelfthBoard"]');
    const twelfthYearLabel = document.querySelector('label[for="twelfthYear"]');
    const twelfthPercentageLabel = document.querySelector('label[for="twelfthPercentage"]');

    if (qualificationTypeSelect) {
        qualificationTypeSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            if (selectedValue === 'twelfth') {
                dynamicQualificationHeading.textContent = '12th Details';
                twelfthSchoolLabel.textContent = 'School/College Name';
                twelfthBoardLabel.textContent = 'Board';
                twelfthYearLabel.textContent = 'Year of Passing';
                twelfthPercentageLabel.textContent = 'Percentage';
            } else if (selectedValue === 'diploma') {
                dynamicQualificationHeading.textContent = 'Diploma Details';
                twelfthSchoolLabel.textContent = 'College Name';
                twelfthBoardLabel.textContent = 'Board';
                twelfthYearLabel.textContent = 'Year of Passing';
                twelfthPercentageLabel.textContent = 'Percentage';
            } else {
                dynamicQualificationHeading.textContent = '12th Details'; // Default
                twelfthSchoolLabel.textContent = 'School/College Name';
                twelfthBoardLabel.textContent = 'Board';
                twelfthYearLabel.textContent = 'Year of Passing';
                twelfthPercentageLabel.textContent = 'Percentage';
            }
        });

        // Trigger change on load if a value is already selected (e.g., from saved data)
        if (qualificationTypeSelect.value) {
            qualificationTypeSelect.dispatchEvent(new Event('change'));
        }
    }

    // Capitalize all text input fields
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    });
};

function loadSavedData() {
    const form = document.getElementById(formPages[currentPage].id);
    if (!form) return;

    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        // Skip the studentName input on the declaration form as it's prefilled separately
        if (form.id === 'declarationForm' && input.id === 'studentName') {
            return; 
        }
        if (formData[input.name]) {
            if (input.type === 'checkbox') {
                input.checked = formData[input.name];
                if (input.id === 'sameAddress') {
                    togglePermanentAddress();
                }
            } else {
                input.value = formData[input.name];
            }
        }
    });
}

function saveCurrentPageData() {
    const form = document.getElementById(formPages[currentPage].id);
    if (!form) return;

    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        // Skip saving the studentName input on the declaration form
        if (form.id === 'declarationForm' && input.id === 'studentName') {
            return;
        }
        if (input.type === 'checkbox') {
            formData[input.name] = input.checked;
        } else if (input.type === 'number') {
            const numValue = input.value.trim();
            formData[input.name] = numValue === '' ? null : parseFloat(numValue);
        } else {
            formData[input.name] = input.value;
        }
    });
    // Special handling for Diploma: copy twelfth fields to diploma fields if selected
    if (form.id === 'educationalDetailsForm' && formData.qualificationTypeSelect === 'diploma') {
        formData.diplomaSchool = formData.twelfthSchool;
        formData.diplomaBoard = formData.twelfthBoard;
        formData.diplomaYear = formData.twelfthYear;
        formData.diplomaPercentage = formData.twelfthPercentage;
    }
    localStorage.setItem('admissionFormData', JSON.stringify(formData));
}

function updateProgressBar() {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        if (index <= currentPage) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function validateCurrentPage() {
    const form = document.getElementById(formPages[currentPage].id);
    if (!form) return true;

    const inputs = form.querySelectorAll('input, select');
    let isValid = true;

    inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
}

function validateParentDetails() {
    const fatherName = document.getElementById('fatherName').value.trim();
    const fatherMobile = document.getElementById('fatherMobile').value.trim();
    const fatherOccupation = document.getElementById('fatherOccupation').value.trim();
    const fatherAadhaar = document.getElementById('fatherAadhaar').value.trim();
    const fatherIncome = document.getElementById('fatherIncome').value.trim();

    const motherName = document.getElementById('motherName').value.trim();
    const motherMobile = document.getElementById('motherMobile').value.trim();
    const motherOccupation = document.getElementById('motherOccupation').value.trim();
    const motherAadhaar = document.getElementById('motherAadhaar').value.trim();
    const motherIncome = document.getElementById('motherIncome').value.trim();

    const guardianName = document.getElementById('guardianName').value.trim();
    const guardianMobile = document.getElementById('guardianMobile').value.trim();
    const guardianOccupation = document.getElementById('guardianOccupation').value.trim();
    const guardianAadhaar = document.getElementById('guardianAadhaar').value.trim();
    const guardianIncome = document.getElementById('guardianIncome').value.trim();
    const guardianRelation = document.getElementById('guardianRelation').value;

    const guardianFilled = guardianName || guardianMobile || guardianOccupation || guardianAadhaar || guardianIncome || guardianRelation;

    // Validate mobile numbers if provided
    const mobileRegex = /^[0-9]{10}$/;
    
    if (fatherMobile && !mobileRegex.test(fatherMobile)) {
        document.getElementById('fatherMobileError').textContent = 'Please enter 10 digits valid mobile number';
        document.getElementById('fatherMobile').classList.add('error');
        return false;
    }

    if (motherMobile && !mobileRegex.test(motherMobile)) {
        document.getElementById('motherMobileError').textContent = 'Please enter 10 digits valid mobile number';
        document.getElementById('motherMobile').classList.add('error');
        return false;
    }

    if (guardianMobile && !mobileRegex.test(guardianMobile)) {
        document.getElementById('guardianMobileError').textContent = 'Please enter 10 digits valid mobile number';
        document.getElementById('guardianMobile').classList.add('error');
        return false;
    }

    // Validate Aadhaar numbers if provided
    const aadhaarRegex = /^[0-9]{12}$/;

    if (fatherAadhaar && !aadhaarRegex.test(fatherAadhaar)) {
        document.getElementById('fatherAadhaarError').textContent = 'Please enter valid 12-digit Aadhaar number';
        document.getElementById('fatherAadhaar').classList.add('error');
        return false;
    }

    if (motherAadhaar && !aadhaarRegex.test(motherAadhaar)) {
        document.getElementById('motherAadhaarError').textContent = 'Please enter valid 12-digit Aadhaar number';
        document.getElementById('motherAadhaar').classList.add('error');
        return false;
    }

    if (guardianAadhaar && !aadhaarRegex.test(guardianAadhaar)) {
        document.getElementById('guardianAadhaarError').textContent = 'Please enter valid 12-digit Aadhaar number';
        document.getElementById('guardianAadhaar').classList.add('error');
        return false;
    }

    // If guardian details are filled, relationship is required
    if (guardianFilled && !guardianRelation) {
        alert('Please select relationship with guardian');
        return false;
    }

    return true;
}

function setupParentMobileValidation() {
    const mobileInputs = ['fatherMobile', 'motherMobile', 'guardianMobile'];
    
    mobileInputs.forEach(id => {
        const input = document.getElementById(id);
        const errorSpan = document.getElementById(id + 'Error');

        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
            
            if (this.value.length === 10) {
                errorSpan.textContent = '';
                this.classList.remove('error');
            } else if (this.value.length > 0) {
                errorSpan.textContent = 'Please enter 10 digits valid mobile number';
                this.classList.add('error');
            } else {
                errorSpan.textContent = '';
                this.classList.remove('error');
            }
        });

        input.addEventListener('blur', function() {
            if (this.value.length > 0 && this.value.length !== 10) {
                errorSpan.textContent = 'Please enter 10 digits valid mobile number';
                this.classList.add('error');
            }
        });
    });
}

function setupParentAadhaarValidation() {
    const aadhaarInputs = ['fatherAadhaar', 'motherAadhaar', 'guardianAadhaar'];
    
    aadhaarInputs.forEach(id => {
        const input = document.getElementById(id);
        const errorSpan = document.getElementById(id + 'Error');

        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 12) {
                this.value = this.value.slice(0, 12);
            }
            
            if (this.value.length === 12) {
                errorSpan.textContent = '';
                this.classList.remove('error');
            } else if (this.value.length > 0) {
                errorSpan.textContent = 'Please enter valid 12-digit Aadhaar number';
                this.classList.add('error');
            } else {
                errorSpan.textContent = '';
                this.classList.remove('error');
            }
        });

        input.addEventListener('blur', function() {
            if (this.value.length > 0 && this.value.length !== 12) {
                errorSpan.textContent = 'Please enter valid 12-digit Aadhaar number';
                this.classList.add('error');
            }
        });
    });
}

function saveAndNext(nextPage) {
    if (currentPage === 4) { // Parent Details page
        if (!validateParentDetails()) {
            return;
        }
    }
    // Get the current form
    const currentForm = document.querySelector('.form-section.active');
    // Validate form fields
    if (!validateForm(currentForm)) {
        return;
    }
    // Save current page data to localStorage
    saveCurrentPageData();
    // Hide current form
    currentForm.classList.remove('active');
    // Show next form
    const nextForm = document.querySelector(`#${getFormIdByStep(nextPage)}`);
    nextForm.classList.add('active');
    // Update progress bar
    updateProgressBar(nextPage);
    // Update currentPage to the new page index
    currentPage = nextPage - 1;

    // If navigating to the declaration form, prefill fields after a short delay
    if (nextForm.id === 'declarationForm') {
        setTimeout(() => {
            prefillDeclarationFields();
            const studentNameInput = document.getElementById('studentName');
            if (studentNameInput) {
                // Intentionally left blank as logs are being removed
            }
        }, 50); // Small delay to ensure rendering is complete
    }
}

function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
        } else {
            // Additional validation for specific fields
            if (input.type === 'tel' && input.value.length !== 10) {
                isValid = false;
                input.classList.add('error');
                const errorElement = document.getElementById(input.id + 'Error');
                if (errorElement) {
                    errorElement.textContent = 'Please enter exactly 10 digits';
                }
            } else if (input.type === 'email') {
                const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
                if (!gmailRegex.test(input.value.trim())) {
                    isValid = false;
                    input.classList.add('error');
                    const errorElement = document.getElementById(input.id + 'Error');
                    if (errorElement) {
                        errorElement.textContent = 'Please enter a valid Gmail address';
                    }
                }
            } else {
                input.classList.remove('error');
            }
        }
    });
    
    if (!isValid) {
        alert('Please fill in all required fields correctly');
    }
    
    return isValid;
}

function getFormIdByStep(step) {
    switch(step) {
        case 1: return 'personalDetailsForm';
        case 2: return 'coursePreferencesForm';
        case 3: return 'addressDetailsForm';
        case 4: return 'parentDetailsForm';
        case 5: return 'educationalDetailsForm';
        case 6: return 'declarationForm';
        default: return 'personalDetailsForm';
    }
}

function updateProgressBar(currentStep) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        if (index < currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function navigateToPage(step) {
    const currentForm = document.querySelector('.form-section.active');
    // Save current page data before navigating away
    saveCurrentPageData();
    currentForm.classList.remove('active');
    
    const targetForm = document.querySelector(`#${getFormIdByStep(step)}`);
    targetForm.classList.add('active');
    
    // Load data for the newly active form
    loadSavedData();

    updateProgressBar(step);
    if (targetForm.id === 'declarationForm') {
        // Call prefill with a small delay to ensure rendering is complete
        setTimeout(() => {
            prefillDeclarationFields();
            const studentNameInput = document.getElementById('studentName');
            if (studentNameInput) {
                // Intentionally left blank as logs are being removed
            }
        }, 50); // Small delay, e.g., 50ms
    }
}

function togglePermanentAddress() {
    const sameAddress = document.getElementById('sameAddress');
    const permanentAddressSection = document.getElementById('permanentAddressSection');
    
    if (sameAddress.checked) {
        // Copy communication address to permanent address
        document.getElementById('permAddressLine1').value = document.getElementById('commAddressLine1').value;
        document.getElementById('permAddressLine2').value = document.getElementById('commAddressLine2').value;
        document.getElementById('permCity').value = document.getElementById('commCity').value;
        document.getElementById('permState').value = document.getElementById('commState').value;
        document.getElementById('permPincode').value = document.getElementById('commPincode').value;
        
        permanentAddressSection.style.display = 'none';
    } else {
        permanentAddressSection.style.display = 'block';
    }
}

function submitForm() {
    const declarationForm = document.getElementById('declarationForm');
    if (!validateForm(declarationForm)) {
        return;
    }
    if (!document.getElementById('agreementCheckbox').checked) {
        alert('Please agree to the declaration before submitting');
        return;
    }
    // Save current page data to localStorage
    saveCurrentPageData();
    // Gather all data from localStorage
    let localData = JSON.parse(localStorage.getItem('admissionFormData')) || {};
    // Compose the data object for Supabase
    const dataToInsert = {
        name: localData.name,
        mobile: localData.mobile,
        email: localData.email,
        dob: localData.dob,
        gender: localData.gender,
        religion: localData.religion,
        category: localData.category,
        aadhar_no: localData.aadharNo,
        program_preference: localData.programPreference,
        course_preference: localData.coursePreference,
        comm_address_line1: localData.commAddressLine1,
        comm_address_line2: localData.commAddressLine2,
        comm_city: localData.commCity,
        comm_state: localData.commState,
        comm_pincode: localData.commPincode,
        perm_address_line1: localData.permAddressLine1,
        perm_address_line2: localData.permAddressLine2,
        perm_city: localData.permCity,
        perm_state: localData.permState,
        perm_pincode: localData.permPincode,
        father_name: localData.fatherName,
        father_mobile: localData.fatherMobile,
        father_occupation: localData.fatherOccupation,
        father_aadhaar: localData.fatherAadhaar,
        father_income: localData.fatherIncome,
        mother_name: localData.motherName,
        mother_mobile: localData.motherMobile,
        mother_occupation: localData.motherOccupation,
        mother_aadhaar: localData.motherAadhaar,
        mother_income: localData.motherIncome,
        guardian_name: localData.guardianName,
        guardian_mobile: localData.guardianMobile,
        guardian_occupation: localData.guardianOccupation,
        guardian_aadhaar: localData.guardianAadhaar,
        guardian_income: localData.guardianIncome,
        guardian_relation: localData.guardianRelation,
        tenth_school: localData.tenthSchool,
        tenth_board: localData.tenthBoard,
        tenth_year: localData.tenthYear,
        tenth_percentage: localData.tenthPercentage,
        qualification_type: localData.qualificationTypeSelect,
        twelfth_school: localData.twelfthSchool,
        twelfth_board: localData.twelfthBoard,
        twelfth_year: localData.twelfthYear,
        twelfth_percentage: localData.twelfthPercentage,
        diploma_school: localData.diplomaSchool,
        diploma_board: localData.diplomaBoard,
        diploma_year: localData.diplomaYear,
        diploma_percentage: localData.diplomaPercentage,
        declaration_agreed: document.getElementById('agreementCheckbox').checked,
        declaration_date: document.getElementById('date').value
    };
    // Remove undefined fields
    Object.keys(dataToInsert).forEach(key => {
        if (typeof dataToInsert[key] === 'undefined') delete dataToInsert[key];
    });
    // Insert into Supabase
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        alert('Supabase client not loaded. Please check your internet connection and script includes.');
        return;
    }
    const submitBtn = declarationForm.querySelector('button.btn.btn-primary');
    if (submitBtn) submitBtn.disabled = true;
    supabaseClient
        .from('personal_details')
        .insert([dataToInsert])
        .select()
        .then(({ error }) => {
            if (submitBtn) submitBtn.disabled = false;
            if (error) {
                alert('Failed to submit form: ' + error.message);
                return;
            } else {
                showSuccessAnimation(); // Call success animation
                setTimeout(() => {
                    // Clear form data after successful submission and animation
                    localStorage.removeItem('admissionFormData');
                    formData = {};
                    // Reset all forms and navigate back to the first page
                    document.querySelectorAll('form').forEach(form => form.reset());
                    navigateToPage(1);
                    hideSuccessAnimation();
                }, 3000); // Hide after 3 seconds
            }
        });
}

function showSuccessAnimation() {
    const successOverlay = document.getElementById('successOverlay');
    if (successOverlay) {
        successOverlay.style.display = 'flex';
        const sparklesContainer = document.querySelector('.sparkles-container');
        if (sparklesContainer) {
            sparklesContainer.innerHTML = ''; // Clear previous sparkles
            for (let i = 0; i < 30; i++) {
                createSparkle(sparklesContainer);
            }
        }
    }
}

function hideSuccessAnimation() {
    const successOverlay = document.getElementById('successOverlay');
    if (successOverlay) {
        successOverlay.style.display = 'none';
    }
}

function createSparkle(container) {
    const sparkle = document.createElement('div');
    sparkle.classList.add('sparkle');
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.top = `${Math.random() * 100}%`;
    sparkle.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
    sparkle.style.animationDelay = `${Math.random() * 1.5}s`;
    container.appendChild(sparkle);

    // Remove sparkle after animation to prevent DOM bloat
    sparkle.addEventListener('animationend', () => {
        sparkle.remove();
    });
}

function generatePrintPreview() {
    saveCurrentPageData(); // Ensure current page data is saved to formData

    const printWindow = window.open('', 'printWindow');
    printWindow.document.write('<style>');
    printWindow.document.write(`
        html, body { font-family: Arial, sans-serif; margin: 0 !important; padding: 0 !important; color: #333; width: 100vw !important; max-width: 100vw !important; box-sizing: border-box; }
        h1, h2, h3 { color: #2c3e50; padding-bottom: 0; margin-top: 4px; margin-bottom: 4px; border-bottom: none; }
        .section { margin: 0 !important; padding: 0 !important; border-bottom: none !important; }
        .field { margin-bottom: 2px; }
        .field strong { display: inline-block; width: 180px; }
        .declaration-text ol { padding-left: 10px; }
        .declaration-text li { margin-bottom: 1px; }
        table { width: 100vw !important; max-width: 100vw !important; border-spacing: 0; border-collapse: collapse; margin: 0 !important; }
        th, td { padding: 1px 2px !important; }
        @media print {
            html, body {
                width: 100vw !important;
                height: 297mm;
                max-width: 100vw !important;
                max-height: 100vh;
                margin: 0 !important;
                padding: 0 !important;
                zoom: 1 !important;
                box-sizing: border-box;
            }
            .section {
                page-break-inside: avoid;
            }
            .logo-section, h1 {
                page-break-before: avoid;
            }
            .section:last-child {
                page-break-after: auto;
            }
            table { width: 100vw !important; max-width: 100vw !important; margin: 0 !important; }
            th, td { padding: 1px 2px !important; }
            /* Force only 2 pages */
            body {
                max-height: calc(2 * 297mm);
                overflow: hidden;
            }
        }
    `);
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    // Always show the provided header image at the top of the print preview
    printWindow.document.write('<div style="margin-bottom: 2rem;"><img src="svce-new-logo.png" alt="SVCE Header" style="width: 100%; max-width: 1000px; height: auto; display: block; margin: 0 auto 1rem auto;"></div>');
    printWindow.document.write('<h1 style="text-align:center;">Application Form For Admission to UG/PG</h1>');

    // Personal Details
    printWindow.document.write('<div class="section" style="margin-bottom: 24px;">');
    printWindow.document.write('<table style="width:100%;border-collapse:collapse;">');
    printWindow.document.write('<thead><tr><th colspan="2" style="background:#1976d2;color:#fff;padding:6px 10px;text-align:left;font-size:1rem;border:1px solid #333;">Personal Details</th></tr></thead>');
    printWindow.document.write('<tbody>');
    printWindow.document.write(`<tr><td style="font-weight:bold;width:40%;padding:4px 8px;border:1px solid #333;">Full Name</td><td style="padding:4px 8px;border:1px solid #333;">${(formData.name || 'N/A').toUpperCase()}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Email</td><td style="border:1px solid #333;">${formData.email || 'N/A'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Mobile Number</td><td style="border:1px solid #333;">${formData.mobile || 'N/A'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Date of Birth</td><td style="border:1px solid #333;">${formData.dob || 'N/A'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Gender</td><td style="border:1px solid #333;">${(formData.gender || 'N/A').toUpperCase()}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Religion</td><td style="border:1px solid #333;">${(formData.religion || 'N/A').toUpperCase()}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Caste Category</td><td style="border:1px solid #333;">${(formData.category || 'N/A').toUpperCase()}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Aadhaar Number</td><td style="border:1px solid #333;">${formData.aadharNo || 'N/A'}</td></tr>`);
    printWindow.document.write('</tbody></table></div>');

    // Course Preferences
    printWindow.document.write('<div class="section" style="margin-bottom: 24px;">');
    printWindow.document.write('<table style="width:100%;border-collapse:collapse;">');
    printWindow.document.write('<thead><tr><th style="background:#1976d2;color:#fff;padding:6px 10px;text-align:left;border:1px solid #333;">Program Preference</th><th style="background:#1976d2;color:#fff;padding:6px 10px;text-align:left;border:1px solid #333;">Course Preference</th></tr></thead>');
    printWindow.document.write('<tbody>');
    printWindow.document.write(`<tr><td style="padding:4px 8px;border:1px solid #333;">${(formData.programPreference || 'N/A').toUpperCase()}</td><td style="padding:4px 8px;border:1px solid #333;">${(formData.coursePreference || 'N/A').toUpperCase()}</td></tr>`);
    printWindow.document.write('</tbody></table></div>');

    // Address Details
    printWindow.document.write('<div class="section" style="margin-bottom: 24px;">');
    printWindow.document.write('<table style="width:100%;border-collapse:collapse;">');
    printWindow.document.write('<thead><tr><th colspan="3" style="background:#1976d2;color:#fff;padding:6px 10px;text-align:left;font-size:1rem;border:1px solid #333;">Address Details</th></tr>');
    printWindow.document.write('<tr><th style="background:#e3f0fb;padding:6px 10px;border:1px solid #333;"></th><th style="background:#e3f0fb;padding:6px 10px;border:1px solid #333;">Communication Address</th><th style="background:#e3f0fb;padding:6px 10px;border:1px solid #333;">Permanent Address</th></tr></thead>');
    printWindow.document.write('<tbody>');
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Address(House No/Street/Taluk)</td><td style="border:1px solid #333;">${formData.commAddressLine1 || '-'}</td><td style="border:1px solid #333;">${formData.permAddressLine1 || '-'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">District</td><td style="border:1px solid #333;">${formData.commAddressLine2 || '-'}</td><td style="border:1px solid #333;">${formData.permAddressLine2 || '-'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">City</td><td style="border:1px solid #333;">${formData.commCity || '-'}</td><td style="border:1px solid #333;">${formData.permCity || '-'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">State</td><td style="border:1px solid #333;">${formData.commState || '-'}</td><td style="border:1px solid #333;">${formData.permState || '-'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Pincode</td><td style="border:1px solid #333;">${formData.commPincode || '-'}</td><td style="border:1px solid #333;">${formData.permPincode || '-'}</td></tr>`);
    printWindow.document.write('</tbody></table></div>');

    // Parent/Guardian Details
    printWindow.document.write('<div class="section" style="margin-bottom: 24px;">');
    printWindow.document.write('<table style="width:100%;border-collapse:collapse;">');
    printWindow.document.write('<thead><tr><th colspan="2" style="background:#1976d2;color:#fff;padding:6px 10px;text-align:left;font-size:1rem;border:1px solid #333;">Parent Details</th></tr></thead>');
    printWindow.document.write('<tbody>');
    // Father Details
    if (formData.fatherName || formData.fatherMobile || formData.fatherOccupation || formData.fatherAadhaar || formData.fatherIncome) {
        printWindow.document.write(`<tr><td style="font-weight:bold;width:40%;padding:4px 8px;border:1px solid #333;">Father Name</td><td style="padding:4px 8px;border:1px solid #333;">${formData.fatherName || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Father's Mobile Number</td><td style="border:1px solid #333;">${formData.fatherMobile || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Father's Occupation</td><td style="border:1px solid #333;">${formData.fatherOccupation || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Father's Aadhaar Number</td><td style="border:1px solid #333;">${formData.fatherAadhaar || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Father's Annual Income</td><td style="border:1px solid #333;">${formData.fatherIncome || '-'}</td></tr>`);
    }
    // Mother Details
    if (formData.motherName || formData.motherMobile || formData.motherOccupation || formData.motherAadhaar || formData.motherIncome) {
        printWindow.document.write(`<tr><td style="font-weight:bold;width:40%;padding:4px 8px;border:1px solid #333;">Mother Name</td><td style="padding:4px 8px;border:1px solid #333;">${formData.motherName || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Mother's Mobile Number</td><td style="border:1px solid #333;">${formData.motherMobile || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Mother's Occupation</td><td style="border:1px solid #333;">${formData.motherOccupation || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Mother's Aadhaar Number</td><td style="border:1px solid #333;">${formData.motherAadhaar || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Mother's Annual Income</td><td style="border:1px solid #333;">${formData.motherIncome || '-'}</td></tr>`);
    }
    // Guardian Details
    if (formData.guardianName || formData.guardianMobile || formData.guardianOccupation || formData.guardianAadhaar || formData.guardianIncome || formData.guardianRelation) {
        printWindow.document.write(`<tr><td style="font-weight:bold;width:40%;padding:4px 8px;border:1px solid #333;">Guardian Name</td><td style="padding:4px 8px;border:1px solid #333;">${formData.guardianName || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Guardian's Mobile Number</td><td style="border:1px solid #333;">${formData.guardianMobile || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Guardian's Occupation</td><td style="border:1px solid #333;">${formData.guardianOccupation || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Guardian's Aadhaar Number</td><td style="border:1px solid #333;">${formData.guardianAadhaar || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Guardian's Annual Income</td><td style="border:1px solid #333;">${formData.guardianIncome || '-'}</td></tr>`);
        printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Relationship with Student</td><td style="border:1px solid #333;">${formData.guardianRelation || '-'}</td></tr>`);
    }
    printWindow.document.write('</tbody></table></div>');

    // Educational Details
    printWindow.document.write('<div class="section" style="margin-bottom: 24px;">');
    printWindow.document.write('<table style="width:100%;border-collapse:collapse;">');
    printWindow.document.write('<thead><tr><th colspan="4" style="background:#1976d2;color:#fff;padding:6px 10px;text-align:left;font-size:1rem;border:1px solid #333;">Educational Details</th></tr>');
    printWindow.document.write('<tr><th style="background:#e3f0fb;padding:6px 10px;border:1px solid #333;width:28%"> </th><th style="background:#e3f0fb;padding:6px 10px;border:1px solid #333;">10th Details</th><th style="background:#e3f0fb;padding:6px 10px;border:1px solid #333;">12th Details</th><th style="background:#e3f0fb;padding:6px 10px;border:1px solid #333;">Diploma</th></tr></thead>');
    printWindow.document.write('<tbody>');
    // Determine which qualification is selected
    const isDiploma = formData.qualificationTypeSelect === 'diploma';
    const isTwelfth = formData.qualificationTypeSelect === 'twelfth';
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Candidate's Name As Per Qualifying Examination Marksheet</td><td style="border:1px solid #333;">${formData.name || '-'}</td><td style="border:1px solid #333;">${isTwelfth ? (formData.name || '-') : '-'}</td><td style="border:1px solid #333;">${isDiploma ? (formData.name || '-') : '-'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Institution Name</td><td style="border:1px solid #333;">${formData.tenthSchool || '-'}</td><td style="border:1px solid #333;">${isTwelfth ? (formData.twelfthSchool || '-') : '-'}</td><td style="border:1px solid #333;">${isDiploma ? (formData.diplomaSchool || '-') : '-'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Board/University</td><td style="border:1px solid #333;">${formData.tenthBoard || '-'}</td><td style="border:1px solid #333;">${isTwelfth ? (formData.twelfthBoard || '-') : '-'}</td><td style="border:1px solid #333;">${isDiploma ? (formData.diplomaBoard || '-') : '-'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Year of passing</td><td style="border:1px solid #333;">${formData.tenthYear || '-'}</td><td style="border:1px solid #333;">${isTwelfth ? (formData.twelfthYear || '-') : '-'}</td><td style="border:1px solid #333;">${isDiploma ? (formData.diplomaYear || '-') : '-'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Obtained Percentage/CGPA</td><td style="border:1px solid #333;">${formData.tenthPercentage || '-'}</td><td style="border:1px solid #333;">${isTwelfth ? (formData.twelfthPercentage || '-') : '-'}</td><td style="border:1px solid #333;">${isDiploma ? (formData.diplomaPercentage || '-') : '-'}</td></tr>`);
    printWindow.document.write('</tbody></table></div>');

    // Declaration Details
    printWindow.document.write('<div class="section" style="margin-bottom: 24px;">');
    printWindow.document.write('<table style="width:100%;border-collapse:collapse;">');
    printWindow.document.write('<thead><tr><th colspan="2" style="background:#1976d2;color:#fff;padding:6px 10px;text-align:left;font-size:1rem;border:1px solid #333;">Declaration</th></tr></thead>');
    printWindow.document.write('<tbody>');
    printWindow.document.write('<tr><td colspan="2" style="border:1px solid #333; padding:10px;">');
    printWindow.document.write('<div class="declaration-text"><ol style="margin:0;padding-left:20px;">');
    printWindow.document.write('<li>I declare that the particulars and information furnished above are fully true and correct.</li>');
    printWindow.document.write('<li>If there is any false information / fake certificate of any forgery in the particulars / certificates / documents submitted by me / my ward to the authorities of SVCE/VTU/DTE/AICTE, my/ my wards admission may at once be cancelled and necessary action can be taken by SVCE Management.</li>');
    printWindow.document.write('<li>I promise to abide by the Rules & Regulations of the Institution and I can be subjected to any disciplinary action, if need arises, and also my admission can be cancelled, if I am found not obeying the rules & regulations.</li>');
    printWindow.document.write('<li>I agree to adhere to Rules and Regulations, scheme of study & examinations of the Visvesvaraya Technological University, Belagavi.</li>');
    printWindow.document.write('<li>I do not include myself in ragging or any other such activity which is treated as illegal in the eye of law and in any of the form.</li>');
    printWindow.document.write('<li>I agree to the applicant\'s admission to the institution. I shall be responsible for the payment of all his/her fees and charges, I shall be responsible for his/her conduct and good behaviour during the course & the entire period till he/she gets the degree.</li>');
    printWindow.document.write('<li>I will not claim or demand, under any circumstances or for any reasons, any refund of amount paid to the institution or to Management in connection with his/her admission even though he/ she withdraws his/her candidature and admission at any time during the course at his/her own risk or financial loss. There is no necessity to inform me further on these lines.</li>');
    printWindow.document.write('<li>If I am leaving the course either in the middle or on completion of the course, I will commit myself to clear all the dues before collecting TC/College leaving certificate.</li>');
    printWindow.document.write('<li>College has the right to use photographs and/or video recordings of me, taken during academic events, cultural activities, or in connection with my academic performance, for use in college-related marketing and promotional materials.</li>');
    printWindow.document.write('<li>I acknowledge that the college holds copyright and ownership rights for any student\'s research publications, patents, or innovations developed or presented under the college\'s guidance.</li>');
    printWindow.document.write('<li>I will be responsible for any damage I cause to college property, whether on or off campus, and I shall pay the applicable damage charges.</li>');
    printWindow.document.write('<li>Any disputes arise is within the Jurisdiction of Bangalore city only.</li>');
    printWindow.document.write('</ol></div>');
    printWindow.document.write('</td></tr>');
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Student Name</td><td style="border:1px solid #333;">${formData.name || 'N/A'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Date</td><td style="border:1px solid #333;">${formData.date || 'N/A'}</td></tr>`);
    printWindow.document.write(`<tr><td style="font-weight:bold;border:1px solid #333;">Student Signature</td><td style="border:1px solid #333;">______________________________</td></tr>`);
    printWindow.document.write('</tbody></table></div>');

    // Add office use box
    printWindow.document.write('<div style="margin-top:18px;width:100vw;">');
    printWindow.document.write('<table style="width:100vw;border:2px solid #333;margin:0 auto 0 auto;">');
    printWindow.document.write('<tr><th style="background:#f3f3f3;color:#222;padding:6px 10px;text-align:left;font-size:1rem;border-bottom:2px solid #333;">For Office Use Only</th></tr>');
    printWindow.document.write('<tr><td style="height:180px;padding:10px;">&nbsp;</td></tr>');
    printWindow.document.write('</table></div>');

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    // Wait for the image to load before printing
    printWindow.onload = function() {
        setTimeout(function() {
            printWindow.print();
        }, 500); // 500ms delay to ensure image loads
    };
}