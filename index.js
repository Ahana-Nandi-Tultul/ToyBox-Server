const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('ToyBox is opening');
})

app.listen(port, () => {
    console.log('Toy Box is running on the port:', port);
})