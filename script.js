'use strict';

const form = document.querySelector('.form');
const sidebar = document.querySelector('.sidebar')
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const navBtn = document.querySelector('.nav-btn')
const cancelBtn = document.querySelector('.form__btn-cancel')
const okBtn = document.querySelector('.form__btn-ok')
const confirmBtns = document.querySelector('.confirm')
const setting = document.querySelector('.set')
const sortMenu = document.querySelector('.sort-menu')

class Workout {
  date = new Date()
  id = String(new Date().getTime()).slice(-10)

  constructor(coords, distance, duration) {
    this.coords = coords
    this.distance = distance
    this.duration = duration
  }
}

class Running extends Workout {
  type = 'running'
  description = `🏃‍ Running on ${new Intl.DateTimeFormat('en-US', {
    month: "long",
    day: "numeric",
  }).format(this.date)}`

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration)
    this.cadence = cadence
    this.clacPace()
  }
  clacPace() {
    this.pace = this.duration / this.distance
    return this.pace
  }
}
class Cycling extends Workout {
  type = 'cycling'
  description = `🚴‍♀️ Cycling on ${new Intl.DateTimeFormat('en-US', {
    month: "long",
    day: "numeric",
  }).format(this.date)}`
  constructor(coords, distance, duration, elev) {
    super(coords, distance, duration)
    this.elev = elev
    this.calcSpeed()
  }
  calcSpeed() {
    this.speed = this.duration / (this.distance / 60)
    return this.speed
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = []

  constructor() {

    this._getLocalStorage()
    this._getPostion()
    navBtn.addEventListener('click', () => {
      this._showSideBar('toggle')
    })
    okBtn.addEventListener('click', this._newWorkout.bind(this))
    form.addEventListener('submit', this._newWorkout.bind(this))
    inputType.addEventListener('change', this._toggleElevationField)
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
    cancelBtn.addEventListener('click', this._newWorkout.bind(this))
    document.querySelectorAll('.item').forEach(item => {
      item.addEventListener('click', this._deleteAndEditWorkout.bind(this))
    })
    sortMenu.addEventListener('click', this._sortType.bind(this))
    setting.addEventListener('click', this._setting.bind(this))
  }
  _getPostion() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
        alert('Could not get your position')
      })
    }
  }
  _loadMap(postion) {
    const { longitude } = postion.coords
    const { latitude } = postion.coords

    const coords = [latitude, longitude]

    this.#map = L.map('map').setView([33.9164, 2.5379], 14);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this))
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work)
    })
  }
  _showSideBar(type) {
    if (type == 'open') {
      sidebar.classList.remove('none')
      navBtn.classList.add('nav-btn-active')
    }
    if (type == 'toggle') {
      sidebar.classList.toggle('none')
      navBtn.classList.toggle('nav-btn-active')
    }
    if(type == 'close') {
      sidebar.classList.add('none')
      navBtn.classList.remove('nav-btn-active')
    }
    if(type == 'no') {
      sidebar.classList.remove('none')
      navBtn.classList.add('nav-btn-active')
    }
  }
  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden')
    inputDistance.focus()
    this._showSideBar('open')
  }
  _hideForm() {
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = ''
    form.style.display = 'none'
    form.classList.add('hidden')
    setTimeout(() => form.style.display = 'grid', 500)
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
  }
  _newWorkout(e) {
    e.preventDefault();
    if (!e.target.classList.contains('form__btn-cancel')) {
      const validInput = (...input) => input.every(inp => Number.isFinite(inp))
      const allPositive = (...input) => input.every(inp => inp > 0)

      const { lat, lng } = this.#mapEvent.latlng
      let workout;

      const type = inputType.value
      const distance = +inputDistance.value
      const duration = +inputDuration.value

      if (type === 'running') {
        const cadence = +inputCadence.value
        if (!validInput(distance, duration, cadence) ||
          !allPositive((distance, duration, cadence))
        ) return alert('Input have to be positive number!')
        workout = new Running([lat, lng], distance, duration, cadence)
        this.#workouts.push(workout)
      }

      if (type === 'cycling') {
        const elevation = +inputElevation.value
        if (!validInput(distance, duration, elevation) ||
          !allPositive(distance, duration)
        ) return alert('Input have to be positive number!')
        workout = new Cycling([lat, lng], distance, duration, elevation)
        this.#workouts.push(workout)
      }

      this._renderWorkoutMarker(workout);
      this._renderWorkout(workout)
      this._hideForm()
      this._setLocalStorage()
      location.reload()
    } else {
      this._hideForm()
    }

  }
  _deleteAndEditWorkout(e) {
    e.preventDefault()

    const parent = e.target.parentNode.parentNode
    const work = parent.querySelector('.workout')
    const conf = parent.querySelector('.confirm')
    const frm = parent.parentNode.querySelector('.form-edit')

    const inputCadenceN = e.target.parentNode.querySelector('.form__input--cadence')
    const inputDistanceN = e.target.parentNode.querySelector('.form__input--distance')
    const inputDurationN = e.target.parentNode.querySelector('.form__input--duration')
    const inputElevationN = e.target.parentNode.querySelector('.form__input--elevation')

    if (e.target.classList.contains('edit-btn')) {
      frm.classList.toggle('hidden')
      parent.classList.toggle('none-cw')
      
    }
    if (e.target.classList.contains('form__btn-cancel')) {
      e.target.parentNode.classList.add('hidden')
      work.classList.remove('none-cw')

      inputDurationN.value = inputDistanceN.value = ''
      if (!inputElevationN)
        inputCadenceN.value = ''
      if (!inputCadenceN)
        inputElevationN.value = ''

    }
    if (e.target.classList.contains('form__btn-ok')) {
      const validInput = (...input) => input.every(inp => Number.isFinite(inp))
      const allPositive = (...input) => input.every(inp => inp > 0)
      const workoutTarget = this.#workouts.find(sel => sel.id == work.getAttribute('data-id'))
      let updateWorkout = workoutTarget
      let listWorkout = JSON.parse(localStorage.getItem("workouts"))

      updateWorkout.distance = +inputDistanceN.value
      updateWorkout.duration = +inputDurationN.value
      if (updateWorkout.type == 'running') {

        updateWorkout.pace = +inputDistanceN.value / +inputDurationN.value
        updateWorkout.cadence = +inputCadenceN.value
      } else {
        updateWorkout.speed = +inputDurationN.value / (+inputDistanceN.value / 60)
        updateWorkout.elev = +inputElevationN.value
      }

      for (let i = 0; i < listWorkout.length; i++) {
        if (listWorkout[i].id == workoutTarget.id) {
          listWorkout[i] = updateWorkout
        }
      }

      if (updateWorkout.type == 'running') {
        if (!validInput(updateWorkout.distance, updateWorkout.duration, updateWorkout.cadence) ||
          !allPositive((updateWorkout.distance, updateWorkout.duration, updateWorkout.cadence))
        ) {
          alert('Input have to be positive number!')
        } else {
          listWorkout = JSON.stringify(listWorkout);
          localStorage.setItem("workouts", listWorkout);
          location.reload()
        }
      } else {
        if (!validInput(updateWorkout.distance, updateWorkout.duration, updateWorkout.elev) ||
          !allPositive((updateWorkout.distance, updateWorkout.duration))
        ) {
          alert('Input have to be positive number!')
        } else {
          listWorkout = JSON.stringify(listWorkout);
          localStorage.setItem("workouts", listWorkout);
          location.reload()
        }
      }
    }

    if (e.target.classList.contains('cancel-btn')) {
      parent.parentNode.querySelector('.confirm').classList.remove('none-cw')
      parent.classList.add('none-cw')
    }
    if (e.target.classList.contains('confirm__btn-yes')) {
      conf.classList.add('none-cw')
      work.classList.add('none-cw')

      const workoutTarget = this.#workouts.find(sel => sel.id == work.getAttribute('data-id'))
      let workItems = JSON.parse(localStorage.getItem("workouts"));

      for (let i = 0; i < workItems.length; i++) {
        let workItem = workItems[i];
        if (workItem.id == workoutTarget.id) {
          workItems.splice(i, 1);
        }
      }
      workItems = JSON.stringify(workItems);
      localStorage.setItem("workouts", workItems);
      location.reload()

    }
    if (e.target.classList.contains('confirm__btn-no')) {
      conf.classList.add('none-cw')
      work.classList.remove('none-cw')
    }

  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords).addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`
      }))
      .setPopupContent(`${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class='item'>
      <div class="workout workout--${workout.type}" data-id="${workout.id}">
        <div class="title">
          <h2 class="workout__title">${workout.description}</h2>
          <span class="edit-btn">&#9998;</span>
            <span class="cancel-btn">&times;</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍' : '🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `
    if (workout.type == 'running')
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </div>
        <div class="confirm none-cw">
          <button class="confirm__btn-yes">yes</button>
          <button class="confirm__btn-no">no</button>
        </div>
        <form class="form-edit hidden">
          <div class="form__row">
            <label class="form__label">Type</label>
            <select class="form__input form__input--type">
              <option value="running">Running</option>
            </select>
          </div>
          <div class="form__row">
            <label class="form__label">Distance</label>
            <input class="form__input form__input--distance" placeholder="km" />
          </div>
          <div class="form__row">
            <label class="form__label">Duration</label>
            <input class="form__input form__input--duration" placeholder="min" />
          </div>
          <div class="form__row">
            <label class="form__label">Cadence</label>
            <input class="form__input form__input--cadence" placeholder="step/min" />
          </div>
          <button class="form__btn form__btn-ok">OK</button>
          <button class="form__btn form__btn-cancel">Cancel</button>
        </form>
      </li>
      `
    if (workout.type == 'cycling')
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elev}</span>
            <span class="workout__unit">m</span>
          </div>
          </div>
            <div class="confirm none-cw">
              <span class="confirm_dng">&#x26A0;</span>
              <span class="confirm_text">Are you sure you want to continue?</span>
              <button class="confirm__btn-yes">yes</button>
              <button class="confirm__btn-no">no</button>
            </div>
          <form class="form-edit hidden">
            <div class="form__row">
              <label class="form__label">Type</label>
                <select class="form__input form__input--type">
                <option value="cycling">Cycling</option>
              </select>
            </div>
            <div class="form__row">
              <label class="form__label">Distance</label>
              <input class="form__input form__input--distance" placeholder="km" />
            </div>
            <div class="form__row">
              <label class="form__label">Duration</label>
              <input class="form__input form__input--duration" placeholder="min" />
            </div>
            <div class="form__row">
              <label class="form__label">Elev Gain</label>
              <input class="form__input form__input--elevation" placeholder="meters" />
            </div>
            <button class="form__btn form__btn-ok">OK</button>
            <button class="form__btn form__btn-cancel">Cancel</button>
          </form>
        </li>
      `
    form.insertAdjacentHTML('afterend', html)
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout')
    if (!workoutEl) return;
    if (!e.target.classList.contains('cancel')) {
      const work = this.#workouts.find(w => +w.id == workoutEl.getAttribute("data-id"))
      this.#map.setView(work.coords, 14);
      if (!e.target.classList.contains('edit-btn')) {
        this._showSideBar('close')
      }
    }
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts))
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'))
    if (!data) return;
    this.#workouts = data
    this.#workouts.forEach(work => {
      this._renderWorkout(work)
    })
  }
  _setting(e) {
    e.preventDefault();
    if (e.target.classList.contains('show')) {
      const latA = []
      const lngA = []
      if(!JSON.parse(localStorage.getItem("workouts"))) return;
      JSON.parse(localStorage.getItem("workouts")).forEach(coord => {
        latA.push(coord.coords[0])
        lngA.push(coord.coords[1])
      })

      const minLat = Math.min(...latA);
      const maxLat = Math.max(...latA);
      const minLng = Math.min(...lngA);
      const maxLng = Math.max(...lngA);

      this.#map.fitBounds(
        [
          [maxLat, minLng],
          [minLat, maxLng],
        ],
        {
          padding: [100, 100],
          animate: true,
          pan: {
            duration: 2,
          },
        }
      );
      this._showSideBar('close')
    }
    const settingS = setting.querySelector('.confirm')
    if (e.target.classList.contains('delete')) {
      settingS.classList.remove('none-cw')
    }
    if (e.target.classList.contains('confirm__btn-yes')) {
      this.reset()
    }
    if (e.target.classList.contains('confirm__btn-no')) {
      settingS.classList.add('none-cw')
    }

    if (e.target.classList.contains('sort')) {
      sortMenu.classList.toggle('hidden')
    }
  }

  _sortType(e) {
    const { target } = e
    if (target.classList.contains('cycling')) {
      document.querySelectorAll('.workout--running').forEach(x => {
        x.classList.toggle('hidden')
      })
      document.querySelectorAll('.workout--cycling').forEach(x => {
        x.classList.remove('hidden')
      })
    }
    if (target.classList.contains('running')) {
      document.querySelectorAll('.workout--cycling').forEach(x => {
        x.classList.toggle('hidden')
      })
      document.querySelectorAll('.workout--running').forEach(x => {
        x.classList.remove('hidden')
      })
    }
  }
  reset() {
    localStorage.removeItem('workouts')
    location.reload()
  }
}
const app = new App()
