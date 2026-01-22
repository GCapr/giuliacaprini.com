# Research Assistant Application System - Setup Guide

This guide will help you set up the complete RA application system using Basin for form submissions, Google Apps Script for processing, and OpenAI for AI-powered summaries.

---

## Architecture Overview

```
Website Form (contact_form.html)
        ↓
    Basin.com (receives submissions, stores files)
        ↓
    Webhook to Google Apps Script
        ↓
    OpenAI API (generates summary)
        ↓
    Email to you (raw answers + AI summary)
```

---

## Step 1: Deploy the Google Apps Script

The form on your website is already configured. Now you need to set up the backend.

### 1.1 Create the Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click **"New project"**
3. Name it: **"RA Application Processor"** (click "Untitled project" at top)

### 1.2 Add the Code

1. Delete any existing code in the editor
2. Copy the entire contents of `ra-application-script.js` from your website folder
3. Paste it into the Apps Script editor
4. Click **Save** (Ctrl+S or Cmd+S)

### 1.3 Add Your OpenAI API Key (Secure Storage)

**Important:** The API key is stored securely in Google's Script Properties, NOT in the code.

1. In the Apps Script editor, click the **gear icon** (Project Settings) in the left sidebar
2. Scroll down to **"Script Properties"**
3. Click **"Add script property"**
4. Set:
   - **Property:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key
5. Click **Save**

### 1.4 Deploy as Web App

1. Click **"Deploy"** button (top right) → **"New deployment"**
2. Click the gear icon next to "Select type" → choose **"Web app"**
3. Configure:
   - **Description:** "RA Application Webhook"
   - **Execute as:** "Me"
   - **Who has access:** "Anyone"
4. Click **"Deploy"**
5. **Authorize the script:**
   - Click "Authorize access"
   - Select your Google account
   - Click "Advanced" → "Go to RA Application Processor (unsafe)"
   - Click "Allow"
6. **Copy the Web app URL** - you'll need this for Basin!

The URL will look like: `https://script.google.com/macros/s/ABC123.../exec`

---

## Step 2: Connect Basin to Your Script

1. Go to [usebasin.com](https://usebasin.com) and log in
2. Find your form (the one at `https://usebasin.com/f/8d6de4635559`)
3. Go to **Integrations** or **Webhooks** section
4. Click **"Add webhook"**
5. Paste the Google Apps Script Web app URL you copied
6. Save the webhook

---

## Step 3: Test the System

1. Go to your website's RA application form
2. Fill it out with test data
3. Submit the form
4. Check your email (giulia.caprini@sciencespo.fr) for the application report
5. Verify the AI summary is generated

**Expected email contents:**
- Header with applicant name and email
- AI-generated summary with: Candidate Profile, Project Fit, Key Skills, Motivation, Recommendation
- Full raw responses
- Link to download CV (hosted on Basin)

---

## Troubleshooting

### "AI summary not available - OpenAI API key not configured"
- Go to Apps Script → Project Settings → Script Properties
- Verify `OPENAI_API_KEY` property exists with correct value
- Make sure you have billing set up on OpenAI

### Not receiving emails
- Check spam folder
- In Apps Script, go to **View → Executions** to see logs
- Verify the recipient email in the CONFIG section of the script
- Check that Basin webhook is configured correctly

### Basin webhook not working
- Verify the Web app URL is correct in Basin
- Make sure the script is deployed with "Anyone" access
- Check Apps Script execution logs for errors

### Need to update the script?
After editing the code:
1. Click **Deploy** → **Manage deployments**
2. Click the **pencil icon** to edit
3. Change **Version** to "New version"
4. Click **Deploy**

---

## Updating Projects

To change the available research projects:

1. Edit `contact_form.html` - update the checkbox options in the form
2. Edit `ra-application-script.js` - update the `projects` array in CONFIG
3. Redeploy the Apps Script (see above)

---

## File Locations

| File | Purpose |
|------|---------|
| `contact_form.html` | The application form on your website |
| `ra-application-script.js` | Google Apps Script code (paste into script.google.com) |
| `RA-APPLICATION-SETUP-GUIDE.md` | This guide |

---

## Cost Estimates

- **Basin:** Free tier includes file uploads
- **OpenAI API:** ~$0.01-0.05 per application (using gpt-4o-mini)
- **Google Apps Script:** Free

---

## Security Notes

- The OpenAI API key is stored in Google's secure Script Properties, not in any file
- Basin handles file uploads securely
- The script only sends emails to your configured address
- All form data is sanitized before display (HTML escaped)
