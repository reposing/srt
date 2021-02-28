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
})()
