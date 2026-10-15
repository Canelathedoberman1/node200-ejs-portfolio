
const express = require('express');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Read form data
app.use(express.urlencoded({ extended: true }));

// Google Sheets configuration
const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID ||
  '1pCsJVyYTPsDixlsLaM6hqP8y_E98acRDKTd2afr8nXY';

const renderCredentials = '/etc/secrets/credentials.json';
const localCredentials = path.join(__dirname, 'credentials.json');

const credentialsPath = fs.existsSync(renderCredentials)
  ? renderCredentials
  : localCredentials;

// Home page
app.get('/', (req, res) => {
  res.render('index');
});

// Contact page
app.get('/contact', (req, res) => {
  res.render('contact');
});

// Handle contact form submissions
app.post('/thanks', async (req, res) => {
  const firstName = (req.body.firstName || '').trim();
  const lastName = (req.body.lastName || '').trim();
  const email = (req.body.email || '').trim();
  const message = (req.body.message || '').trim();

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).send('Please fill out all contact form fields.');
  }

  try {
    if (!fs.existsSync(credentialsPath)) {
      throw new Error('Google credentials file was not found.');
    }

    const credentials = JSON.parse(
      fs.readFileSync(credentialsPath, 'utf8')
    );

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    });

    const sheets = google.sheets({
      version: 'v4',
      auth: auth
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Contacts!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            firstName + ' ' + lastName,
            email,
            message,
            new Date().toISOString()
          ]
        ]
      }
    });

    return res.render('thanks', {
      firstName: firstName,
      lastName: lastName
    });
  } catch (error) {
    console.error('Google Sheets error:', error.message);

    return res.status(500).send(
      'Sorry, your message could not be submitted. Please try again later.'
    );
  }
});

// Start the server
app.listen(PORT, () => {
  console.log('Portfolio running on port ' + PORT);
});
