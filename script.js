var modalState = {
    modal: null,
    lastInvokedId: null
}

$.when($.ready).then(function() {
    makeSchedule()
    initTabs()
});

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
})

const dateFormatterLong = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'long',
    year: 'numeric'
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
    console.log(apiItems) // убрать

    for (const item of apiItems) {
        const data = extractMasterData(item)
        var masterCard = $(makeMasterCard(data))
        masterCard.data('item', item)
        $('.mc-cards').append(masterCard)
    }

    initListeners().then(function() {
        modalState.modal = $('.enroll-modal').clone(true)
    })
}

function createErrorBlock() {
    errorBlock = $(`<div class="mc-error">
                        Нам очень жаль, но что-то пошло не так,
                        и мы не смогли загрузить расписани
                    </div>`)
    $('.master-classes').append(errorBlock)
}

function extractMasterData(apiItem) {
    const cover = extractCover(apiItem)
    const title = extractTitle(apiItem)
    var age = extractAge(apiItem)

    const lesson = apiItem.baseLesson

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
        day: date.day,
        month: date.month,
        time: date.time,
        theme,
        cover,
        title,
        age,
        address
    }
}

function extractAge(apiItem) {
    const lessonInfo = apiItem.baseLesson
    var age

    if (!(lessonInfo.minClass || lessonInfo.minAge)) {
        age = ''
    } else if (lessonInfo.minClass) {
        age = `${lessonInfo.minClass}-${lessonInfo.maxClass} кл.`
    } else {
        age = `${lessonInfo.minAge}-${lessonInfo.maxAge} лет`
    }

    return age
}

function extractTitle(apiItem) {
    const lessonInfo = apiItem.baseLesson

    return lessonInfo.name.trim()
        .split(' ')
        .slice(1, -1)
        .join(' ')
}

function extractCover(apiItem) {
    const defaultCover = 'img/cover-default.jpg'
    const cover = apiItem.cover ? apiItem.cover : defaultCover

    return cover
}

function formatDate(format, date) {
    const dateParts = format.formatToParts(new Date(date))
    var dateObject = {}

    for (const part of dateParts) {
        if (part.type != 'literal') {
            dateObject[part.type] = part.value
        }
    }
    dateObject.time = dateObject.hour + ':' + dateObject.minute

    return dateObject
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
    `

    return template
}

function initListeners() {
    return new Promise(function(resolve) {
        console.log('promising')

        $('.modal-close').click(function() {
            $(this).parent().parent().removeClass('open')
        })

        $('.more').click(function() {
            const data = $(this).parent().data('item')

            if (data.id != modalState.lastInvokedId) {
                modalState.lastInvokedId = data.id
                $('.enroll-modal').replaceWith(modalState.modal)
                modalState.modal = modalState.modal.clone(true)
            }

            fillModal(data)
            $('.enroll-modal-box').addClass('open')
        })

        $('.show-form').click(function() {
            $(this).parent().slideUp()
            $('.modal-enroll').slideDown()
        })

        $('.modal-enroll-form').submit(function(e) { // доделать
            e.preventDefault();

            $.ajax({
                type: 'POST',
                url: $('form').attr('action'),
                data: $('form').serialize(),
                //or your custom data either as object {foo: 'bar', ...} or foo=bar&...
                success: function(response) {},
            });

            console.log('submitted');
        });

        resolve('initiated')
    })
}

function fillModal(apiItem) {
    const address = extractAddress(apiItem)
    const id = apiItem.id
    const date = formatDate(dateFormatterLong, apiItem.startDate)
    const cover = extractCover(apiItem)
    const title = extractTitle(apiItem)
    const age = extractAge(apiItem)
    const duration = apiItem.baseLesson.duration
    const fullDate = `${date.day} ${date.month} ${date.year}, ${date.weekday}`

    $('.modal-header-cover').attr('src', cover)
    $('.modal-header-title').text(title)
    if (age) {
        $('.header-extra-item.age span').text(age)
    } else {
        $('.header-extra-item.age').hide()
    }
    if (duration) {
        $('.header-extra-item.duration span').text(duration + ' мин')
    } else {
        $('.header-extra-item.duration').hide()
    }
    $('.modal-enroll-form input[name="lessonId"]').val(id)
    $('.event-info-item.date').text(fullDate)
    $('.event-info-item.address').text(address)
    $('.event-info-item.time').text(date.time)
}