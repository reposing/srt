const axios = require('axios').default
const fs = require('fs')

async function TeamRiders() {
    const path = `data/riders.json`
    var riders

    try {
        if (fs.existsSync(path)) {
            riders = JSON.parse(fs.readFileSync(path, 'utf8'))
        }
    } catch (err) {
        console.error(err)
    }

    return riders
}

async function RiderProfiles() {
    const path = `data/profiles.json`
    var profiles

    try {
        if (fs.existsSync(path)) {
            profiles = JSON.parse(fs.readFileSync(path, 'utf8'))
        }
    } catch (err) {
        console.error(err)
    }

    return profiles
}

(async () => {

    var riders = await TeamRiders()
    var profiles = await RiderProfiles()
    
    var uniqueIds = []
    for (const profile of profiles) {
        if (uniqueIds.includes(profile.profileId)) {
            console.log(`Duplicate Profile ID: ${profile.profileId}`)
        }
        else {
            uniqueIds.push(profile.profileId)
        }
    }

    var uniqueIds = []
    for (const rider of riders) {
        if (uniqueIds.includes(rider.profileId)) {
            console.log(`Duplicate Rider ID: ${rider.profileId}`)
        }
        else {
            uniqueIds.push(rider.profileId)
        }
    }

})()
