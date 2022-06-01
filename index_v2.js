const express = require('express');
const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');

// Create and configure the app
const app = express();

// Trust GCPs front end to for hostname/port forwarding
app.set("trust proxy", true);
app.use(express.json());

// Initial route for the add-on
app.post("/", asyncHandler(async (req, res) => {
    const event = req.body;
    const user = await userInfo(event);
    const card = {
        sections:[{
            widgets:[
                {
                    textParagraph: {
                        text: `Hello ${user.email} ${user.sub}`
                    }
                }
            ]
        }]
    };
    const renderAction = {
        action: {
            navigations: [{
                pushCard: card
            }]
        }
    };
    res.json(renderAction);
}));

async function userInfo(event) {
    const idToken = event.authorizationEventObject.userIdToken;
    const authClient = new OAuth2Client();
    const ticket = await authClient.verifyIdToken({
        idToken
    })
    return ticket.getPayload();
}

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});

