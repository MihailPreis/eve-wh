class Group {
    constructor() {
        this.enterCounter = 0
        this.leaveCounter = 0
    }

    enter() {
        this.enterCounter++
    }

    leave() {
        this.leaveCounter++
        this._callIfNeeded()
    }

    notify(callback) {
        this.callback = callback
        this._callIfNeeded()
    }

    _callIfNeeded() {
        if (this.leaveCounter != this.enterCounter || !this.callback) return
        this.callback()
        this.callback = null
    }
}

function _normalize(string) {
    if (!string || string === 'NULL') return 'NULL'
    if (string.startsWith('\'')) string = string.substring(1)
    if (string.endsWith('\'')) string = string.substring(0, string.length - 1)
    return string
}

function alert(message, type) {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('')
    document.getElementById('liveAlertPlaceholder').append(wrapper)
    setTimeout(() => wrapper.remove(), 3000)
}

function _get(url, cb) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.send(null);
    request.onreadystatechange = () => {
        if (request.readyState === 4 && request.status === 200) {
            var type = request.getResponseHeader('Content-Type');
            if (type.indexOf("text") !== 1) {
                cb(request.responseText)
            } else {
                cb(null)
            }
        }
    }
}

function _loadData(collback) {
    _progress(true)

    let group = new Group()

    let wormholesystems = []
    let wormholeclassifications = []

    group.enter()
    _get('https://raw.githubusercontent.com/minlexx/whdbx_web/master/db/sqlite_sql/wormholesystems_new.sql', data => {
        if (data) {
            wormholesystems = data
                .split('\n')
                .map(row => {
                    let raw = row.match(/INSERT INTO "wormholesystems_new" VALUES\((.+)\);/)
                    if (!raw || raw.length !== 2) return
                    let items = raw[1].split(',').map(i => _normalize(i))
                    return {
                        system: items[1],
                        class: items[2],
                        star: items[3],
                        planets: items[4],
                        moons: items[5],
                        effect: items[6],
                        statics: items[7]
                    }
                })
                .filter(item => item !== undefined)
            alert(`Loaded ${wormholesystems.length} wormhole systems`, 'success')
        } else {
            alert('Failed to load wormhole systems', 'danger')
        }
        group.leave()
    })

    group.enter()
    _get('https://raw.githubusercontent.com/minlexx/whdbx_web/master/db/sqlite_sql/wormholeclassifications.sql', data => {
        if (data) {
            wormholeclassifications = data
                .split('\n')
                .map(row => {
                    let raw = row.match(/INSERT INTO wormholeclassifications VALUES\((.+)\);/)
                    if (!raw || raw.length !== 2) return
                    let items = raw[1].split(',').map(i => _normalize(i))
                    return {
                        hole: items[1],
                        class: items[2],
                        maxStableTime: items[3],
                        maxStableMass: items[4],
                        massRegeneration: items[5],
                        maxJumpMass: items[6]
                    }
                })
                .filter(item => item !== undefined)
            alert(`Loaded ${wormholeclassifications.length} wormhole classifications`, 'success')
        } else {
            alert('Failed to load wormhole classifications', 'danger')
        }
        group.leave()
    })

    group.notify(() => {
        collback(wormholesystems, wormholeclassifications)
        _progress(false)
    })
}

function _createElementFromString(raw) {
    let div = document.createElement('div')
    div.innerHTML = raw.trim()
    return div.firstChild
}

function _progress(state) {
    if (state) {
        let item = document.getElementById('loading')
        if (item) return
        document.body.appendChild(_createElementFromString('<div class="loading" id="loading">Loading&#8230;</div>'))
    } else {
        let item = document.getElementById('loading')
        if (item) document.body.removeChild(item)
    }
}

function _castClass(c) {
    if (c == 99) return "pochven"
    if (c > 6) c = 6
    return `c${c}`
}

function _getClassifications(classificationsItem) {
    let maxStableTime = parseInt(classificationsItem.maxStableTime)
    let maxStableMass = parseInt(classificationsItem.maxStableMass)
    let massRegeneration = parseInt(classificationsItem.massRegeneration)
    let maxJumpMass = parseInt(classificationsItem.maxJumpMass)
    return _createElementFromString(`<div class="card bg-dark text-white">
  <img src="/img/wh_colors/${_castClass(classificationsItem.class)}.png" class="card-img">
  <div class="card-img-overlay">
    <dl class="row">
        <dt class="col-sm-3">Hole</dt>
        <dd class="col-sm-9">${classificationsItem.hole}</dd>
        <dt class="col-sm-3">Class</dt>
        <dd class="col-sm-9">${classificationsItem.class}</dd>

        <dt class="col-sm-3">Other</dt>
        <dd class="col-sm-9">
            ${(maxStableTime ? `<p><strong>Max stable time:</strong> ${maxStableTime}</p>` : "")}
            ${(maxStableMass ? `<p><strong>Max stable mass:</strong> ${maxStableMass}</p>` : "")}
            ${(massRegeneration ? `<p><strong>Regeneration mass:</strong> ${massRegeneration}</p>` : "")}
            ${(maxJumpMass ? `<p><strong>Max jump mass:</strong> ${maxJumpMass}</p>` : "")}
        </dd>
    </dl>
  </div>
</div>`)
}

function _getSystems(systemItem) {
    return _createElementFromString(`<div class="card bg-dark text-white">
  <img src="/img/wh_colors/${_castClass(systemItem.class)}.png" class="card-img">
  <div class="card-img-overlay">
    <dl class="row">
        <dt class="col-sm-3">System</dt>
        <dd class="col-sm-9">${systemItem.system}</dd>
        <dt class="col-sm-3">Class</dt>
        <dd class="col-sm-9">${systemItem.class}</dd>

        <dt class="col-sm-3">Other</dt>
        <dd class="col-sm-9">
            <p><strong>Star:</strong> ${systemItem.star}</p>
            ${(systemItem.effect !== "NULL" ? `<p><strong>Effect:</strong> ${systemItem.effect}</p>` : "")}
            <p><strong>Moons:</strong> ${systemItem.moons}</p>
            <p><strong>Planets:</strong> ${systemItem.planets}</p>
            <p><strong>Statics:</strong> ${systemItem.statics}</p>
        </dd>
    </dl>
  </div>
</div>`)
}

window.onload = () => {
    let whSearchInput = document.getElementById('whSearch')

    whSearchInput.focus()

    whSearchInput.addEventListener('keyup', event => {
        if (event.key !== 'Enter') return
        event.preventDefault()
        whSearchInput.value = ""
    })

    whSearchInput.addEventListener('focusout', _ => whSearchInput.focus())

    _loadData((systems, classifications) => {
        whSearchInput.addEventListener('input', event => {
            const result = document.getElementById('result')
            result.innerHTML = ""
            let query = event.target.value
            if (!query) return
            let classificationsItem = classifications.find(item => item.hole.toLowerCase().includes(query.toLowerCase()))
            let systemItem = (query.length > 3 ? systems.find(item => item.system.toLowerCase().includes(query.toLowerCase())) : null)
            if (classificationsItem) {
                result.appendChild(_getClassifications(classificationsItem))
            } else if (systemItem) {
                result.appendChild(_getSystems(systemItem))
            }
        })
    })
}
