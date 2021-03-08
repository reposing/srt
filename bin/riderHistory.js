const axios = require('axios')
const fs = require('fs')

async function TeamRiders() {
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

        return riders
    } catch (error) {
        console.log(`${requestDetails.url} - ${error}`)
    }
}

async function BuildAchievments(achievements) {
    const Handlebars = require("handlebars")

    Handlebars.registerHelper('category', function (category) {
        var categoryBadge = ''
        switch (category) {
            case 5:
                categoryBadge = '<span class="badge label-cat-Aplus label-as-badge" style="font-size:8px;">A+</span>'
                break
            case 10:
                categoryBadge = '<span class="badge label-cat-A label-as-badge" style="font-size:8px;">A</span>'
                break
            case 20:
                categoryBadge = '<span class="badge label-cat-B label-as-badge" style="font-size:8px;">B</span>'
                break
            case 30:
                categoryBadge = '<span class="badge label-cat-C label-as-badge" style="font-size:8px;">C</span>'
                break
            case 40:
                categoryBadge = '<span class="badge label-cat-D label-as-badge" style="font-size:8px;">D</span>'
                break
            case 50:
                categoryBadge = '<span class="badge label-cat-E label-as-badge" style="font-size:8px;">E</span>'
                break
        }
        return new Handlebars.SafeString(categoryBadge)
    })

    Handlebars.registerHelper('isOdd', function (val, options) {
        return val % 2 !== 0 ? options.fn(this) : options.inverse(this)
    })

    Handlebars.registerHelper('ISODate', function (date) {
        var eventDate = new Date(date)
        return eventDate.getFullYear() + "-" + (eventDate.getMonth() + 1).toString().padStart(2, '0') + "-" + eventDate.getDate().toString().padStart(2, '0')
    })

    Handlebars.registerHelper('eventType', function (eventType) {
        var eventValue = ''
        switch (eventType) {
            case 'ftpBump':
                eventValue = 'FTP Increase'
                break
            case 'mixedCategoryChange':
                eventValue = 'Mixed Category Increase'
                break
            case 'womensCategoryChange':
                eventValue = 'Womens Category Increase'
                break
            case 'riderJoined':
                eventValue = 'Rider Joined'
                break
        }
        return eventValue
    })

    Handlebars.registerHelper('eventDetails', function (eventType, eventData) {
        var categoryBadge = function (category) {
            var categoryBadge = ''
            switch (category) {
                case 5:
                    categoryBadge = '<span class="badge label-cat-Aplus label-as-badge" style="font-size:8px;">A+</span>'
                    break
                case 10:
                    categoryBadge = '<span class="badge label-cat-A label-as-badge" style="font-size:8px;">A</span>'
                    break
                case 20:
                    categoryBadge = '<span class="badge label-cat-B label-as-badge" style="font-size:8px;">B</span>'
                    break
                case 30:
                    categoryBadge = '<span class="badge label-cat-C label-as-badge" style="font-size:8px;">C</span>'
                    break
                case 40:
                    categoryBadge = '<span class="badge label-cat-D label-as-badge" style="font-size:8px;">D</span>'
                    break
                case 50:
                    categoryBadge = '<span class="badge label-cat-E label-as-badge" style="font-size:8px;">E</span>'
                    break
            }
            return categoryBadge    
        }

        var eventValue = ''
        switch (eventType) {
            case 'ftpBump':
                eventValue = `FTP increase from ${eventData.oldFTP} watts to ${eventData.newFTP} watts`
                break
            case 'mixedCategoryChange':
                eventValue = `Mixed category increase from ${categoryBadge(eventData.oldCategory)} to ${categoryBadge(eventData.newCategory)}`
                break
            case 'womensCategoryChange':
                eventValue = `Womens category increase from ${categoryBadge(eventData.oldCategory)} to ${categoryBadge(eventData.newCategory)}`
                break
            case 'riderJoined':
                eventValue = 'Welcome to the team'
                break
        }
        return new Handlebars.SafeString(eventValue)
    })

    templateContents = fs.readFileSync('templates/achievements.hbs')

    var template = Handlebars.compile(templateContents.toString())
    const teamsPage = template({ achievements: achievements })

    fs.writeFileSync('site/achievements.html', teamsPage, 'utf8')
}

(async () => {
    const runDate = new Date()
    const riderHistoryPath = `data/riderHistory.json`
    var riders = []

    try {
        if (fs.existsSync(riderHistoryPath)) {
            riders = JSON.parse(fs.readFileSync(riderHistoryPath, 'utf8'))
            console.log(`Loaded rider history: ${riders.length}`)
        }
    } catch (err) {
        console.error(err)
    }

    const honourRollPath = `data/honourRoll.json`
    var honourRoll = []

    try {
        if (fs.existsSync(honourRollPath)) {
            honourRoll = JSON.parse(fs.readFileSync(honourRollPath, 'utf8'))
            console.log(`Loaded honour roll: ${honourRoll.length}`)
        }
    } catch (err) {
        console.error(err)
    }

    const teamRiders = await TeamRiders()

    for (const teamRider of teamRiders) {
        var riderDetails = riders.find(r => r.profileId === teamRider.profileId)

        if (riderDetails) {
            riderDetails.name = teamRider.name

            if (riderDetails.ftp != teamRider.ftp) {
                console.log(`FTP Change: ${riderDetails.ftp} -> ${teamRider.ftp}`)

                if (riderDetails.ftp < teamRider.ftp) {
                    honourRoll.push({
                        date: runDate,
                        eventType: 'ftpBump',
                        eventData: {
                            name: teamRider.name,
                            profileId: teamRider.profileId,
                            oldFTP: riderDetails.ftp,
                            newFTP: teamRider.ftp
                        }
                    })
                }

                riderDetails.ftp = teamRider.ftp
                riderDetails.ftpHistory.push({ date: runDate, ftp: teamRider.ftp })
            }
            if (riderDetails.mixedCategory != teamRider.mixedCategory) {
                console.log(`Mixed Cat Change: ${riderDetails.mixedCategory} -> ${teamRider.mixedCategory}`)

                if (riderDetails.mixedCategory > teamRider.mixedCategory) {
                    honourRoll.push({
                        date: runDate,
                        eventType: 'mixedCategoryChange',
                        eventData: {
                            name: teamRider.name,
                            profileId: teamRider.profileId,
                            oldCategory: riderDetails.mixedCategory,
                            newCategory: teamRider.mixedCategory
                        }
                    })
                }

                riderDetails.mixedCategory = teamRider.mixedCategory
                riderDetails.mixedCategoryHistory.push({ date: runDate, mixedCategory: teamRider.mixedCategory })
            }
            if (riderDetails.womensCategory != teamRider.womensCategory) {
                console.log(`Womens Cat Change: ${riderDetails.womensCategory} -> ${teamRider.womensCategory}`)

                if (riderDetails.womensCategory > teamRider.womensCategory) {
                    honourRoll.push({
                        date: runDate,
                        eventType: 'womensCategoryChange',
                        eventData: {
                            name: teamRider.name,
                            profileId: teamRider.profileId,
                            oldCategory: riderDetails.womensCategory,
                            newCategory: teamRider.womensCategory
                        }
                    })
                }

                riderDetails.womensCategory = teamRider.womensCategory
                riderDetails.womensCategoryHistory.push({ date: runDate, womensCategory: teamRider.womensCategory })
            }
        } else {
            console.log(`New rider added: ${teamRider.name}`)
            teamRider.ftpHistory = [{ date: runDate, ftp: teamRider.ftp }]
            teamRider.mixedCategoryHistory = [{ date: runDate, mixedCategory: teamRider.mixedCategory }]
            teamRider.womensCategoryHistory = [{ date: runDate, womensCategory: teamRider.womensCategory }]
            riders.push(teamRider)

            honourRoll.push({
                date: runDate,
                eventType: 'riderJoined',
                eventData: {
                    name: teamRider.name,
                    profileId: teamRider.profileId
                }
            })
        }
    }

    console.log(riders.length)

    fs.writeFileSync(riderHistoryPath, JSON.stringify(riders, null, 2), 'utf8')
    fs.writeFileSync(honourRollPath, JSON.stringify(honourRoll, null, 2), 'utf8')

    honourRoll.sort((a,b) => new Date(b.date) - new Date(a.date) )

    await BuildAchievments(honourRoll)
})()
