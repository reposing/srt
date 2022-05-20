const axios = require('axios').default
const fs = require('fs')
const Handlebars = require('./templateHelpers').templateHelpers()

// https://www.wtrl.racing/wtrl_api/wtrlttt20201021.php?wtrlid=97&&_=1614549139322
async function WTRLData(raceID) {
    var results = {
        teams: [],
        classes: []
    }

    // const wtrlResultsFile = `data/wtrlresults.json`
    let wtrlResultsData
    // try {
    //     if (fs.existsSync(wtrlResultsFile)) {
    //         wtrlResultsData = JSON.parse(fs.readFileSync(wtrlResultsFile, 'utf8'))
    //     }
    // } catch (err) {
    //     console.error(err)
    // }

    const now = Date.now()
    const path = `data/results/ttt-${raceID}.json`

    try {
        if (fs.existsSync(path)) {
            results = JSON.parse(fs.readFileSync(path, 'utf8'))
            return results
        }
    } catch (err) {
        console.error(err)
    }

    const requestDetails = {
        method: 'GET',
        url: `https://www.wtrl.racing/wtrl_api/wtrlttt20201021.php?wtrlid=${raceID}&_=${now}`
    }

    // console.log(requestDetails.url)
    try {
        if (typeof wtrlResultsData === 'undefined') {
            const response = await axios(requestDetails)
            wtrlResultsData = response.data
        }

        // a - Rider Data
        // b - Rank GC
        // c - Gap GC
        // d - Rank (Class)
        // e - Gap (Class)
        // f - Zone 
        // g - Errors  - Flass when over 3?
        // h - Class
        // i - Time
        // j - ?
        // k - Ave Speed
        // l - Splt 1
        // m - Splt 2
        // n - Split 3
        // o - Team
        // p - ?  Special Team
        // q - Riders

        // aa - Rider is time marker
        // bb - Position
        // cc - Name
        // dd - Tag?
        // ee - Team
        // ff - w/kg
        // gg - Avg Power
        // hh - Rider Cat
        // ii - 0 = DNF, 1 = Finished
        // jj - Time
        // kk - Diff
        // ll - Avg Speed
        // mm - ProfileID

        for (const result of wtrlResultsData.data) {
            var classSummary = results.classes.find(r => r.class === result.h)

            if (classSummary) {
                classSummary.teamCount++
            } else {
                results.classes.push({
                    class: result.h,
                    teamCount: 1
                })
            }

            if (result.o.startsWith('Sunrise Racing Team')) {
                results.teams.push(result)
            }

        }
        fs.writeFileSync(path, JSON.stringify(results, null, 2), 'utf8')

    } catch (error) {
        console.log(`${requestDetails.url} - ${error}`)
    }

    return results
}

async function BuildRaceResult(results, raceID, totalTeams, raceDate) {
    templateContents = fs.readFileSync('templates/results.hbs')
    var template = Handlebars.compile(templateContents.toString())
    const resultPage = template({ results: results, raceID: raceID, totalTeams: totalTeams, raceDate: raceDate })

    fs.writeFileSync(`site/results/ttt-${raceID}.html`, resultPage, 'utf8')
}

async function BuildRiderResults(riderSummary, raceCategories) {
    templateContents = fs.readFileSync('templates/raceRuns.hbs')
    var template = Handlebars.compile(templateContents.toString())
    const resultPage = template({ riderSummary: riderSummary, raceCategories: raceCategories })

    fs.writeFileSync(`site/riderRaces.html`, resultPage, 'utf8')
}


async function BuildRaceResultsSummary(result, years) {
    templateContents = fs.readFileSync('templates/results-summary.hbs')
    var template = Handlebars.compile(templateContents.toString())
    const teamsPage = template({ result: result, years: years })

    fs.writeFileSync(`site/results.html`, teamsPage, 'utf8')
}

function raceDate(raceID) {
    const weeksToAdd = raceID - 74
    var raceDate = new Date(2020, 08, 17)
    raceDate.setDate(raceDate.getDate() + (7 * weeksToAdd))
    return raceDate.getFullYear() + "-" + (raceDate.getMonth() + 1).toString().padStart(2, '0') + "-" + raceDate.getDate().toString().padStart(2, '0')
}

function raceDateExtra(raceID) {
    const weeksToAdd = raceID - 74
    var raceDate = new Date(2020, 08, 17)
    raceDate.setDate(raceDate.getDate() + (7 * weeksToAdd))

    result = {
        raceDate: raceDate,
        raceDateString: raceDate.getFullYear() + "-" + (raceDate.getMonth() + 1).toString().padStart(2, '0') + "-" + raceDate.getDate().toString().padStart(2, '0'),
    }
    return result
}

function FindLatestRaceId() {
    const now = new Date(2022, 04, 25)
    var firstWeek = new Date(2020, 08, 17)
    weeks = Math.floor((now - firstWeek) / (7 * 24 * 60 * 60 * 1000))
    return weeks + 74
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
    const resultSummary = []
    const riderSummary = []
    const raceCategories = []

    const profiles = await RiderProfiles()

    var latestRaceId = FindLatestRaceId()
    for (i = 74; i <= latestRaceId; i++) {
        const results = await WTRLData(i)
        totalTeams = results.classes.reduce((a, b) => a + b.teamCount, 0)
        for (const result of results.teams) {
            if (result.a !== null) {
                result.a.sort((a, b) => a.bb - b.bb)

                for (const rider of result.a) {
                    var riderRaces = riderSummary.find(r => r.profileId === rider.mm)
                    var existingClass = raceCategories.find(r => r === result.h)

                    if (!existingClass) {
                        raceCategories.push(result.h)
                    }

                    if (riderRaces) {
                        riderRaces.count++
                        var raceCount = riderRaces.races.find(r => r.class === result.h)

                        if (raceCount) {
                            raceCount.count++
                        } else {
                            riderRaces.races.push({
                                class: result.h,
                                count: 1
                            })
                        }
                    } else {
                        var profile = profiles.find(r => r.profileId === rider.mm)

                        var riderName
                        if (profile) {
                            riderName = profile.name
                        } else {
                            riderName = rider.cc
                        }

                        riderRaces = {
                            profileId: rider.mm,
                            name: riderName,
                            races: [{
                                class: result.h,
                                count: 1
                            }],
                            count: 1
                        }

                        riderSummary.push(riderRaces)
                    }

                }
            }
        }

        BuildRaceResult(results, i, totalTeams, raceDate(i))
        resultSummary.push({
            raceID: i,
            raceDate: raceDate(i),
            raceDetails: raceDateExtra(i)
        })
    }

    var years = []

    for (var result of resultSummary) {
        var year = years.find(r => r.year === result.raceDetails.raceDate.getFullYear()) 

        if (year === undefined) {
            year = {
                year: result.raceDetails.raceDate.getFullYear()
            }
            year.months = []
            years.unshift(year)
        }

        var month = year.months.find(r => r.month === result.raceDetails.raceDate.getMonth())
        if (month === undefined) {
            month = {
                month: result.raceDetails.raceDate.getMonth()
            }
            month.name = new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(result.raceDetails.raceDate)
            month.races = []
            year.months.unshift(month)
        }
        
        month.races.unshift(result)
    }

    await BuildRaceResultsSummary(resultSummary.reverse(), years)

    riderSummary.sort((a, b) => b.count - a.count)
    raceCategories.sort((a, b) => a.localeCompare(b))

    await BuildRiderResults(riderSummary, raceCategories)
})()
