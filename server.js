require('dotenv').config();

const tagLabel = 'APPEntryPoint';

const express = require('express');
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
            autoResize: true,
            nodes: {
                shape: "dot",
                mass: 17,
                font: {
                    color: '#ffffff',
                    size: 20, // px
                    face: 'Montserrat'
                }
            },
            layout: {
                randomSeed: 123,
                hierarchical: {
                    enabled: false,
                    direction: "LR",
                    levelSeparation: 300,
                },
            },
            physics: {
                enabled: true,
                forceAtlas2Based: {
                    theta: 0.1,
                    gravitationalConstant: -20,
                    centralGravity: 0.01,
                    springConstant: 0.08,
                    springLength: 100,
                    damping: 20,
                    avoidOverlap: 0
                },
                solver: 'forceAtlas2Based'
            },
            edges: {
                width: 3,
                selectionWidth: 10,
                smooth: {
                    type: "continuous",
                },
                font: {
                    color: '#aaa',
                    strokeWidth: 0,
                    size: 15, // px
                    face: 'Montserrat',
                    //align: 'center'
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

app.listen(process.env.APP_PORT || 8080, () => {
    utilities.logger.info("APP Server ready!", {tagLabel, port: process.env.APP_PORT || 8080 });
});