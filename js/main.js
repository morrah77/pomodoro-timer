const noop = function(){};
const TARGET_ELEMENT_ID = 'pomo-widget';
const TIME_QUANT_DURATION = 60000;
const NOTIFICATION_TITLE_MESSAGE = 'Stop!';
const NOTIFICATION_AUDIO_FILE_PATH = 'media/Alarm_Clock.mp3';

class Pomo {
    constructor(startCallback, countdownCallback, finishCallback) {
        this.timer = null;
        this.counter = 0;
        this.countdownCallback = noop;
        this.finishCallback = noop;
        this.startCallback = noop;
        if (typeof startCallback == 'function') {
            this.startCallback = startCallback.bind(this);
        }
        if (typeof countdownCallback == 'function') {
            this.countdownCallback = countdownCallback.bind(this);
        }
        if (typeof finishCallback == 'function') {
            this.finishCallback = finishCallback.bind(this);
        }
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.setup = this.setup.bind(this);
    }
    start() {
        this.startCallback();
        this.timer = setInterval(() => {
            this.counter--;
            this.countdownCallback(this.counter)
            if (this.counter <= 0) {
                this.stop();
            }
        }, TIME_QUANT_DURATION);
    }
    stop() {
        clearInterval(this.timer);
        this.timer = null;
        this.counter = 0;
        this.finishCallback();
    }
    setup(counter) {
        this.counter = counter;
    }
}

class DisplayCountdown extends HTMLElement {
    constructor() {
        super();
        this.counter = 0;
        this.renderWith = this.renderWith.bind(this);
        this.reset = this.reset.bind(this);
        this.render = this.render.bind(this);
        this.render();
    }
    renderWith(counter) {
        this.counter = counter;
        this.render();
    }
    reset() {
        this.renderWith(0)
    }
    render() {
        this.innerHTML = `<div>${this.counter}</div>`
    }
}

let notifyCallback = notify;

function checkNotificationsAvailability() {
    if (!Notification) {
        alert('Notification absent in your browser:(');
        notifyCallback = notifyAudio;
        return;
    }
    if (Notification.permission !== 'granted') {
        Notification.requestPermission(permission => {
            Notification.permission = permission;
        });
    }
}

function notify() {
    notifyNative() || notifyAudio();
}

function notifyNative() {
    if (Notification.permission !== 'granted') {
        return false;
    }
    let notification = new Notification(NOTIFICATION_TITLE_MESSAGE);
    return true;
}

function notifyAudio() {
    let audio = new Audio(NOTIFICATION_AUDIO_FILE_PATH);
    audio.play();
    audio = undefined;
}

function init(targerId) {
    checkNotificationsAvailability();
    customElements.define('display-countdown', DisplayCountdown);
    const targetNode = document.getElementById(targerId);
    const displayCountdown = targetNode.getElementsByTagName('display-countdown')[0];
    const countdownInput = targetNode.getElementsByClassName('countdown')[0];
    const startBtn = targetNode.getElementsByClassName('start-button')[0];
    const stopBtn = targetNode.getElementsByClassName('stop-button')[0];
    const pomo = new Pomo(
        () => {
            displayCountdown.renderWith(countdownInput.value);
            countdownInput.setAttribute('disabled', true);
        },
        displayCountdown.renderWith,
        () => {
            countdownInput.removeAttribute('disabled');
            displayCountdown.reset();
            notifyCallback();
        });
    countdownInput.addEventListener('change',
        () => {
        pomo.setup(countdownInput.value)
    });
    startBtn.addEventListener('click', pomo.start);
    stopBtn.addEventListener('click', pomo.stop);
}

init(TARGET_ELEMENT_ID);
