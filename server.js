const express = require('express');
const memphis = require("memphis-dev");
const quotes = require('./data.json');
require('dotenv').config()
var bodyParser = require('body-parser');
var cors = require('cors');
const PORT = 3000;


let producer, consumer, myData = [];

(async function () {
    try {
        await memphis.connect({
            host: "broker.sandbox.memphis.dev",
            username: process.env.MEMPHIS_USERNAME,
            connectionToken: process.env.MEMPHIS_CT
        });
        producer = await memphis.producer({
            stationName: "demo-app",
            producerName: "producer",
            genUniqueSuffix: true
        });
        consumer = await memphis.consumer({
            stationName: "demo-app",
            consumerName: "consumer",
            genUniqueSuffix: true
        });
        consumer.on("message", message => {
            const headers = message.getHeaders();
            if (headers["source"][0] !== "memphis-internal-msg")
                myData.push(message.getData().toString());
            message.ack();
        });
        consumer.on("error", (error) => {
            console.log(error);
            process.exit(5);
        });

        producer_background = await memphis.producer({
            stationName: "demo-app",
            producerName: "always_on_producer"
        });
        consumer_background = await memphis.consumer({
            stationName: "demo-app",
            consumerName: "always_on_consumer",
        });

        consumer_background.on("message", message => {
            message.ack();
        });
        consumer_background.on("error", (error) => {
            console.log(error);
        });

        setInterval(async () => {
            const msg = quotes[Math.floor(Math.random() * quotes.length)].text;
            const headers = memphis.headers();
            headers.add("source", "memphis-internal-msg")
            await producer_background.produce({
                message: Buffer.from(msg),
                headers
            });
        }, 15000);

        const app = express();
        app.use(cors());

        app.use(express.static('public'));
        app.use(bodyParser.json())
        app.use(bodyParser.urlencoded({
            extended: true
        }));

        app.get('/', (req, res) => {
            res.send('Hello World!');
        });

        app.all('/server', (req, res) => {
            console.log(req.body);
            res.send('Hello World!');
        });

        app.post('/produce', async function (req, res, next) {
            var msg = req.body.msg;
            await producer.produce({
                message: Buffer.from(msg)
            });
            res.sendStatus(200);
        });

        app.get('/consume', async function (req, res, next) {
            if (myData !== [])
                res.json(myData).status(200);
            else res.sendStatus(202)
            myData = [];
        });

        app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
    } catch (ex) {
        console.log(ex);
        memphis.close();
    }
})();
