const {
    app,
    BrowserWindow,
    ipcMain,
    Tray,
    globalShortcut,
} = require('electron')

const path = require('path')
const url = require('url')
const keytar = require('keytar')
const MediaService = require('electron-media-service')

const mediaService = new MediaService()


const KEYTAR_SERVICE_NAME = 'genie'
const GENIE_URL_HTTP = 'http://www.genie.co.kr'
const GENIE_URL_HTTPS = 'https://www.genie.co.kr'
const PLAYER_URL = `${GENIE_URL_HTTP}/player/fPlayer`
const LOGIN_URL = `${GENIE_URL_HTTPS}/auth/signIn`
const LOGOUT_URL = `${GENIE_URL_HTTP}/auth/signOut?act=popmusic&rfr=/player/fPlayer`

let user = {
    isLogged: false,
    id: null,
    playList: [],
}
let mainWindow
let nativePlayerWindow
let tray

class NativePlayerController {
    constructor(nativePlayerWindow) {
        this.window = nativePlayerWindow
    }

    emit(strScript) {
        strScript += `;
            if ($('#login-another').is(':visible')) {
                fnGoAnotherIP();
            }
        `
        this.window.webContents.executeJavaScript(strScript)
    }

    togglePlay() {
        this.emit(`audioApi.toggle()`)
    }

    play() {
        this.emit(`audioApi.play()`)
    }

    pause() {
        this.emit(`audioApi.pause()`)
    }

    seek(toMs) {
        this.emit(`audioApi.seek(${toMs / 1000})`)
    }

    next() {
        this.emit(`fnPlayNext()`)
    }

    previous() {
        this.emit(`fnPlayPrev()`)
    }

}

let globalPlayerController

// https://www.genie.co.kr/member/popLogin
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 350,
        height: 400,
        show: false,
        frame: false,
        fullscreenable: false,
        titleBarStyle: 'hidden-inset',
        resizable: false,
        transparent: true,
        // movable: true,
    })

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'renderer/login.html'),
        protocol: 'file:',
        slashes: true,
    }))

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        mainWindow = null
    })

}

function createNativePlayerWindow() {
    nativePlayerWindow = new BrowserWindow({
        width: 450,
        height: 500,
        show: false,
        frame: false,
        fullscreenable: false,
        resizable: false,
        webPreferences: {
            backgroundThrottling: false,
        },
        backgroundColor: '#ffffff',
    })

    // Hide the window when it loses focus
    nativePlayerWindow.on('blur', () => {
        if (!nativePlayerWindow.webContents.isDevToolsOpened()) {
            nativePlayerWindow.hide()
        }
    })
    nativePlayerWindow.webContents.openDevTools({
        mode: 'detach',
    })

    globalPlayerController = new NativePlayerController(nativePlayerWindow)
}


function createTray() {
    tray = new Tray(path.join(__dirname, 'assets/trayTemplate.png'))
    tray.on('right-click', toggleNativePlayerWindow)
    tray.on('double-click', toggleNativePlayerWindow)
    tray.on('click', function (event) {
        toggleNativePlayerWindow()

        // Show devtools when command clicked
        if (nativePlayerWindow.isVisible() && process.defaultApp && event.metaKey) {
            nativePlayerWindow.openDevTools({
                mode: 'detach',
            })
        }
    })
    tray.setTitle('로그인이 필요합니다')
}

const toggleNativePlayerWindow = () => {
    if (!user.isLogged) {
        if (mainWindow === null) {
            createMainWindow()
        } else {
            mainWindow.focus()
        }
    } else if (nativePlayerWindow.isVisible()) {
        nativePlayerWindow.hide()
    } else {
        showNativePlayerWindow()
    }
}

const getNativePlayerWindowPosition = () => {
    const windowBounds = nativePlayerWindow.getBounds()
    const trayBounds = tray.getBounds()

    // Center window horizontally below the tray icon
    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

    // Position window 4 pixels vertically below the tray icon
    const y = Math.round(trayBounds.y + trayBounds.height + 4)

    return {x: x, y: y}
}

const showNativePlayerWindow = () => {
    const position = getNativePlayerWindowPosition()
    nativePlayerWindow.setPosition(position.x, position.y, false)
    nativePlayerWindow.show()
    nativePlayerWindow.focus()
}

const submitStoredCredential = () => {
    keytar.findCredentials(KEYTAR_SERVICE_NAME).then(credentials => {
        if (credentials.length < 1) {
            return
        }
        login(credentials[0].account, credentials[0].password)
    })
}

function login(id, password) {
    if (!id || !password) {
        return
    }

    tray.setTitle('로그인 중...')
    nativePlayerWindow.webContents.session.clearStorageData({
        storages: ['cookies'],
    })

    nativePlayerWindow.loadURL(LOGIN_URL, {
        postData: [{
            type: 'rawData',
            bytes: Buffer.from(`login_http=https&uxd=${id}&uxx=${password}&uxglk=0`),
        }],
        extraHeaders: 'Content-Type: application/x-www-form-urlencoded',
    })
    const listner = () => {
        nativePlayerWindow.webContents.executeJavaScript(`msgStr`, true, msgStr => {
            if (typeof msgStr === 'string') {
                nativePlayerWindow.webContents.removeListener('dom-ready', listner)
            }
            const isLoginSucceed = msgStr === '성공'

            if (isLoginSucceed) {
                user = {
                    id: id,
                    isLogged: true,
                }
                clearCredentials().then(() => {
                    keytar.setPassword(KEYTAR_SERVICE_NAME, id, password)
                })
                tray.setTitle(`${id} 님`)

                nativePlayerWindow.loadURL(PLAYER_URL)
                nativePlayerWindow.webContents.once('dom-ready', () => {
                    nativePlayerWindow.webContents.executeJavaScript(`
                        window.ipcRenderer = require('electron').ipcRenderer;
                    `)
                    if (mainWindow.isVisible()) {
                        mainWindow.close()
                    }
                    mainWindow = null
                    showNativePlayerWindow()
                })
            } else {
                tray.setTitle('로그인이 필요합니다')
                mainWindow.webContents.send('alert', msgStr)
            }
        })
    }
    nativePlayerWindow.webContents.on('dom-ready', listner)
}

function clearCredentials() {
    return keytar.findCredentials(KEYTAR_SERVICE_NAME).then(credentials => {
        credentials.map(credential => {
            keytar.deletePassword(KEYTAR_SERVICE_NAME, credential.account)
        })
    })
}

function logout() {
    clearCredentials()
    nativePlayerWindow.loadURL(LOGOUT_URL)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    debugger;
    createMainWindow()
    createNativePlayerWindow()
    createTray()
    submitStoredCredential()

    mediaService.startService()
    mediaService.on('play', () => {
        console.log('play!')
        globalPlayerController.play()
    })
    mediaService.on('pause', () => {
        console.log('pause!')
        globalPlayerController.pause()
    })
    mediaService.on('playPause', () => {
        console.log('playPause!')
        globalPlayerController.togglePlay()
    })
    mediaService.on('next', () => {
        console.log('next!')
        globalPlayerController.next()
    })
    mediaService.on('previous', () => {
        console.log('previous')
        globalPlayerController.previous()
    })
    mediaService.on('seek', (toMs) => {
        console.log(`seek to ${toMs}ms`)
        globalPlayerController.seek(toMs)
    })

    mediaService.setMetaData({
        title: 'Never Gonna Give You Up',
        state: MediaService.STATES.PLAYING,
        currentTime: 30 * 1000,
        duration: 60 * 3 * 1000,
        // Other track meta data here
    })
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    showNativePlayerWindow()
})

ipcMain.on('login', (e, payload) => {
    login(payload.id, payload.password)
})

ipcMain.on('logout', () => {
    logout()
})