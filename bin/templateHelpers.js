exports.templateHelpers = function () {
    const Handlebars = require('handlebars')

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
            default:
                classBadge += raceClass
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

    Handlebars.registerHelper('isNewRow', function (val, options) {
        if (val % 4 === 0)  {
            return options.fn(this)
        }
    })

    Handlebars.registerHelper('isEndRow', function (val, length, options) {
        if (val === 0 && length !== 1) {
            return options.inverse(this)
        }
        if (val + 1 === length) {
            return options.fn(this)
        }
        if ((val+1) % 4 === 0)  {
            return options.fn(this)
        }
    })

    Handlebars.registerHelper('riderStats', function (profile, riders) {
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

        var riderDetail = riders.find(r => r.profileId === profile.profileId)

        if (riderDetail == null) {
            console.log(profile.profileId)
        }
        var detail = `FTP: ${riderDetail.ftp} w | ${categoryBadge(riderDetail.mixedCategory)}`
        if (riderDetail.womensCategory !== 0) {
            detail += ` ${categoryBadge(riderDetail.womensCategory)}`
        }

        return new Handlebars.SafeString(detail)
    })

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

    Handlebars.registerHelper('hasRiders', function (val, options) {
        if (val.length > 0) {
            return options.fn(this)
        }
    })

    Handlebars.registerHelper('riderDualCategory', function (mixedCat, womensCat) {
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

    return Handlebars
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