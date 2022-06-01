/**
 * Version 3: Implements CRUD operations on tasks using cloud datastore 
 */

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
app.post('/', asyncHandler(async (req, res) => {
    const event = req.body;
    const user = await userInfo(event);
    const tasks = await listTasks(user.sub);
    const card = buildCard(req, tasks);
    const responsePayload = {
        action: {
            navigations: [{
                pushCard: card
            }]
        }
    };
    res.json(responsePayload);
}));

app.post('/newTask', asyncHandler(async (req, res) => {
    const event = req.body;
    const user = await userInfo(event);

    const formInputs = event.commonEventObject.formInputs || {};
    const newTask = formInputs.newTask;
    if (!newTask || !newTask.stringInputs) {
        return {};
    }

    const task = {
        text: newTask.stringInputs.value[0],
        created: new Date()
    };
    await addTask(user.sub, task);

    const tasks = await listTasks(user.sub);
    const card = buildCard(req, tasks);
    const responsePayload = {
        renderActions: {
            action: {
                navigations: [{
                    updateCard: card
                }],
                notification: {
                    text: 'Task added.'
                },
            }
        }
    };
    res.json(responsePayload);
}));

app.post('/complete', asyncHandler(async (req, res) => {
    const event = req.body;
    const user = await userInfo(event);

    const formInputs = event.commonEventObject.formInputs || {};
    const completedTasks = formInputs.completedTasks;
    if (!completedTasks || !completedTasks.stringInputs) {
        return {};
    }

    await deleteTasks(user.sub, completedTasks.stringInputs.value);

    const tasks = await listTasks(user.sub);
    const card = buildCard(req, tasks);
    const responsePayload = {
        renderActions: {
            action: {
                navigations: [{
                    updateCard: card
                }],
                notification: {
                    text: 'Task completed.'
                },
            }
        }
    };
    res.json(responsePayload);
}));

function buildCard(req, tasks) {
    const baseUrl = `${req.protocol}://${req.hostname}${req.baseUrl}`;
    // Input for adding a new task
    const inputSection = {
        widgets: [
            {
                textInput: {
                    label: 'Task to add',
                    name: 'newTask',
                    value: '',
                    onChangeAction: {
                        function: `${baseUrl}/newTask`,
                    },
                }
            }
        ]
    };
    const taskListSection = {
        header: 'Your tasks',
        widgets: []
    };
    if (tasks && tasks.length) {
        // Create text & checkbox for each task
        tasks.forEach(task => taskListSection.widgets.push({
            decoratedText: {
                text: task.text,
                wrapText: true,
                switchControl: {
                    controlType: 'CHECKBOX',
                    name: 'completedTasks',
                    value: task[datastore.KEY].id,
                    selected: false,
                    onChangeAction: {
                        function: `${baseUrl}/complete`,
                    }
                }
            }
        }));
    } else {
        // Placeholder for empty task list
        taskListSection.widgets.push({
            textParagraph: {
                text: 'Your task list is empty.'
            }
        });
    }
    const card = {
        sections: [
            inputSection,
            taskListSection,
        ]
    }
    return card;
}

async function userInfo(event) {
    const idToken = event.authorizationEventObject.userIdToken;
    const authClient = new OAuth2Client();
    const ticket = await authClient.verifyIdToken({
        idToken
    });
    return ticket.getPayload();
}

async function listTasks(userId) {
    const parentKey = datastore.key(['User', userId]);
    const query = datastore.createQuery('Task')
        .hasAncestor(parentKey)
        .order('created')
        .limit(20);
    const [tasks] = await datastore.runQuery(query);
    return tasks;;
}

async function addTask(userId, task) {
    const key = datastore.key(['User', userId, 'Task']);
    const entity = {
        key,
        data: task,
    };
    await datastore.save(entity);
    return entity;
}

async function deleteTasks(userId, taskIds) {
    const keys = taskIds.map(id => datastore.key(['User', userId,
                                                  'Task', datastore.int(id)]));
    await datastore.delete(keys);
}

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
