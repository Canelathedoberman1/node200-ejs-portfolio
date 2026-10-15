
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const { google } = require('googleapis');
const credentials = require('./credentials.json');

const app = express();
const PORT = process.env.PORT || 3000;

const SPREADSHEET_ID =
  '1pCsJVyYTPsDixlsLaM6hqP8y_E98acRDKTd2afr8nXY';

// Connect to Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({
  version: 'v4',
  auth
});

// Configure EJS templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Home page
app.get('/', (req, res) => {
  res.render('index');
});

// Contact page
app.get('/contact', (req, res) => {
  res.render('contact');
});

// Process contact form and save to Google Sheets
app.post('/thanks', async (req, res) => {
  const contact = {
    firstName: (req.body.firstName || '').trim(),
    lastName: (req.body.lastName || '').trim(),
    email: (req.body.email || '').trim()
  };

  if (!contact.firstName || !contact.lastName || !contact.email) {
    return res.status(400).send('Please complete all contact fields.');
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Contacts!A:D',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          contact.firstName,
          contact.lastName,
          contact.email,
          new Date().toISOString()
        ]]
      }
    });

    res.render('thanks', { contact });
  } catch (error) {
    console.error('Google Sheets error:', error.message);
    res.status(500).send(
      'Sorry, we could not save your message. Please try again later.'
    );
  }
});

// 404 page
app.use((req, res) => {
  res.status(404).send('Page not found.');
});

app.listen(PORT, () => {
  console.log(`Portfolio running on port ${PORT}`);
});
