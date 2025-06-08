# Quick Email Setup Guide

## ✅ What's Done:
- ✅ Email system code deployed to EC2
- ✅ AWS SES domain verified (datizmo.com)
- ✅ AWS credentials generated
- ✅ Beautiful email templates created

## 🚀 Next Steps:

### 1. Configure EC2 Environment (5 minutes)

SSH into your EC2:
```bash
ssh -i "datizmo_deploy_key" ec2-user@18.133.10.17
```

Navigate to backend and edit .env:
```bash
cd /home/ec2-user/formatic-unified/backend
nano .env
```

Add these lines to your .env file:
```bash
# Email Configuration
EMAIL_PROVIDER=aws-ses
APP_NAME="Datizmo"
MAIL_FROM="no-reply@datizmo.com"
SUPPORT_EMAIL="support@datizmo.com"
ADMIN_EMAIL="admin@datizmo.com"

# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here

# Update Frontend URL
FRONTEND_URL=https://datizmo.com
```

Save (Ctrl+X, Y, Enter) and restart:
```bash
pm2 restart formatic-app
pm2 logs formatic-app
```

### 2. Reply to AWS for Production Access

Copy this response and reply to the AWS email:

---

**Subject:** Re: Amazon SES Production Access Request - Additional Information

Hello AWS Support Team,

Thank you for your response. I'm happy to provide additional details about my email sending use case for Datizmo.

**Application Overview:**
Datizmo is a professional form builder platform that allows users to create, manage, and collect form submissions. Our verified domain is **datizmo.com** and our verified sending identity is **no-reply@datizmo.com**.

**Email Types and Frequency:**
We send **transactional emails only** with the following types:

1. **Welcome Emails** - Sent immediately when new users register (estimated 20-50 per month)
2. **Password Reset Emails** - Sent when users request password resets (estimated 10-30 per month) 
3. **Form Submission Notifications** - Sent to form owners when they receive new submissions (estimated 50-200 per month)
4. **Email Verification** - Sent to verify new user email addresses (estimated 20-50 per month)
5. **System Notifications** - Critical alerts to administrators (estimated 5-10 per month)

**Total estimated volume:** 100-350 emails per month initially, growing to 500-1000 emails per month as we scale.

**Recipient List Management:**
- **Opt-in Only**: All emails are sent to users who explicitly signed up for our service
- **No Marketing**: We send zero promotional or marketing emails
- **Verified Recipients**: All emails go to verified email addresses of our registered users
- **No Third-party Lists**: We never purchase or use external email lists

**Bounce and Complaint Management:**
- **Automated Handling**: Our system automatically processes bounce notifications from SES
- **Suppression Lists**: We maintain suppression lists to prevent sending to bounced addresses
- **Monitoring**: We actively monitor bounce rates and complaint rates through SES dashboard
- **Immediate Action**: Any complaints result in immediate removal from our system

**Verified Identity Confirmation:**
✅ **Domain verified**: datizmo.com (Status: Verified)
✅ **Email verified**: no-reply@datizmo.com (Status: Verified)
✅ **DKIM configured**: Easy DKIM enabled and verified

We are committed to maintaining high sending reputation and following AWS SES best practices.

Thank you for your consideration.

Best regards,
Datizmo Development Team

---

### 3. Test Your Setup

Once configured, test by:
1. Going to https://datizmo.com
2. Try password reset or form submission
3. Check EC2 logs: `pm2 logs formatic-app`
4. You should see email logs in console

## 🎯 Expected Timeline:
- **EC2 Configuration**: 5 minutes
- **AWS Response**: Send immediately  
- **AWS Approval**: Usually within 24 hours
- **Live Email System**: Ready after approval!

## 🚨 Important:
- Keep `NODE_ENV=development` until AWS approves production access
- After approval, change to `NODE_ENV=production` to send real emails
- Your email system will automatically notify form owners of new submissions

---

**Your email system is ready to go live! 🚀** 