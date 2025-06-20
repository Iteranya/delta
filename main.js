const express = require('express');
const bodyParser = require('body-parser');
const clientManagerRoutes = require('./routes/client_manager_route');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/api', clientManagerRoutes);

app.listen(port, () => {
    console.log(`WhatsApp Manager API running at http://localhost:${port}/api`);
});

