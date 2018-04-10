const {app, BrowserWindow, ipcMain} = require('electron')

const path = require('path')
const url = require('url')
const keytar = require('keytar')
const KEYTAR_SERVICE_NAME = 'genie'
let mainWindow

let nativePlayerWindow
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

// https://www.genie.co.kr/member/popLogin
function createMainWindow() {
    mainWindow = new BrowserWindow({width: 1800, height: 1000})

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true,
    }))

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // mainWindow = null
    })

}

function createNativePlayerWindow() {
    nativePlayerWindow = new BrowserWindow({
        width: 800, height: 400,
        show: true,
        alwaysOnTop: true,
    })

    keytar.findCredentials(KEYTAR_SERVICE_NAME).then(credentials => {
        if (credentials.length < 1) {
            return
        }
        login(credentials[0].account, credentials[0].password)
    })

    nativePlayerWindow.webContents.openDevTools()
}

function login(id, password) {
    keytar.setPassword(KEYTAR_SERVICE_NAME, id, password)

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
                mainWindow.webContents.send('login.succeed', user)
                nativePlayerWindow.loadURL(PLAYER_URL)
            } else {
                mainWindow.webContents.send('alert', msgStr)
            }
        })
        console.log('LOGIN!')
    }
    nativePlayerWindow.webContents.on('dom-ready', listner)

}

function logout() {
    keytar.findCredentials(KEYTAR_SERVICE_NAME).then(credentials => {
        credentials.map(credential => {
            keytar.deletePassword(KEYTAR_SERVICE_NAME, credential.account)
        })
    })
    nativePlayerWindow.loadURL(LOGOUT_URL)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createMainWindow()
    createNativePlayerWindow()
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
    if (mainWindow === null) {
        createMainWindow()
    }
})

ipcMain.on('login', (e, payload) => {
    login(payload.id, payload.password)
})
ipcMain.on('logout', () => {
    logout()
})