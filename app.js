const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true });
let db;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
    if (!db) {
        client.connect(function (err) {
            db = client.db('test');
            req.db = db.collection('test');
            next();
        });
    } else {
        req.db = db.collection('test');
        next();
    }
})


// Get all data
app.get('/', (req, res) => {
    req.db.find({}).toArray((err, data) => res.json(data))
})
// delete all data
app.delete('/clear', async (req, res) => {
    await req.db.removeMany({})
    req.db.find({}).toArray((err, data) => res.json(data))

})
// fill with dummy data
app.post('/fill', async (req, res) => {
    await req.db.insertOne(req.body, (err, results) => res.json(results))
});

app.get('/getlast', async (req, res) => {
    // req.db.aggregate([
    //     {
    //         $project:
    //         {
    //             name: 1,
    //             first: { $arrayElemAt: ["$items", 0] },
    //             last: { $arrayElemAt: ["$items", -1] }
    //         }
    //     }
    // ]).toArray((err, data) => res.json(data))

    // The $slice operator controls the number of items of an array that a query returns.
    const results = await req.db.findOne({},
        { projection: { _id: 0, items: { '$slice': -1 } } })
    res.json(results)
})


app.get('/updatelast', async (req, res) => {
    // get value from the last record
    const lastRecord = await req.db.findOne({},
        { projection: { _id: 0, items: { '$slice': -1 } } });
    // update that record
    const results = await req.db.updateOne({ _id: 1, 'items.name': lastRecord.items[0].name },
        { $set: { 'items.$.name': 'Hahaha' } })

    req.db.find({}).toArray((err, data) => res.json(data))
})

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
app.listen(3000, () => console.log('listening to 3000'));