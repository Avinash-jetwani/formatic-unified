// Debug script to test form update
const formData = {
  submissionMessage: "",
  category: "",
  tags: [],
  isTemplate: false,
  successRedirectUrl: null,
  accessPassword: "",
  accessRestriction: "none",
  allowedEmails: [],
  emailNotifications: true,
  expirationDate: null,
  maxSubmissions: null,
  multiPageEnabled: false,
  notificationEmails: ["jetwani@gmail.com, ajetwani1@gmail.com"], // This is the problematic line
  notificationType: "all",
  requireConsent: false,
  consentText: "I consent to having this website store my submitted information."
};

console.log("Original data:", JSON.stringify(formData, null, 2));

// Fix the notificationEmails array
const fixedData = {
  ...formData,
  notificationEmails: formData.notificationEmails[0].split(',').map(email => email.trim())
};

console.log("Fixed data:", JSON.stringify(fixedData, null, 2)); 