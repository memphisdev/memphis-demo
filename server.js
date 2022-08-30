const express = require('express');
const memphis = require("memphis-dev");
require('dotenv').config()
var bodyParser = require('body-parser');
var cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());

app.use(express.static('public'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));

let producer, consumer, myData = [];

(async function () {
    try {
        await memphis.connect({
            host: "broker.sandbox.memphis.dev",
            username: process.env.MEMPHIS_USERNAME,
            connectionToken: process.env.MEMPHIS_CT
        });
        producer = await memphis.producer({
            stationName: "glitch",
            producerName: "myProducer1"
        });
        consumer = await memphis.consumer({
            stationName: "glitch",
            consumerName: "myConsumer1",
            consumerGroup: ""
        });
        consumer.on("message", message => {
            myData.push(message.getData().toString());
            message.ack();
        });
    } catch (ex) {
        console.log(ex);
        memphis.close();
    }
})();

app.get('/', (req, res) => {
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
    if(myData!==[])
        res.json(myData).status(200);
    else res.sendStatus(202)
    myData = [];
});

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));