const axios = require('axios').default
const fs = require('fs')

async function BuildProfiles(profiles, riders) {
    const Handlebars = require('handlebars')

    templateContents = fs.readFileSync('templates/profiles.hbs')

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

        // console.log(profile.profileId)

        var detail = `FTP: ${riderDetail.ftp} w | ${categoryBadge(riderDetail.mixedCategory)}`
        if (riderDetail.womensCategory !== 0) {
            detail += ` ${categoryBadge(riderDetail.womensCategory)}`
        }

        return new Handlebars.SafeString(detail)
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
