```javascript
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Google Sheets configuration
const SPREADSHEET_ID =
  '1pCsJVyYTPsDixlsLaM6hqP8y_E98acRDKTd2afr8nXY';

// Find Google credentials locally or on Render
const renderCredentials = '/etc/secrets/credentials.json';
const localCredentials = path.join(__dirname, 'credentials.json');

const credentialsPath = fs.existsSync(renderCredentials)
  ? renderCredentials
  : localCredentials;

let sheets = null;

if (fs.existsSync(credentialsPath)) {
  try {
    const credentials = JSON.parse(
      fs.readFileSync(credentialsPath, 'utf8')
    );

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    sheets = google.sheets({
      version: 'v4',
      auth: auth,
    });

    console.log('Google Sheets configured successfully.');
  } catch (error) {
    console.error(
      'Google Sheets configuration error:',
      error.message
    );
  }
} else {
  console.warn('Google credentials not found.');
}

// Middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Home page
app.get('/', (req, res) => {
  res.render('index');
});

// Contact page
app.get('/contact', (req, res) => {
  res.render('contact');
});

// Contact form submission
app.post('/thanks', async (req, res) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const message = req.body.message;

  if (!firstName || !lastName || !email) {
    return res.status(400).send(
      'Please provide your first name, last name, and email.'
    );
  }

  if (!sheets) {
    return res.status(503).send(
      'The contact form is temporarily unavailable.'
    );
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Contacts!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toISOString(),
          firstName + ' ' + lastName,
          email,
          message || '',
        ]],
      },
    });

    console.log('Contact submission saved.');

    return res.render('thanks', {
      firstName: firstName,
      lastName: lastName,
      name: firstName + ' ' + lastName,
    });
  } catch (error) {
    console.error(
      'Google Sheets error:',
      error.message
    );

    return res.status(500).send(
      'Your message could not be saved. Please try again later.'
    );
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found.');
});

// Start server
app.listen(PORT, () => {
  console.log('Portfolio running on port ' + PORT);
});
```