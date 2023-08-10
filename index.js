import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import UAParser from "ua-parser-js"
import geoip from "geoip-lite"

const app = express()
const port = process.env.PORT || 3000
app.use(express.urlencoded({ extended: true}))
app.use(express.json())
app.use(cors())

const uri = "mongodb+srv://incenix:BcUfsrApIRBUhDfS@llinx.rb9qgzc.mongodb.net/?retryWrites=true&w=majority"

const createUser = async (client, newUser) => {
    const userCreated = await client.db("llinx").collection("users_data").insertOne(newUser)

    console.log(`New user created with id: ${userCreated.insertedId}`)
}

const listDatabases = async (client) => {
    const dbs = await client.db().admin().listDatabases()

    console.log("Databases:")
    dbs.databases.forEach(db => console.log(" - ", db.name))
}

// if true, login, else ask to create new account
// create the new account by user choice

//Shorten Links **

// Analytics:
// ---
// Number of clicks
// ( excluding user ip )
// Device type with clicks with depth details (Device ->> Mobile ->> IOS )
// Countries with clicks
// ...if you can implement charts, go on
// websites your shortened link has been on / is on
// successful visits to target link

//Video by <a href="https://pixabay.com/users/bellergy-1846871/?utm_source=link-attribution&utm_medium=referral&utm_campaign=video&utm_content=1992">Bellergy RC</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=video&utm_content=1992">Pixabay</a>

// HANDLE USER ACCESS

app.post("/access", (req, res) => {
    const user = req.body;

    const handleAccess = async () => {
    
        const client = new MongoClient(uri)
    
        try {
            await client.connect()
            console.log("Connected to mongodb")
    
            const foundUser = await client.db("llinx").collection("users_data").findOne({
                name_email: user.name_email.toLowerCase(),
                password: user.password
            })
        
            if (foundUser) {
                res.json(foundUser)
                console.log(`${foundUser._id} found and sent to client`);
            } else if (!foundUser || foundUser === undefined) {
                console.log("Not found, ouch!")
            }
    
        } catch (err) {
            console.log(err)
            res.status(500).json({ message: 'Server error' })
        } finally {
            await client.close()
        }
    }

    handleAccess().catch(console.error)
})

// HANDLE URL SHORTENING

let linksDB = {
    "64ghl": {
        targetUrl: "https://investing.com",
        expires: 1690741014204,
        analytics: {
            "191.101.80.9": {
                visits: 0,
                location: {
                    country: "USA",
                    city: "California"
                }
            }
        }
    }
}

const generateRandomStr = () => {
    const randomStr = Math.random().toString(36).substring(2, 7)
    return randomStr
}

app.post("/spring", (req, res) => {
    const reqDetails = req.body
    const { name_email, password, targetUrl } = reqDetails

    const handleLinkGenerationAccess = async () => {
        const client = new MongoClient(uri)
    
        try {
            await client.connect()
            console.log("Connected to mongodb")
    
            const foundUser = await client.db("llinx").collection("users_data").findOne({
                name_email: name_email.toLowerCase(),
                password: password
            })
        
            if (foundUser) {
                const urlID = generateRandomStr()
                linksDB[urlID] = {
                    targetUrl: targetUrl,
                    expires: Date.now() + 1000 * 60 * 5, // expires in 5 minutes
                }

                res.send(`http://localhost:${port}/${urlID}`)
                console.log(`${foundUser._id} found and sent to client`)
            } else if (!foundUser || foundUser === undefined) {
                console.log("Not found, ouch!")
            }
    
        } catch (err) {
            console.log(err)
            res.status(500).json({ message: 'Server error' })
        } finally {
            await client.close()
        }
    }

    handleLinkGenerationAccess().catch(console.err)

    console.log({ name: name_email, pass: password, url: targetUrl })
})

// ANALYTICS

const getVisitDetails = (req) => {
    // GET IP ADDRESS
    const ipAddress = req.socket.remoteAddress || req.headers['x-forwarded-for'] || req.connection.remoteAddress

    // GET USER AGENT
    const visitorUserAgent = req.get("user-agent")
    const parser = new UAParser(visitorUserAgent)
    const deviceType = parser.getDevice().type

    // GET REGION
    const geo = geoip.lookup(ipAddress)

    console.log({
        ipAddress: ipAddress,
        user_agent: deviceType,
        geolocation: geo
    })
}


app.get("/:urlID", (req, res) => {
    const link = linksDB[req.params.urlID]
    getVisitDetails(req)
    
    if (!link) {
        res.status(404).send("Hi, there. This link doesn't exist")
        return
    }

    if (link.expires < Date.now()) {
        res.status(410).send("Hey, :(... This link has expired")
        return
    }

    res.redirect(link.targetUrl)
})

app.listen(port, () => console.log(`Server running at port: ${port}`))