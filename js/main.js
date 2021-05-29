const _last_load_date_key = 'lastloadeddate'
const _wh_systems_key = 'wormholesystems'
const _wh_spetifications_key = 'wormholeclassifications'

const _maxLoadCounter = 2
let _loadCounter = 0
let _data = {
    systems: [],
    classifications: []
}

function _loadData() {
    let lastLoadDate = parseInt(getParam(_last_load_date_key))
    if (lastLoadDate) {
        var date = new Date(lastLoadDate);
        date.setDate(date.getDate() + 1);
        let _wh_systems = getParam(_wh_systems_key)
        let wh_systems = JSON.parse(_wh_systems)
        let _wh_spetifications = getParam(_wh_spetifications_key)
        let wh_spetifications = JSON.parse(_wh_spetifications)
        let currentDate = Date.now()
        if (date.getTime() > currentDate && _wh_systems && wh_systems && _wh_systems && wh_spetifications) {
            _data = {
                systems: wh_systems,
                classifications: wh_spetifications
            }
            _progress(false)
            return
        }
    }

    _get('https://rawcdn.githack.com/minlexx/whdbx_web/1e3027f382c5837986aaf9a6272cb924903f1fb4/db/sqlite_sql/wormholesystems_new.sql', data => {
        if (!data) {
            console.error('WH-SYSTEMS LOAD ERROR')
            return
        }
        let result = []
        data.split('\n').forEach(row => {
            let items = row.match(/INSERT INTO ".+" VALUES\([0-9]+,'(J[0-9]+)',([0-9]+),'(.+)',[0-9]+,[0-9]+,(.+),'(.+)'\);/)
            if (!items || items.length !== 6) return
            result.push({
                system: items[1],
                class: items[2],
                star: items[3],
                effect: (items[4] === 'NULL' ? null : items[3]),
                statics: items[5]
            })
        });
        setParam(_wh_systems_key, JSON.stringify(result))
        _setLoadCounter()
    })
    _get('https://rawcdn.githack.com/minlexx/whdbx_web/1e3027f382c5837986aaf9a6272cb924903f1fb4/db/sqlite_sql/wormholeclassifications.sql', data => {
        if (!data) {
            console.error('WH-SPECIFICATIONS LOAD ERROR')
            return
        }
        let result = []
        data.split('\n').forEach(row => {
            let items = row.match(/INSERT INTO wormholeclassifications VALUES\([0-9]+,'(.+)',([0-9]+),([0-9]+),([0-9]+),([0-9]+),([0-9]+)\);/)
            if (!items || items.length !== 7) return
            result.push({
                hole: items[1],
                class: items[2],
                maxStableTime: items[3],
                maxStableMass: items[4],
                massRegeneration: items[5],
                maxJumpMass: items[6]
            })
        });
        setParam(_wh_spetifications_key, JSON.stringify(result))
        _setLoadCounter()
    })
}

function _setLoadCounter() {
    _loadCounter += 1
    if (_loadCounter >= _maxLoadCounter) {
        setParam(_last_load_date_key, Date.now())
        _data = {
            systems: JSON.parse(getParam(_wh_systems_key)),
            classifications: JSON.parse(getParam(_wh_spetifications_key))
        }
        _progress(false)
    }
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

function _createElementFromString(raw) {
    let div = document.createElement('div')
    div.innerHTML = raw.trim()
    return div.firstChild
}

function getParam(name) {
    return window.localStorage.getItem(name)
}

function deleteParam(name) {
    window.localStorage.removeItem(name)
}

function setParam(name, value) {
    window.localStorage.setItem(name, value)
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

window.onload = () => {
        _progress(true)
        let whSearchInput = document.getElementById('whSearch')
        whSearchInput.focus()
        whSearchInput.addEventListener('keyup', event => {
            if (event.keyCode !== 13) return
            event.preventDefault()
            whSearchInput.value = ""
        })
        whSearchInput.addEventListener('focusout', event => {
            whSearchInput.focus()
        })
        whSearchInput.addEventListener('input', event => {
                    const result = document.getElementById('result')
                    result.innerHTML = ""
                    let query = event.target.value
                    if (!query) return
                    let classificationsItem = _data.classifications.find(item => item.hole.toLowerCase().includes(query.toLowerCase()))
                    let systemItem = (query.length > 3 ? _data.systems.find(item => item.system.toLowerCase().includes(query.toLowerCase())) : null)
                    if (classificationsItem) {
                        let maxStableTime = parseInt(classificationsItem.maxStableTime)
                        let maxStableMass = parseInt(classificationsItem.maxStableMass)
                        let massRegeneration = parseInt(classificationsItem.massRegeneration)
                        let maxJumpMass = parseInt(classificationsItem.maxJumpMass)
                        result.appendChild(_createElementFromString(`<dl class="row">
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
</dl>`))
                } else if (systemItem) {
                                result.appendChild(_createElementFromString(`<dl class="row">
  <dt class="col-sm-3">System</dt>
  <dd class="col-sm-9">${systemItem.system}</dd>
  <dt class="col-sm-3">Class</dt>
  <dd class="col-sm-9">${systemItem.class}</dd>

  <dt class="col-sm-3">Other</dt>
  <dd class="col-sm-9">
    <p><strong>Star:</strong> ${systemItem.star}</p>
    ${(systemItem.effect ? `<p><strong>Effect:</strong> ${systemItem.effect}</p>` : "")}
    <p><strong>Statics:</strong> ${systemItem.statics}</p>
  </dd>
</dl>`))
                }
            })
                _loadData()
        }