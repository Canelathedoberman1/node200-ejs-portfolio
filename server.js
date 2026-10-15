```javascript
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Google Sheets spreadsheet ID
const SPREADSHEET_ID =
  '1pCsJVyYTPsDixlsLaM6hqP8y_E98acRDKTd2afr8nXY';

// Find credentials locally or on Render
const renderCredentials = '/etc/secrets/credentials.json';
const localCredentials = path.join(__dirname, 'credentials.json');

const credentialsPath = fs.existsSync(renderCredentials)
  ? renderCredentials
  : localCredentials;

let sheets = null;

// Set up Google Sheets
if (fs.existsSync(credentialsPath)) {
  try {
    const credentials = JSON.parse(
      fs.readFileSync(credentialsPath, 'utf8')
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    sheets = google.sheets({
      version: 'v4',
      auth,
    });

    console.log('Google Sheets configured successfully.');
  } catch (error) {
    console.error(
      'Google Sheets configuration error:',
      error.message
    );
  }
} else {
  console.warn(
    'Google credentials not