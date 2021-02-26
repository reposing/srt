const axios = require('axios')
const fs = require('fs')
const { toNamespacedPath } = require('path')

async function WTRLData() {
    const path = 'data/teams.json'
    var teams = []

    try {
        if (fs.existsSync(path)) {
            teams = JSON.parse(fs.readFileSync(path, 'utf8'))
            return teams
        }
    } catch (err) {
        console.error(err)
    }

    const cheerio = require('cheerio')

    const requestDetails = {
        method: 'GET',
        url: 'https://www.wtrl.racing/ttt/TTT-Event.php'
    }

    const response = await axios(requestDetails)
    const $ = cheerio.load(response.data)
    const tables = $('table')

    for (const table of tables) {
        if (table.attribs.id === 'reg_ttt') {
            for (const tableSection of table.children) {
                if (tableSection.name === 'tbody') {
                    for (const rows of tableSection.children) {
                        if (rows.children && rows.children.length > 0) {
                            for (const cell of rows.children) {
                                for (const cellChild of cell.children) {
                                    if (cellChild.data && cellChild.data.startsWith('Sunrise Racing Team')) {
                                        const team = {
                                            name: cellChild.data
                                        }

                                        // console.log(cellChild.parent)

                                        if (cellChild.parent.prev.children[0].children[0]) {
                                            team.class = cellChild.parent.prev.children[0].children[0].data
                                        }

                                        if (cellChild.parent.prev.prev.children[0]) {
                                            if (cellChild.parent.prev.prev.children[0].data) {
                                                team.zone = cellChild.parent.prev.prev.children[0].data
                                            } else {
                                                if (cellChild.parent.prev.prev.children[0].children[0]) {
                                                    team.zone = cellChild.parent.prev.prev.children[0].children[0].data
                                                }
                                            }
                                        }

                                        if (cellChild.parent.next.children[0]) {
                                            team.delay = cellChild.parent.next.children[0].data
                                        }
                                        if (cellChild.parent.next.next.children[0]) {
                                            team.tag = cellChild.parent.next.next.children[0].data
                                        }
                                        if (cellChild.parent.next.next.next.children[0].children[0]) {
                                            team.pen = cellChild.parent.next.next.next.children[0].children[0].data
                                        }
                                        if (cellChild.parent.next.next.next.next.children[0]) {
                                            team.bannerDrop = cellChild.parent.next.next.next.next.children[0].data
                                        }
                                        if (cellChild.parent.next.next.next.next.next.children[0]) {
                                            if (cellChild.parent.next.next.next.next.next.children[0].attribs) {
                                                team.event = cellChild.parent.next.next.next.next.next.children[0].attribs.href
                                            } else {
                                                team.event = 'Coming Soon'
                                            }
                                        }

                                        teams.push(team)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    fs.writeFileSync(path, JSON.stringify(teams, null, 2), 'utf8')
    return teams
}

async function ZwiftPowerSignups(eventId) {
    const path = `data/signups_${eventId}.json`
    var signups

    try {
        if (fs.existsSync(path)) {
            signups = JSON.parse(fs.readFileSync(path, 'utf8'))
            return signups
        }
    } catch (err) {
        console.error(err)
    }

    const requestDetails = {
        method: 'GET',
        url: `https://zwiftpower.com/cache3/results/${eventId}_signups.json`
    }

    try {
        const response = await axios(requestDetails)
        fs.writeFileSync(path, JSON.stringify(response.data, null, 2), 'utf8')
        return response.data
    } catch (error) {
        console.log(`${requestDetails.url} - ${error.response.status}`)
    }
}

async function TeamRiders() {
    const path = `data/riders.json`
    var riders

    try {
        if (fs.existsSync(path)) {
            riders = JSON.parse(fs.readFileSync(path, 'utf8'))
            return riders
        }
    } catch (err) {
        console.error(err)
    }

    const requestDetails = {
        method: 'GET',
        url: `https://zwiftpower.com/api3.php?do=team_riders&id=11789`
    }

    try {
        const response = await axios(requestDetails)

        var riders = []

        if (response.data.data) {
            for (const rider of response.data.data) {
                newRider = {
                    profileId: rider.zwid,
                    name: rider.name,
                    ftp: rider.ftp[0],
                    weight: rider.w[0],
                    mixedCategory: rider.div,
                    womensCategory: rider.divw
                }

                riders.push(newRider)
            }
        }

        fs.writeFileSync(path, JSON.stringify(riders, null, 2), 'utf8')
        return riders
    } catch (error) {
        console.log(`${requestDetails.url} - ${error}`)
    }
}

async function BuildTeams(teams, eventDate, lastUpdate) {
    const Handlebars = require("handlebars")

    Handlebars.registerHelper('shortName', function (aString) {
        return aString.replace('(', '').replace(')', '')
    })

    Handlebars.registerHelper('bannerDrop', function (aString) {
        const parts = aString.split(' - ')
        return parts[parts.length - 1]
    })

    Handlebars.registerHelper('isPL', function (aString, options) {
        return aString === 'PL' ? options.fn(this) : options.inverse(this)
    })

    Handlebars.registerHelper('isComingSoon', function (aString, options) {
        return aString === 'Coming Soon' ? options.fn(this) : options.inverse(this)
    })

    Handlebars.registerHelper('isOdd', function (val, options) {
        return val % 2 !== 0 ? options.fn(this) : options.inverse(this)
    })

    Handlebars.registerHelper('hasRiders', function (val, options) {
        if (val.length > 0) {
            return options.fn(this)
        }
    })

    Handlebars.registerHelper('category', function (mixedCat, womensCat) {
        var mixedCategory = ''
        switch (mixedCat) {
            case 5:
                mixedCategory = '<span class="badge label-cat-Aplus label-as-badge" style="font-size:8px;">A+</span>'
                break
            case 10:
                mixedCategory = '<span class="badge label-cat-A label-as-badge" style="font-size:8px;">A</span>'
                break
            case 20:
                mixedCategory = '<span class="badge label-cat-B label-as-badge" style="font-size:8px;">B</span>'
                break
            case 30:
                mixedCategory = '<span class="badge label-cat-C label-as-badge" style="font-size:8px;">C</span>'
                break
            case 40:
                mixedCategory = '<span class="badge label-cat-D label-as-badge" style="font-size:8px;">D</span>'
                break
            case 50:
                mixedCategory = '<span class="badge label-cat-E label-as-badge" style="font-size:8px;">E</span>'
                break
        }
        switch (womensCat) {
            case 5:
                mixedCategory += '&nbsp;<span class="badge label-cat-F label-as-badge" style="font-size:8px;">A+</span>'
                break
            case 10:
                mixedCategory += '&nbsp;<span class="badge label-cat-F label-as-badge" style="font-size:8px;">A</span>'
                break
            case 20:
                mixedCategory += '&nbsp;<span class="badge label-cat-F label-as-badge" style="font-size:8px;">B</span>'
                break
            case 30:
                mixedCategory += '&nbsp;<span class="badge label-cat-F label-as-badge" style="font-size:8px;">C</span>'
                break
            case 40:
                mixedCategory += '&nbsp;<span class="badge label-cat-F label-as-badge" style="font-size:8px;">D</span>'
                break
            case 50:
                mixedCategory += '&nbsp;<span class="badge label-cat-F label-as-badge" style="font-size:8px;">E</span>'
                break
        }
        return new Handlebars.SafeString(mixedCategory)
    })

    Handlebars.registerHelper('riderPopover', function (rider) {
        const wattsPerKilo = rider.ftp / rider.weight
        var riderDetails = `<strong>FTP</strong>: ${rider.ftp}<br />`
        riderDetails += `<strong>w/kg</strong>: ${wattsPerKilo.toFixed(1)}<br />`
        riderDetails += `<br /><a href='https://zwiftpower.com/profile.php?z=${rider.profileId}' target='_blank'>Profile</a>`

        return new Handlebars.SafeString(riderDetails)
    })

    Handlebars.registerHelper('isMappedRider', function (val, options) {
        return typeof val === 'object' ? options.fn(this) : options.inverse(this)
    })

    templateContents = fs.readFileSync('templates/teams.hbs')

    var template = Handlebars.compile(templateContents.toString())
    const teamsPage = template({ teams: teams, date: eventDate, lastUpdate: lastUpdate })

    fs.writeFileSync('site/teams.html', teamsPage, 'utf8')
}

async function TeamAssignments() {
    const path = `data/team_assignments.json`
    var teamAssignments

    try {
        if (fs.existsSync(path)) {
            teamAssignments = JSON.parse(fs.readFileSync(path, 'utf8'))
            return teamAssignments
        }
    } catch (err) {
        console.error(err)
    }

}

function getNextDayOfWeek(date, dayOfWeek) {
    var resultDate = new Date(date.getTime())

    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7)

    return resultDate
}


(async () => {
    const riders = await TeamRiders()
    const teams = await WTRLData()
    const teamAssignments = await TeamAssignments()

    for (const rider of riders) {
        var nameParts
        if (rider.name.indexOf('(') != -1) {
            nameParts = rider.name.substring(0, rider.name.indexOf('(')).trim().split(/\s+/)
        } else {
            nameParts = rider.name.trim().split(/\s+/)
        }
        if (/^[0-9]/.test(nameParts[0])) {
            nameParts.shift()
        }
        rider.displayName = nameParts[0]
        if (nameParts.length > 1) {
            rider.displayName += ` ${nameParts[1][0]}`
        }
    }

    const currentDate = new Date()
    const nextThursday = getNextDayOfWeek(currentDate, 4)
    nextThursday.setHours(0, 0, 0, 0)
    const assignmentDate = new Date(teamAssignments.date)

    for (const team of teams) {
        team.shortName = team.tag.replace('(', '').replace(')', '')
        team.riders = []
        team.racing = true

        var signups

        if (team.event !== 'Coming Soon') {
            const eventSignupUrl = new URL(team.event)
            const pathParts = eventSignupUrl.pathname.split('/')
            if (pathParts.length > 0) {
                eventId = pathParts[pathParts.length - 1]
                signups = await ZwiftPowerSignups(eventId)
            }
        }

        if (nextThursday.getTime() === assignmentDate.getTime()) {
            if (teamAssignments.teams.hasOwnProperty(team.shortName)) {
                team.racing = teamAssignments.teams[team.shortName].racing
                for (const assignedRider of teamAssignments.teams[team.shortName].mapped) {
                    var riderDetails = riders.find(r => r.profileId === assignedRider)

                    if (riderDetails) {
                        team.riders.push(riderDetails)
                    } else {
                        console.log(`Cannot find rider ${assignedRider} for ${team.shortName}`)
                    }
                }
                for (const unmappedRider of teamAssignments.teams[team.shortName].unmapped) {
                    team.riders.push(unmappedRider)
                }
            }
        }

        if (signups) {
            for (const signup of signups.data) {
                var teamRider = team.riders.find(r => r.profileId === signup.zwid)
                if (teamRider) {
                    teamRider.signedUp = true
                    teamRider.goodTag = false

                    if (teamRider.name.indexOf(team.tag) != -1) {
                        teamRider.goodTag = true
                    }
                }
            }
        }

    }

    teams.sort((a, b) => a.name.localeCompare(b.name))

    const now = new Date()
    const lastUpdate = now.getFullYear() + "-" + (now.getMonth() + 1).toString().padStart(2, '0') + "-" + now.getDate().toString().padStart(2, '0') + " " + now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0')
    const nextEvent = nextThursday.getFullYear() + "-" + (nextThursday.getMonth() + 1).toString().padStart(2, '0') + "-" + nextThursday.getDate().toString().padStart(2, '0')
    await BuildTeams(teams, nextEvent, lastUpdate)
})()
