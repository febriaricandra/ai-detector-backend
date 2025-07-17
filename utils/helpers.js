exports.validatedRegisterInput = (email, password, confirmPassword) => {
    const errors = {};

    if (email.trim() === '') {
        errors.email = 'Email field is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Email is invalid';
    }
    
    if (password.trim() === '') {
        errors.password = 'Password field is required';
    } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
    }   

    if (confirmPassword.trim() === '') {
        errors.confirmPassword = 'Confirm Password field is required';
    } else if (confirmPassword !== password) {
        errors.confirmPassword = 'Passwords must match';
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0
    };
}

exports.validatedLoginInput = (email, password) => {
    const errors = {};

    if (email.trim() === '') {
        errors.email = 'Email field is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Email is invalid';
    }

    if (password.trim() === '') {
        errors.password = 'Password field is required';
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0
    };
}

exports.handleError = (res, errors) => {
    if (errors) {
        return res.status(400).json({
            success: false,
            errors
        });
    }
    return res.status(500).json({
        success: false,
        message: 'Server Error'
    });
};
