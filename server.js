// require('dotenv').config();
// const express = require('express');
// const axios = require('axios');

// const app = express();
// app.use(express.json());

// let accessToken = null;
// let tokenExpiryTime = null;

// const isTokenValid = () => {
//   if (!accessToken || !tokenExpiryTime) return false;
//   return Date.now() < tokenExpiryTime;
// };

// const refreshAccessToken = async () => {
//   console.log("Refreshing access token...");
//   const url = `https://accounts.zoho.in/oauth/v2/token`;
//   const params = {
//     client_id: process.env.CLIENT_ID,
//     client_secret: process.env.CLIENT_SECRET,
//     refresh_token: process.env.REFRESH_TOKEN,
//     grant_type: "refresh_token"
//   };

//   try {
//     const response = await axios.post(url, null, { params });
//     accessToken = response.data.access_token;
//     tokenExpiryTime = Date.now() + 55 * 60 * 1000; // 55 minutes
//     console.log("New access token generated:", accessToken);
//   } catch (error) {
//     console.error("Failed to refresh token:", error.response?.data || error.message);
//   }
// };

// const sendSurvey = async (contactsList) => {
//   if (!isTokenValid()) {
//     await refreshAccessToken();
//   }

//   try {
//     const response = await axios.post(
//       process.env.SURVEY_URL,
//       { contactsList },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );
//     console.log("Survey sent successfully:", response.data);
//     return response.data;
//   } catch (error) {
//     console.error("Failed to send survey:", error.response?.data || error.message);
//   }
// };

// app.post('/webhook', async (req, res) => {
//   const { contactsList } = req.body;
//   if (!contactsList || !Array.isArray(contactsList)) {
//     return res.status(400).json({ message: 'Invalid payload' });
//   }

//   await sendSurvey(contactsList);
//   res.status(200).json({ message: 'Survey trigger received' });
// });

// app.listen(process.env.PORT, () => {
//   console.log(`Server running on port ${process.env.PORT}`);
// });








require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
app.use(express.json());

const TOKEN_PATH = './token.json';

let accessToken = null;
let tokenExpiryTime = null;

// Load token from file if available
const loadToken = () => {
  if (fs.existsSync(TOKEN_PATH)) {
    const data = JSON.parse(fs.readFileSync(TOKEN_PATH));
    accessToken = data.accessToken;
    tokenExpiryTime = data.tokenExpiryTime;
    console.log("Loaded token from file.");
    console.log("Access token:", accessToken);
    console.log("Valid until:", new Date(tokenExpiryTime).toLocaleString());
  }
};

// Save token to file
const saveToken = () => {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify({ accessToken, tokenExpiryTime }));
  console.log("Saved token to file.");
};

const isTokenValid = () => {
  if (!accessToken || !tokenExpiryTime) return false;
  const isValid = Date.now() < tokenExpiryTime;
  console.log(`Is token valid? ${isValid ? 'Yes' : 'No'}`);
  return isValid;
};

const refreshAccessToken = async () => {
  console.log("Refreshing access token...");
  const url = `https://accounts.zoho.in/oauth/v2/token`;
  const params = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    refresh_token: process.env.REFRESH_TOKEN,
    grant_type: "refresh_token"
  };

  try {
    const response = await axios.post(url, null, { params });
    accessToken = response.data.access_token;
    tokenExpiryTime = Date.now() + 55 * 60 * 1000; // 55 minutes validity
    console.log("✅ New access token generated:", accessToken);
    console.log("⏳ Valid until:", new Date(tokenExpiryTime).toLocaleString());
    saveToken();
  } catch (error) {
    console.error("❌ Failed to refresh token:", error.response?.data || error.message);
  }
};

const sendSurvey = async (contactsList) => {
  if (!isTokenValid()) {
    await refreshAccessToken();
  }

  try {
    const response = await axios.post(
      process.env.SURVEY_URL,
      { contactsList },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log("✅ Survey sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to send survey:", error.response?.data || error.message);
  }
};

app.post('/webhook', async (req, res) => {
  const { contactsList } = req.body;
  if (!contactsList || !Array.isArray(contactsList)) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  await sendSurvey(contactsList);
  res.status(200).json({ message: 'Survey trigger received' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  loadToken(); // Load saved token on startup
  console.log(`🚀 Server running on port ${PORT}`);
});
