const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')
const app = require('./app')

dotenv.config({ path: './config.env' });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`App running on port ${port}`));

