$.when($.ready).then(function() {
    makeSchedule()
    initTabs()
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric"
})

const dateFormatterLong = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric"
})

const addresses = {
    1: 'ул. Академика Анохина, 4к1',
    2: 'ул. Кременчугская, 13',
    3: 'ул. Олимпийская деревня, 23к1',
    4: 'ул. Народного ополчения, 9к5',
    5: 'Ленинский пр-т, 2/4, МИСиС КБ 17',
    6: 'ул. Мосфильмовская, 88к5'
}

function initTabs() {
    $('.modal-about-tab').click(function() {
        var tab = $(this)
        $('.modal-about-tab.current').removeClass('current')
        tab.addClass('current')

        const idx = tab.index()
        $('.modal-about-tab-body.current').removeClass('current')
        $('.modal-about-tab-body').eq(idx).addClass('current')
    })
}

function makeSchedule() {
    $.ajax({
            url: 'https://db2.gekkon-club.ru/api/calendar',
            data: {
                from: dateForApi(),
                type: 1
            },
            dataType: 'json'
        })
        .done(createScheduleBlock)
        .fail(createErrorBlock)
}

function dateForApi() {
    const current = new Date()
    var day, month, year

    day = current.getDate()
    if (day < 10) day = '0' + day

    month = current.getMonth() + 1
    if (month < 10) month = '0' + month

    year = current.getFullYear()

    return `${day}-${month}-${year}`
}

function createScheduleBlock(apiItems) {
    console.log(apiItems)

    for (const item of apiItems) {
        const data = extractMasterData(item)
        var masterCard = $(makeMasterCard(data))
        masterCard.data(item.id, item)
        $('.mc-cards').append(masterCard)
    }

    initListeners()
}

function createErrorBlock() {
    errorBlock = $(`<div class="mc-error">
                        Нам очень жаль, но что-то пошло не так
                        и мы не смогли загрузить расписание для этой страницы
                    </div>`)
    $('.master-classes').append(errorBlock)
}

function extractMasterData(apiItem) {
    const cover = extractCover(apiItem)

    const lesson = apiItem.baseLesson
    const title = extractTitle(lesson)

    var age = extractAge(lesson)

    var theme
    if (lesson.minClass === null && lesson.minAge === null) {
        theme = 'no-age'
    } else if (lesson.minAge && !(lesson.minClass)) {
        theme = 'preschoolars'
    } else if (lesson.minClass <= 2) {
        theme = 'grades1-2'
    } else if (lesson.minClass <= 4) {
        theme = 'grades3-4'
    } else {
        theme = 'grades5-11'
    }

    var date = formatDate(dateFormatter, apiItem.startDate)
    date.month = date.month.slice(0, -1)
    const address = extractAddress(apiItem)

    return {
        theme,
        cover,
        day: date.day,
        month: date.month,
        time: date.time,
        title,
        age,
        address
    }
}

function extractAge(lessonInfo) {
    var age

    if (!(lessonInfo.minClass || lessonInfo.minAge)) {
        age = ''
    } else if (lessonInfo.minClass) {
        age = `(${lessonInfo.minClass}-${lessonInfo.maxClass} кл.)`
    } else {
        age = `(${lessonInfo.minAge}-${lessonInfo.maxAge} лет)`
    }

    return age
}

function extractTitle(lessonInfo) {
    return lessonInfo.name.trim()
        .split(' ')
        .slice(1, -1)
        .join(' ')
}

function extractCover(apiItem) {
    const defaultCover = 'https://storage.geekclass.ru/images/080d1774-fece-462b-9388-46cc311eb657.jpg'
    const cover = apiItem.cover ? apiItem.cover : defaultCover

    return cover
}

function formatDate(format, date) {
    date = format.formatToParts(new Date(date))

    const day = date[0].value
    const month = date[2].value
    const time = date[4].value + ':' + date[6].value

    return {
        day,
        month,
        time
    }
}

function extractAddress(apiItem) {
    return addresses[apiItem.room.affiliate_id]
}

function makeMasterCard(masterData) {

    const {
        theme,
        cover,
        day,
        month,
        title,
        age,
        time,
        address
    } = masterData

    template = `
    <div class="mc-card ${theme}">
        <button class="more theme">Подробнее</button>
        <img class="mc-cover" src="${cover}" alt="">
        <div class="mc-footer">
            <div class="mc-date theme">
                <div class="day">${day}</div>
                <div class="month">${month}</div>
            </div>
            <div class="mc-description">
                <div class="title">${title} ${age}</div>
                <div class="time">${time}</div>
                <div class="address">${address}</div>
            </div>
        </div>
    </div>
    ` // more button отдельно

    return template
}

function initListeners() {
    $('.modal-close').click(function() {
        $(this).parent().parent().removeClass('open')
    })

    $('.more').click(function() {
        $('.enroll-modal-box').addClass('open')
    })
}

function fillModal(apiItem) {
    title
    date
    duration
    age
    address
    id
}