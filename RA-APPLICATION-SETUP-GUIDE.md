# Research Assistant Application System - Setup Guide

This guide will help you set up the complete RA application system with Google Forms, AI-powered summaries, and automatic email notifications.

---

## Step 1: Create the Google Form

1. Go to [Google Forms](https://forms.google.com)
2. Click **+ Blank** to create a new form
3. Name it: **"Research Assistant Application - Giulia Caprini"**

### Page 1: About You
Add these questions:

| Question | Type | Required |
|----------|------|----------|
| Full Name | Short answer | Yes |
| Email | Short answer | Yes |
| Current Institution | Short answer | Yes |
| Current Program/Year (e.g., "M1 Economics, Sciences Po") | Short answer | Yes |
| Brief Bio (Tell me about yourself in 2-3 sentences) | Paragraph | No |

Click the **"Add section"** button (two rectangles icon) to create a new page.

### Page 2: Research Interest
Add these questions:

| Question | Type | Required |
|----------|------|----------|
| Which project(s) interest you most? | Checkboxes | Yes |

Options for the checkboxes:
- Book: Economics of Digital Platforms and Social Media (course materials compilation)
- Social Norms of Social Media (evolution of social norms on social media)
- Strategic Storytelling [FULL - no spots available]
- Social Norms Around Organ Donation (Italian language required)
- Other

**Note:** For "Strategic Storytelling [FULL]", Google Forms doesn't support greying out options. Consider adding a description below the question: *"Note: Strategic Storytelling is currently full and not accepting new RAs."*

| Question | Type | Required |
|----------|------|----------|
| If you selected "Other", please describe | Paragraph | No |
| Why does this project interest you? What draws you to this area? | Paragraph | Yes |

Add new section for Page 3.

### Page 3: Your Goals
Add these questions:

| Question | Type | Required |
|----------|------|----------|
| What do you hope to gain from a research assistant experience? | Paragraph | Yes |
| What is your career goal? | Paragraph | Yes |
| How many hours per week can you commit? | Multiple choice | Yes |

Options: 5-10 hours, 10-15 hours, 15-20 hours, More than 20 hours

| Question | Type | Required |
|----------|------|----------|
| Preferred start date | Date | No |

Add new section for Page 4.

### Page 4: Background & CV
Add these questions:

| Question | Type | Required |
|----------|------|----------|
| Education History (list your degrees, institutions, and years) | Paragraph | Yes |
| Upload your CV/Resume (PDF preferred) | File upload | Yes |
| Link to relevant work (GitHub, portfolio, papers) - if applicable | Short answer | No |

Add new section for Page 5.

### Page 5: Skills Assessment

Add this introduction text:
> Please indicate your current skills and what you'd like to develop. This helps me understand how we can work together effectively.

**Quantitative Skills - Current:**

| Question | Type |
|----------|------|
| Which quantitative skills do you currently have? | Checkboxes |

Options:
- Stata
- R
- Python
- MATLAB
- Econometrics
- Machine Learning
- Natural Language Processing (NLP)
- Computer Vision
- Causal Inference
- Survey Design
- Data Visualization

**Quantitative Skills - Want to Develop:**

| Question | Type |
|----------|------|
| Which quantitative skills would you like to develop? | Checkboxes |

(Same options as above)

**Research Skills - Current:**

| Question | Type |
|----------|------|
| Which research skills do you currently have? | Checkboxes |

Options:
- Literature Review
- Academic Writing
- Data Collection
- Experiment Design
- Interviewing
- Content Analysis
- Web Scraping
- LaTeX
- Research Presentation
- Project Management

**Research Skills - Want to Develop:**

| Question | Type |
|----------|------|
| Which research skills would you like to develop? | Checkboxes |

(Same options as above)

---

## Step 2: Link Form to Google Sheets

1. In your Google Form, click the **"Responses"** tab
2. Click the green **Sheets icon** (or "Link to Sheets")
3. Select **"Create a new spreadsheet"**
4. Name it: **"RA Applications"**
5. Click **Create**

---

## Step 3: Add the Processing Script

1. Open the newly created Google Sheet
2. Go to **Extensions → Apps Script**
3. Delete any existing code in the editor
4. Copy the entire contents of `ra-application-script.js` (in your website folder)
5. Paste it into the Apps Script editor
6. **IMPORTANT:** Update the CONFIG section at the top:
   - Replace `YOUR_OPENAI_API_KEY_HERE` with your actual OpenAI API key
   - Update the `projects` array if needed

7. Click **Save** (Ctrl+S or Cmd+S)
8. Name the project: **"RA Application Processor"**

---

## Step 4: Set Up the Trigger

1. In the Apps Script editor, select the function **`setupTrigger`** from the dropdown
2. Click **Run**
3. You'll be prompted to authorize the script:
   - Click "Review Permissions"
   - Select your Google account
   - Click "Advanced" → "Go to RA Application Processor (unsafe)"
   - Click "Allow"

The trigger is now active! New submissions will be processed automatically.

---

## Step 5: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign in or create an account
3. Go to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key (you won't see it again!)
6. Paste it in the Apps Script CONFIG section

**Note:** OpenAI API calls cost money (roughly $0.01-0.05 per application). Make sure you have billing set up.

---

## Step 6: Get the Form URL

1. In your Google Form, click **"Send"** (top right)
2. Click the **link icon** (chain)
3. Check **"Shorten URL"** if desired
4. Click **"Copy"**

---

## Step 7: Update Your Website

Replace `YOUR_GOOGLE_FORM_URL_HERE` in `contact_form.html` with your actual Google Form URL:

```html
<a href="https://forms.gle/YOUR-FORM-ID" target="_blank" class="theme-btn" ...>
```

---

## Step 8: Test the System

1. Fill out the form with test data
2. Submit the form
3. Check your email for the application report
4. Verify the AI summary is generated (if API key is configured)

---

## Troubleshooting

### "AI summary not available"
- Check that your OpenAI API key is correct
- Ensure you have billing set up on OpenAI
- Check the Apps Script execution logs for errors

### Not receiving emails
- Check your spam folder
- Verify the recipient email in CONFIG
- Check Apps Script execution logs: View → Executions

### Form not linking to sheet
- Make sure you created the sheet link before adding the script
- The trigger needs the linked sheet to work

---

## Updating Projects

To change the project list:
1. Update the checkboxes in the Google Form
2. Update the `projects` array in the Apps Script CONFIG

---

## File Locations

- Website page: `giuliacaprini.com/contact_form.html`
- Apps Script code: `ra-application-script.js`
- This guide: `RA-APPLICATION-SETUP-GUIDE.md`
