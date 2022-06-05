require('dotenv').config();

const tagLabel = 'APPEntryPoint';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const glob = require('glob');
const path = require("path");


const app = express();



app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'html');
app.engine('html',require('ejs').renderFile);

app.use(express.static('public'));

global.app = app;
global.utilities = require('@growishpay/service-utilities');


app.get('/visualizer/:dataNFT', (req, res) => {

    res.render('visualizer', {
        dataNFT: req.params.dataNFT,
        title: "Foo",
        options: Buffer.from(JSON.stringify({
            edges: {
                font: {
                    size: 15
                }
            }
        })).toString('base64'),
        source: {
            name: "Test",
            url: "https://google.com"
        }
    });

});

app.get('/json-test/foo.json', (req, res)=>{
    res.json(require('./json-example-data.json'));
});

app.listen(process.env.APP_PORT, () => {
    utilities.logger.info("APP Server ready!", {tagLabel, port: process.env.APP_PORT});
});