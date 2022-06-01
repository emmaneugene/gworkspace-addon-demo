/**
 * Version 1: Displays "Hello world" as text
 * For documentation, visit https://developers.google.com/workspace/add-ons/reference/rpc/google.apps.card.v1
 */

const express = require('express');
const asyncHandler = require('express-async-handler');

// Create and configure the app
const app = express();

// Trust GCPs front end to for hostname/port forwarding
app.set("trust proxy", true);
app.use(express.json());

const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};

// Initial route for the add-on
app.post("/", asyncHandler(async (req, res) => {
    // console.log(req);
    const card = {
        sections: [{
            widgets: [
                {
                    textParagraph: {
                        text: `Hello world!`
                    }
                },
                {
                    textParagraph: {
                        text: JSON.stringify(req, getCircularReplacer())
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