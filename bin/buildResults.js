const axios = require('axios').default
const fs = require('fs')

// https://www.wtrl.racing/wtrl_api/wtrlttt20201021.php?wtrlid=97&&_=1614549139322
async function WTRLData(raceID) {
    var results = {
        teams: [],
        classes: []
    }

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
        url: `https://www.wtrl.racing/wtrl_api/wtrlttt20201021.php?wtrlid=${raceID}&&_=${now}`
    }

    // console.log(requestDetails.url)
    try {
        const response = await axios(requestDetails)

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

        for (const result of response.data.data) {
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
    const Handlebars = require('handlebars')

    templateContents = fs.readFileSync('templates/results.hbs')

    Handlebars.registerHelper('raceClass', function (raceClass) {
        var classBadge = ''

        switch (raceClass) {
            case 'Espresso':
                classBadge += '<span class="badge label-espresso">Espresso</span>'
                break
            case 'Frappe':
                classBadge += '<span class="badge label-frappe">Frappe</span>'
                break
            case 'Latte':
                classBadge += '<span class="badge label-latte">Latte</span>'
                break
            case 'Mocha':
                classBadge += '<span class="badge label-mocha">Mocha</span>'
                break
            case 'Doppio':
                classBadge += '<span class="badge label-vienna">Doppio</span>'
                break
            case 'Vienna':
                classBadge += '<span class="badge label-vienna">Vienna</span>'
                break
            case 'Vienna-Frappe':
                classBadge += '<span class="badge label-Fvienna">Vienna-Frappe</span>'
                break
            case 'Vienna-Latte':
                classBadge += '<span class="badge label-Lvienna">Vienna-Latte</span>'
                break
            case 'Vienna-Espresso':
                classBadge += '<span class="badge label-Evienna">Vienna-Espresso</span>'
                break
        }

        return new Handlebars.SafeString(classBadge)
    })

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

    Handlebars.registerHelper('classTotal', function (raceClass, classCounts) {
        var classCount = '?'
        var classSummary = classCounts.find(r => r.class === raceClass)
        if (classSummary) {
            classCount = classSummary.teamCount
        }

        return classCount
    })

    Handlebars.registerHelper('teamShrink', function (teamName) {
        return teamName.replace('Sunrise Racing Team', 'SRT').replace(' ', '')
    })

    Handlebars.registerHelper('timeConvert', function (timeInSeconds, dnf) {
        return dnf == 1 ? new Handlebars.SafeString(secondsToTime(timeInSeconds)) : 'DNF'
    })

    Handlebars.registerHelper('isOdd', function (val, options) {
        return val % 2 !== 0 ? options.fn(this) : options.inverse(this)
    })

    var template = Handlebars.compile(templateContents.toString())
    const resultPage = template({ results: results, raceID: raceID, totalTeams: totalTeams, raceDate: raceDate })

    fs.writeFileSync(`site/results/ttt-${raceID}.html`, resultPage, 'utf8')
}

async function BuildRiderResults(riderSummary, raceCategories) {
    const Handlebars = require('handlebars')

    templateContents = fs.readFileSync('templates/raceRuns.hbs')

    Handlebars.registerHelper('raceClass', function (raceClass) {
        var classBadge = ''

        switch (raceClass) {
            case 'Espresso':
                classBadge += '<span class="badge label-espresso">Espresso</span>'
                break
            case 'Frappe':
                classBadge += '<span class="badge label-frappe">Frappe</span>'
                break
            case 'Latte':
                classBadge += '<span class="badge label-latte">Latte</span>'
                break
            case 'Mocha':
                classBadge += '<span class="badge label-mocha">Mocha</span>'
                break
            case 'Doppio':
                classBadge += '<span class="badge label-vienna">Doppio</span>'
                break
            case 'Vienna':
                classBadge += '<span class="badge label-vienna">Vienna</span>'
                break
            case 'Vienna-Frappe':
                classBadge += '<span class="badge label-Fvienna">Vienna-Frappe</span>'
                break
            case 'Vienna-Latte':
                classBadge += '<span class="badge label-Lvienna">Vienna-Latte</span>'
                break
            case 'Vienna-Espresso':
                classBadge += '<span class="badge label-Evienna">Vienna-Espresso</span>'
                break
        }

        return new Handlebars.SafeString(classBadge)
    })

    Handlebars.registerHelper('isOdd', function (val, options) {
        return val % 2 !== 0 ? options.fn(this) : options.inverse(this)
    })

    Handlebars.registerHelper('categoryCount', function (races, category) {
        var raceCount = 0
        
        var catCount = races.find(r => r.class === category) 

        if (catCount) {
            raceCount = catCount.count
        }

        return raceCount
    })

    var template = Handlebars.compile(templateContents.toString())
    const resultPage = template({ riderSummary: riderSummary, raceCategories: raceCategories })

    fs.writeFileSync(`site/riderRaces.html`, resultPage, 'utf8')
}


async function BuildRaceResultsSummary(result) {
    const Handlebars = require('handlebars')

    templateContents = fs.readFileSync('templates/results-summary.hbs')

    var template = Handlebars.compile(templateContents.toString())
    const teamsPage = template({ result: result })

    fs.writeFileSync(`site/results.html`, teamsPage, 'utf8')
}

function secondsToTime(timeInSeconds) {
    const pad = function (num, size) { return ('000' + num).slice(size * -1) }
    const time = parseFloat(timeInSeconds).toFixed(3)
    const hours = ~~(time / 60 / 60)
    const minutes = ~~(time / 60) % 60
    const seconds = ~~(time - minutes * 60) % 60
    const milliseconds = time.slice(-3)

    var formattedTime = ''
    if (hours > 0) {
        formattedTime += hours + 'h' + (minutes > 0 ? pad(minutes, 2) + ':' : '00:')
    } else if (minutes > 0) {
        formattedTime += minutes + ':'
    }
    formattedTime += (formattedTime !== '' ? pad(seconds, 2) : seconds) + '.<small>' + pad(milliseconds, 3) + '</small>'
    return formattedTime
}

function raceDate(raceID) {
    const weeksToAdd = raceID - 74
    var raceDate = new Date(2020, 08, 17)
    raceDate.setDate(raceDate.getDate() + (7 * weeksToAdd))
    return raceDate.getFullYear() + "-" + (raceDate.getMonth() + 1).toString().padStart(2, '0') + "-" + raceDate.getDate().toString().padStart(2, '0')
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

    for (i = 74; i <= 108; i++) {
        const results = await WTRLData(i)
        totalTeams = results.classes.reduce((a, b) => a + b.teamCount, 0)
        for (const result of results.teams) {
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

        BuildRaceResult(results, i, totalTeams, raceDate(i))
        resultSummary.push({
            raceID: i,
            raceDate: raceDate(i)
        })
    }

    await BuildRaceResultsSummary(resultSummary.reverse())

    riderSummary.sort((a, b) => b.count - a.count)
    raceCategories.sort((a, b) => a.localeCompare(b))

    await BuildRiderResults(riderSummary, raceCategories)
})()
