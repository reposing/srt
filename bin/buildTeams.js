const axios = require('axios')
const fs = require('fs')
const Handlebars = require('./templateHelpers').templateHelpers()

async function WTRLData() {
    const path = 'data/teams.json'
    var teams = []

    // try {
    //     if (fs.existsSync(path)) {
    //         teams = JSON.parse(fs.readFileSync(path, 'utf8'))
    //         return teams
    //     }
    // } catch (err) {
    //     console.error(err)
    // }

    const cheerio = require('cheerio')

    const requestDetails = {
        method: 'GET',
        url: 'https://www.wtrl.racing/ttt/TTT-Event.php'
    }

    const response = await axios(requestDetails)
    const $ = cheerio.load(response.data)
    const tables = $('table')

    for (const table of tables) {
        if (table.attribs.id === 'wtrlttt-reg') {
            for (const tableSection of table.children) {
                if (tableSection.name === 'tbody') {
                    for (const rows of tableSection.children) {
                        if (rows.children && rows.children.length > 0) {
                            for (const cell of rows.children) {
                                for (const cellChild of cell.children) {
                                    if (cellChild.data && cellChild.data.startsWith('Sunrise Racing Team')) {
                                        const team = {
                                            name: cellChild.data,
                                            tag: ''
                                        }

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

                                        if (cellChild.parent.next.next.children[0]) {
                                            team.delay = cellChild.parent.next.next.children[0].data
                                        }
                                        // if (cellChild.parent.next.next.children[0]) {
                                        //     team.tag = cellChild.parent.next.next.children[0].data
                                        // }
                                        if (cellChild.parent.next.next.children[0].children) {
                                            team.pen = cellChild.parent.next.next.children[0].children.data
                                        }
                                        if (cellChild.parent.next.next.next.next.children[0]) {
                                            team.bannerDrop = cellChild.parent.next.next.next.next.children[0].data
                                        }
                                        if (cellChild.parent.next.next.next.next.children[0]) {
                                            if (cellChild.parent.next.next.next.next.children[0].attribs) {
                                                team.event = cellChild.parent.next.next.next.next.children[0].attribs.href
                                            } else {
                                                team.event = 'Coming Soon'
                                            }
                                        }

                                        switch (team.name) {
                                            case 'Sunrise Racing Team':
                                                team.tag = 'SRT'
                                                break;
                                            case 'Sunrise Racing Team 2':
                                                team.tag = 'SRT2'
                                                break;
                                            case 'Sunrise Racing Team 3':
                                                team.tag = 'SRT3'
                                                break;
                                            case 'Sunrise Racing Team 4':
                                                team.tag = 'SRT4'
                                                break;
                                            case 'Sunrise Racing Team 5':
                                                team.tag = 'SRT5'
                                                break;
                                            case 'Sunrise Racing Team 6':
                                                team.tag = 'SRT6'
                                                break;
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
    // var riders

    // try {
    //     if (fs.existsSync(path)) {
    //         riders = JSON.parse(fs.readFileSync(path, 'utf8'))
    //         return riders
    //     }
    // } catch (err) {
    //     console.error(err)
    // }

    const zwiftPowerRiders = `data/11789_riders.json`
    let zwiftPowerRiderData
    try {
        if (fs.existsSync(zwiftPowerRiders)) {
            zwiftPowerRiderData = JSON.parse(fs.readFileSync(zwiftPowerRiders, 'utf8'))
        }
    } catch (err) {
        console.error(err)
    }

    const requestDetails = {
        method: 'GET',
        url: 'https://zwiftpower.com/cache3/teams/11789_riders.json' //`https://zwiftpower.com/api3.php?do=team_riders&id=11789`
    }

    try {
        if (typeof zwiftPowerRiderData === 'undefined') {
            const response = await axios(requestDetails)
            zwiftPowerRiderData = response.data
        }

        var riders = []

        if (zwiftPowerRiderData.data) {
            for (const rider of zwiftPowerRiderData.data) {
                var weight = rider.w[0]
                if (weight === 0 && rider.hasOwnProperty('h_1200_watts') && rider.h_1200_watts != '') {
                    weight = rider.h_1200_watts.replace(',', '') / rider.h_1200_wkg
                }

                newRider = {
                    profileId: rider.zwid,
                    name: rider.name,
                    ftp: rider.ftp[0],
                    weight: weight,
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
    assignmentDate.setHours(0, 0, 0, 0)

    for (const team of teams) {
        team.shortName = team.tag.replace('(', '').replace(')', '')
        team.riders = []
        team.racing = true
        team.signups = false

        var signups

        if (team.event !== 'Coming Soon') {
            if (teamAssignments.teams.hasOwnProperty(team.shortName)) {
                if (teamAssignments.teams[team.shortName].eventID) {
                    signups = await ZwiftPowerSignups(teamAssignments.teams[team.shortName].eventID)
                }
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
            team.signups = true
            var pens = ['', 'A', 'B', 'C', 'D', 'E']

            for (const signup of signups.data) {
                var teamRider = team.riders.find(r => r.profileId === signup.zwid)
                if (teamRider) {
                    teamRider.signedUp = true
                    teamRider.goodPen = false

                    if (team.pen === pens[signup.label]) {
                        teamRider.goodPen = true
                    }
                }
            }
        }
    }

    teams.sort((a, b) => a.name.localeCompare(b.name))

    const now = new Date()
    const lastUpdate = now.getUTCFullYear() + '-' + (now.getUTCMonth() + 1).toString().padStart(2, '0') + '-' + now.getUTCDate().toString().padStart(2, '0') + ' ' + now.getUTCHours().toString().padStart(2, '0') + ':' + now.getUTCMinutes().toString().padStart(2, '0') + ' UTC'
    const nextEvent = nextThursday.getFullYear() + '-' + (nextThursday.getMonth() + 1).toString().padStart(2, '0') + '-' + nextThursday.getDate().toString().padStart(2, '0')

    await BuildTeams(teams, nextEvent, lastUpdate)
})()
