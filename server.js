const express = require('express')
const bodyParser = require('body-parser')
const redis = require('redis')
const bluebird = require('bluebird')

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

const app = express()
const db = redis.createClient()

app.set('port', process.env.PORT || 1337)

app.use(express.static(__dirname + '/public'))

app.set('views', __dirname + '/public')
app.set('view engine', 'ejs')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


app.get('/', (req, res) => {
    res.render('form')
})

app.get('/done', (req, res) => {
    res.render('done')
})

app.get('/addresses', (req, res) => {
    let namelist = []
    let addrmap = new Map()

    db.keysAsync('*').then(names => {
        names.forEach(name => namelist.push(name))
    }).then(() => {
        let promises = []

        namelist.forEach(name => {
            promises.push(db.getAsync(name).then(addr => addrmap.set(name, addr)))
        })
        return Promise.all(promises)
    }).then(() => {
        //addrmap.forEach((addr, name) => console.log(name, addr))
        res.render('list', { addrmap: addrmap }, (err, html) => {
            res.send(html)
        })
    })
})

app.post('/form', (req, res) => {
    db.set(req.body.name, req.body.address);
    res.redirect('/done')
})

app.listen(app.get('port'), () => {
    console.log('Node running on port', app.get('port'))
})
