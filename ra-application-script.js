/**
 * RA Application Processing Script
 *
 * This Google Apps Script processes research assistant applications
 * submitted through a Google Form, generates an AI summary using
 * OpenAI GPT-4, and sends the report via email.
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Form > Responses > Link to Sheets
 * 2. In the linked Google Sheet, go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Update the CONFIG section below with your settings
 * 5. Click "Save" (Ctrl+S or Cmd+S)
 * 6. Run the "setupTrigger" function once to enable automatic processing
 * 7. Authorize the script when prompted
 */

// ============ CONFIGURATION ============
const CONFIG = {
  // Your email address to receive applications
  recipientEmail: 'giulia.caprini@sciencespo.fr',

  // Your OpenAI API key (get from https://platform.openai.com/api-keys)
  openaiApiKey: 'YOUR_OPENAI_API_KEY_HERE',

  // Email subject tag
  emailTag: '[RA_Request_web]',

  // Your research projects
  projects: [
    'Book: Economics of Digital Platforms and Social Media (course materials compilation)',
    'Social Norms of Social Media (evolution of social norms on social media)',
    'Strategic Storytelling [FULL - no spots available]',
    'Social Norms Around Organ Donation (Italian language required)'
  ]
};

// ============ MAIN FUNCTIONS ============

/**
 * Run this function ONCE to set up the automatic trigger
 */
function setupTrigger() {
  // Remove existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger for form submissions
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(sheet)
    .onFormSubmit()
    .create();

  Logger.log('Trigger set up successfully! New form submissions will be processed automatically.');
}

/**
 * Main function that runs when a form is submitted
 */
function onFormSubmit(e) {
  try {
    const responses = e.namedValues;

    // Extract applicant info
    const applicantName = getFirstValue(responses, ['Full Name', 'Name', 'Your Name']) || 'Unknown';
    const applicantEmail = getFirstValue(responses, ['Email', 'Email Address', 'Your Email']) || 'Not provided';

    // Format all responses for display
    const formattedResponses = formatResponses(responses);

    // Generate AI summary
    const aiSummary = generateAISummary(responses);

    // Compose and send email
    const subject = `${CONFIG.emailTag} Application from ${applicantName}`;
    const emailBody = composeEmailBody(applicantName, applicantEmail, aiSummary, formattedResponses);

    GmailApp.sendEmail(CONFIG.recipientEmail, subject, '', {
      htmlBody: emailBody,
      name: 'RA Application System'
    });

    Logger.log(`Successfully processed application from ${applicantName}`);

  } catch (error) {
    // Send error notification
    GmailApp.sendEmail(
      CONFIG.recipientEmail,
      `${CONFIG.emailTag} ERROR Processing Application`,
      `An error occurred while processing a new RA application:\n\n${error.message}\n\nPlease check the Google Sheet directly for the submission.`
    );
    Logger.log(`Error: ${error.message}`);
  }
}

// ============ AI SUMMARY GENERATION ============

/**
 * Calls OpenAI API to generate a summary of the application
 */
function generateAISummary(responses) {
  if (CONFIG.openaiApiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    return '<p><em>AI summary not available - OpenAI API key not configured.</em></p>';
  }

  const prompt = buildPrompt(responses);

  const payload = {
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are reviewing a research assistant application for an economics professor.
Generate a concise, professional summary that helps the professor quickly assess the candidate.
Format your response in HTML with clear sections.`
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
      'Authorization': `Bearer ${CONFIG.openaiApiKey}`
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
function buildPrompt(responses) {
  let prompt = `Please analyze this research assistant application and provide:

1. **Candidate Profile** (2-3 sentences summarizing who they are)
2. **Project Fit** (how well their interests align with available projects)
3. **Key Skills** (notable strengths and any gaps)
4. **Motivation Assessment** (what drives them, what they want to gain)
5. **Overall Recommendation** (Strong Fit / Moderate Fit / Weak Fit with brief justification)

Available research projects: ${CONFIG.projects.join(', ')}

---
APPLICATION DATA:
`;

  for (const [question, answers] of Object.entries(responses)) {
    const answer = Array.isArray(answers) ? answers.join(', ') : answers;
    if (answer && answer.trim()) {
      prompt += `\n**${question}:** ${answer}`;
    }
  }

  return prompt;
}

// ============ EMAIL COMPOSITION ============

/**
 * Composes the HTML email body
 */
function composeEmailBody(name, email, aiSummary, formattedResponses) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0; opacity: 0.9; }
    .section { padding: 20px; border: 1px solid #ddd; margin-top: -1px; }
    .section h2 { color: #2563eb; margin-top: 0; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
    .ai-summary { background: #f8f9fa; }
    .raw-data { background: #fff; }
    .response-item { margin-bottom: 16px; }
    .response-question { font-weight: bold; color: #555; margin-bottom: 4px; }
    .response-answer { padding-left: 12px; border-left: 3px solid #2563eb; }
    .footer { padding: 15px 20px; background: #f0f0f0; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>New RA Application</h1>
    <p><strong>${name}</strong> (${email})</p>
  </div>

  <div class="section ai-summary">
    <h2>AI-Generated Summary</h2>
    ${aiSummary}
  </div>

  <div class="section raw-data">
    <h2>Full Application Responses</h2>
    ${formattedResponses}
  </div>

  <div class="footer">
    <p>This application was submitted via your website's RA application form.</p>
    <p>Timestamp: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
`;
}

/**
 * Formats all form responses for display
 */
function formatResponses(responses) {
  let html = '';

  for (const [question, answers] of Object.entries(responses)) {
    const answer = Array.isArray(answers) ? answers.join(', ') : answers;
    if (answer && answer.trim() && question !== 'Timestamp') {
      html += `
        <div class="response-item">
          <div class="response-question">${escapeHtml(question)}</div>
          <div class="response-answer">${escapeHtml(answer)}</div>
        </div>
      `;
    }
  }

  return html;
}

// ============ UTILITY FUNCTIONS ============

/**
 * Gets the first non-empty value from multiple possible field names
 */
function getFirstValue(responses, possibleNames) {
  for (const name of possibleNames) {
    const value = responses[name];
    if (value && value.length > 0 && value[0].trim()) {
      return value[0].trim();
    }
  }
  return null;
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

/**
 * Test function - manually process the most recent submission
 */
function testWithLatestSubmission() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log('No submissions found');
    return;
  }

  const values = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

  const namedValues = {};
  headers.forEach((header, i) => {
    namedValues[header] = [values[i]];
  });

  onFormSubmit({ namedValues: namedValues });
  Logger.log('Test completed - check your email!');
}
