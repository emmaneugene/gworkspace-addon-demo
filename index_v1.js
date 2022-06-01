/**
 * Version 1: Displays "Hello world" as a text paragraph to the user
 */

const express = require('express');
const asyncHandler = require('express-async-handler');

// Create and configure the app
const app = express();

// Trust GCPs front end to for hostname/port forwarding
app.set("trust proxy", true);
app.use(express.json());

// Initial route for the add-on
app.post("/", asyncHandler(async (req, res) => {
    const card = {
        sections: [{
            widgets: [
                {
                    textParagraph: {
                        text: `Hello world!`
                    }
                },
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

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});