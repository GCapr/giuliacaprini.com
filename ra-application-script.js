/**
 * RA Application Processing Script (Basin Webhook Version)
 *
 * This Google Apps Script receives webhooks from Basin,
 * generates an AI summary using OpenAI, and sends email reports.
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com and create a new project
 * 2. Paste this entire script
 * 3. Update the CONFIG section below with your settings
 * 4. Click "Deploy" > "New deployment"
 * 5. Select "Web app" as the type
 * 6. Set "Execute as" to "Me" and "Who has access" to "Anyone"
 * 7. Click "Deploy" and copy the Web app URL
 * 8. In Basin dashboard, go to your form > Integrations > Webhooks
 * 9. Add the Google Apps Script URL as a webhook endpoint
 * 10. Test with a form submission!
 */

// ============ CONFIGURATION ============
// NOTE: The OpenAI API key is stored securely in Script Properties.
// To set it: In Apps Script editor, go to Project Settings (gear icon) > Script Properties
// Add a property with name: OPENAI_API_KEY and value: your-api-key

const CONFIG = {
  // Your email address to receive applications
  recipientEmail: 'giulia.caprini@sciencespo.fr',

  // Email subject tag
  emailTag: '[RA Application]',

  // Your research projects (for AI context)
  projects: [
    'Book: Economics of Digital Platforms and Social Media',
    'Social Norms of Social Media',
    'Strategic Storytelling [FULL]',
    'Social Norms Around Organ Donation (Italian required)'
  ]
};

/**
 * Gets the OpenAI API key from Script Properties (secure storage)
 */
function getOpenAIKey() {
  const key = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  return key || null;
}

// ============ WEBHOOK HANDLER ============

/**
 * Handles POST requests from Basin webhook
 */
function doPost(e) {
  try {
    // Parse the incoming webhook data
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error('No data received');
    }

    // Basin sends form data in the webhook payload
    const formData = data;

    // Extract applicant info
    const applicantName = formData.name || 'Unknown';
    const applicantEmail = formData.email || 'Not provided';

    // Format all responses for display
    const formattedResponses = formatResponses(formData);

    // Generate AI summary
    const aiSummary = generateAISummary(formData);

    // Compose and send email
    const subject = `${CONFIG.emailTag} Application from ${applicantName}`;
    const emailBody = composeEmailBody(applicantName, applicantEmail, aiSummary, formattedResponses, formData);

    GmailApp.sendEmail(CONFIG.recipientEmail, subject, '', {
      htmlBody: emailBody,
      name: 'RA Application System'
    });

    // Return success response to Basin
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Email sent' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log error and send notification
    console.error('Error processing webhook:', error);

    try {
      GmailApp.sendEmail(
        CONFIG.recipientEmail,
        `${CONFIG.emailTag} ERROR Processing Application`,
        `An error occurred while processing a new RA application:\n\n${error.message}\n\nRaw data:\n${e.postData ? e.postData.contents : 'No data'}`
      );
    } catch (emailError) {
      console.error('Failed to send error email:', emailError);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests (for testing the deployment)
 */
function doGet(e) {
  return ContentService
    .createTextOutput('RA Application webhook is active. Send POST requests from Basin.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============ AI SUMMARY GENERATION ============

/**
 * Calls OpenAI API to generate a summary of the application
 */
function generateAISummary(formData) {
  const apiKey = getOpenAIKey();

  if (!apiKey) {
    return '<p><em>AI summary not available - OpenAI API key not configured in Script Properties.</em></p>';
  }

  const prompt = buildPrompt(formData);

  const payload = {
    model: 'gpt-4o-mini',  // Cost-effective model, change to 'gpt-4' for better quality
    messages: [
      {
        role: 'system',
        content: `You are reviewing a research assistant application for an economics professor.
Generate a concise, professional summary that helps the professor quickly assess the candidate.
Format your response in HTML with clear sections. Be direct and evaluative.`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 1000,
    temperature: 0.7
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
    const json = JSON.parse(response.getContentText());

    if (json.error) {
      return `<p><em>AI summary error: ${json.error.message}</em></p>`;
    }

    return json.choices[0].message.content;
  } catch (error) {
    return `<p><em>AI summary unavailable: ${error.message}</em></p>`;
  }
}

/**
 * Builds the prompt for the AI
 */
function buildPrompt(formData) {
  let prompt = `Please analyze this research assistant application and provide:

1. **Candidate Profile** (2-3 sentences summarizing who they are)
2. **Project Fit** (how well their interests align with available projects)
3. **Key Skills** (notable strengths and skill gaps to develop)
4. **Motivation Assessment** (what drives them, career alignment)
5. **Overall Recommendation** (Strong Fit / Moderate Fit / Weak Fit with brief justification)

Available research projects: ${CONFIG.projects.join(', ')}

---
APPLICATION DATA:
`;

  // Map form fields to readable format
  const fieldLabels = {
    name: 'Full Name',
    email: 'Email',
    institution: 'Institution',
    program: 'Program/Year',
    bio: 'Brief Bio',
    projects: 'Projects of Interest',
    other_project: 'Other Project Description',
    interest_reason: 'Why This Project Interests Them',
    ra_goals: 'Goals from RA Experience',
    career_goal: 'Career Goal',
    hours_per_week: 'Hours Per Week Available',
    start_date: 'Preferred Start Date',
    education: 'Education History',
    portfolio: 'Portfolio/GitHub Link',
    quant_current: 'Current Quantitative Skills',
    quant_develop: 'Quantitative Skills to Develop',
    research_current: 'Current Research Skills',
    research_develop: 'Research Skills to Develop'
  };

  for (const [key, value] of Object.entries(formData)) {
    if (value && String(value).trim() && key !== 'cv') {
      const label = fieldLabels[key] || key;
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      prompt += `\n**${label}:** ${displayValue}`;
    }
  }

  return prompt;
}

// ============ EMAIL COMPOSITION ============

/**
 * Composes the HTML email body
 */
function composeEmailBody(name, email, aiSummary, formattedResponses, formData) {
  // Check if there's a CV file link from Basin
  const cvLink = formData.cv ? `<p><strong>CV File:</strong> <a href="${formData.cv}">Download CV</a></p>` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 8px 0 0; opacity: 0.9; }
    .section { padding: 24px; border: 1px solid #e0e0e0; margin-top: -1px; }
    .section:last-of-type { border-radius: 0 0 12px 12px; }
    .section h2 { color: #1d4ed8; margin: 0 0 16px 0; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
    .ai-summary { background: #f0f7ff; }
    .ai-summary h3 { color: #1d4ed8; margin: 16px 0 8px 0; font-size: 14px; }
    .ai-summary p { margin: 8px 0; }
    .raw-data { background: #fafafa; }
    .response-item { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #eee; }
    .response-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .response-question { font-weight: 600; color: #555; margin-bottom: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .response-answer { color: #333; padding-left: 12px; border-left: 3px solid #2563eb; }
    .footer { padding: 16px 24px; background: #f5f5f5; border-radius: 0 0 12px 12px; font-size: 12px; color: #666; text-align: center; }
    .cv-link { background: #e8f4e8; padding: 12px; border-radius: 8px; margin-top: 16px; }
    .cv-link a { color: #1d4ed8; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <h1>New RA Application</h1>
    <p><strong>${escapeHtml(name)}</strong> &bull; ${escapeHtml(email)}</p>
  </div>

  <div class="section ai-summary">
    <h2>AI-Generated Summary</h2>
    ${aiSummary}
  </div>

  <div class="section raw-data">
    <h2>Full Application Responses</h2>
    ${formattedResponses}
    ${cvLink ? `<div class="cv-link">${cvLink}</div>` : ''}
  </div>

  <div class="footer">
    <p>Submitted via giuliacaprini.com &bull; ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Paris' })}</p>
  </div>
</body>
</html>
`;
}

/**
 * Formats all form responses for display
 */
function formatResponses(formData) {
  const fieldLabels = {
    name: 'Full Name',
    email: 'Email',
    institution: 'Current Institution',
    program: 'Program/Year',
    bio: 'Brief Bio',
    projects: 'Projects of Interest',
    other_project: 'Other Project (if selected)',
    interest_reason: 'Why This Project Interests You',
    ra_goals: 'What You Hope to Gain',
    career_goal: 'Career Goal',
    hours_per_week: 'Hours Per Week',
    start_date: 'Preferred Start Date',
    education: 'Education History',
    portfolio: 'Portfolio/Links',
    quant_current: 'Quantitative Skills (Current)',
    quant_develop: 'Quantitative Skills (Want to Learn)',
    research_current: 'Research Skills (Current)',
    research_develop: 'Research Skills (Want to Learn)'
  };

  // Define display order
  const fieldOrder = [
    'name', 'email', 'institution', 'program', 'bio',
    'projects', 'other_project', 'interest_reason',
    'ra_goals', 'career_goal', 'hours_per_week', 'start_date',
    'education', 'portfolio',
    'quant_current', 'quant_develop', 'research_current', 'research_develop'
  ];

  let html = '';

  for (const key of fieldOrder) {
    const value = formData[key];
    if (value && String(value).trim()) {
      const label = fieldLabels[key] || key;
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      html += `
        <div class="response-item">
          <div class="response-question">${escapeHtml(label)}</div>
          <div class="response-answer">${escapeHtml(String(displayValue))}</div>
        </div>
      `;
    }
  }

  return html;
}

// ============ UTILITY FUNCTIONS ============

/**
 * Escapes HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

/**
 * Test function - simulate a webhook payload
 */
function testWebhook() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        name: 'Test Applicant',
        email: 'test@example.com',
        institution: 'Test University',
        program: 'M1 Economics',
        bio: 'I am a test applicant.',
        projects: 'Social Norms of Social Media',
        interest_reason: 'I find this topic fascinating.',
        ra_goals: 'Gain research experience.',
        career_goal: 'Pursue a PhD in Economics.',
        hours_per_week: '10-15 hours',
        education: 'BA Economics, Test University, 2023',
        quant_current: 'Python, R, Stata',
        research_current: 'Literature Review, LaTeX'
      })
    }
  };

  doPost(testData);
  console.log('Test completed - check your email!');
}
