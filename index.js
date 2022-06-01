const express = require('express');
const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');
const { Datastore } = require('@google-cloud/datastore');

const datastore = new Datastore();
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

async function listTasks(userId) {
    const parentKey = datastore.key(['User', userId]);
    const query = datastore.createQuery('Task')
        .hasAncestor(parentKey)
        .order('created')
        .limit(20);
    const [tasks] = await datastore.runQuery(query);
    return tasks;
}

async function addTask(userId, task) {
    const key = datastore.key(['User', userId, 'Task']);
    const entity = {
        key,
        data: task
    };
    
    await datastore.save(entity);
    return entity;
}

async function deleteTasks(userId, taskIds) {
    const keys = taskIds.map(id => datastore.key(['User', userId, 'Task', datastore.int(id)]));
    await datastore.delete(keys);
}

function buildCard(req, tasks) {
    const baseUrl = `${req.protocol}`
}

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});

