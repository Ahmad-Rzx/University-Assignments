// Client-side validation for the contact form.
// Validates on submit, and re-validates a field live once it has been
// touched, so errors clear as soon as the user fixes them.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const successMessage = document.getElementById("form-success");

  const fields = {
    name: {
      input: document.getElementById("name"),
      errorEl: document.getElementById("error-name"),
      validate: (value) => {
        if (value.trim().length === 0) return "Please enter your name.";
        if (value.trim().length < 2) return "Name must be at least 2 characters.";
        return "";
      },
    },
    email: {
      input: document.getElementById("email"),
      errorEl: document.getElementById("error-email"),
      validate: (value) => {
        if (value.trim().length === 0) return "Please enter an email address.";
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!pattern.test(value.trim())) return "Enter a valid email address.";
        return "";
      },
    },
    subject: {
      input: document.getElementById("subject"),
      errorEl: document.getElementById("error-subject"),
      validate: (value) => {
        if (value === "") return "Please choose a subject.";
        return "";
      },
    },
    message: {
      input: document.getElementById("message"),
      errorEl: document.getElementById("error-message"),
      validate: (value) => {
        if (value.trim().length === 0) return "Please write a message.";
        if (value.trim().length < 10) return "Message should be at least 10 characters.";
        return "";
      },
    },
  };

  const setFieldError = (field, message) => {
    field.errorEl.textContent = message;
    field.input.closest(".form-field").classList.toggle("has-error", Boolean(message));
  };

  const validateField = (key) => {
    const field = fields[key];
    const message = field.validate(field.input.value);
    setFieldError(field, message);
    return message === "";
  };

  // Live re-validation once a field has been interacted with.
  Object.keys(fields).forEach((key) => {
    const field = fields[key];
    const eventName = field.input.tagName === "SELECT" ? "change" : "input";
    field.input.addEventListener(eventName, () => validateField(key));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const results = Object.keys(fields).map((key) => validateField(key));
    const allValid = results.every(Boolean);

    if (allValid) {
      successMessage.hidden = false;
      form.reset();
      Object.keys(fields).forEach((key) => setFieldError(fields[key], ""));
    } else {
      successMessage.hidden = true;
      // Move focus to the first invalid field for accessibility.
      const firstInvalidKey = Object.keys(fields).find(
        (key, i) => !results[i]
      );
      if (firstInvalidKey) fields[firstInvalidKey].input.focus();
    }
  });
});
