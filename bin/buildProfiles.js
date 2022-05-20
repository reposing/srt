const axios = require('axios').default
const fs = require('fs')
const Handlebars = require('./templateHelpers').templateHelpers()

async function BuildProfiles(profiles, riders) {
    templateContents = fs.readFileSync('templates/profiles.hbs')
    var template = Handlebars.compile(templateContents.toString())
    const resultPage = template({ profiles: profiles, riders: riders })

    fs.writeFileSync(`site/profiles.html`, resultPage, 'utf8')
}

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

    profiles.sort((a,b) => a.name.localeCompare(b.name))

    await BuildProfiles(profiles, riders)
})()
