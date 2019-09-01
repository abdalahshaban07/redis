const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 5000
const REDIS_PORT = process.env.PORT || 6379

const client = redis.createClient(REDIS_PORT)


const app = express()


///set response 
function setResponse(username, repos) {
    return `<h2>${username} has ${repos} Github repos</h2>`
}

//make request to gitHub for data

async function getRepos(req, res, next) {
    try {
        console.log('Fetching Data ......');
        const { username } = req.params
        const response = await fetch(`https://api.github.com/users/${username}`)
        const data = await response.json()

        const repos = data.public_repos
        //set data to Redis
        client.setex(username, 3600, repos)
        // set more than one key in redis
        // client.MSET({ username, repos }, { username, repos })
        // //rename key
        // client.RENAME(username, newKey)

        // //set list in redis
        // client.LPUSH('list', { username: repos }, { username: repos })
        // client.RPUSH('list', { username: repos }, { username, repos })

        // //get data from list
        // client.LRANGE('list', 0, -1)

        // //remove from list from left
        // client.LPOP('list')
        // //remove from list from right
        // client.RPOP('list')

        // //add sets in redis
        // client.SADD('sets', { username: repos }, { username: repos })

        // //check in sets
        // client.SISMEMBER('sets', username) //return 1 if member and 0 if not

        // //get all members in sets
        // client.smembers('sets')

        res.send(setResponse(username, repos));

    } catch (err) {
        console.error(err);
        res.status(500);
    }
}

//Cache middleware 
function cache(req, res, next) {
    const { username } = req.params

    client.get(username, (err, data) => {
        if (err) throw err

        if (data !== null) {
            res.send(setResponse(username, data));
        } else {
            next()
        }
    })
}


app.get('/repos/:username', cache, getRepos);


app.listen(5000, () => {
    console.log(`Server started on port ${PORT}`);
});