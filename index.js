const {
	app,
	BrowserWindow,
	ipcMain,
	Tray
} = require('electron')

const path = require('path')
const url = require('url')
const keytar = require('keytar')
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
            backgroundThrottling: false
		},
		backgroundColor: '#ffffff',
    })

    // Hide the window when it loses focus
    nativePlayerWindow.on('blur', () => {
        if (!nativePlayerWindow.webContents.isDevToolsOpened()) {
            nativePlayerWindow.hide()
        }
    })
	// nativePlayerWindow.webContents.openDevTools()
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
				mode: 'detach'
			})
		}
    })
    tray.setTitle('로그인이 필요합니다')
}
const toggleNativePlayerWindow = () => {
    if (!user.isLogged){
		if(mainWindow === null){
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
    tray.setTitle('로그인 중...')

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
			console.log(msgStr)
			if (typeof msgStr === 'string') {
				nativePlayerWindow.webContents.removeListener('dom-ready', listner)
			}
			const isLoginSucceed = msgStr === '성공'

			if (isLoginSucceed) {
				user = {
					id: id,
					isLogged: true,
                }
                tray.setTitle(`${id} 님`)
                mainWindow.close()
                mainWindow = null

				nativePlayerWindow.loadURL(PLAYER_URL)
				nativePlayerWindow.webContents.once('dom-ready', () => {
					// nativePlayerWindow.webContents.executeJavaScript(`fnPlay(0);fnGoAnotherIP()`)
				})
				showNativePlayerWindow()
			} else {
                tray.setTitle('로그인이 필요합니다')
                mainWindow.webContents.send('alert', msgStr)
			}
		})
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
    createTray()
    submitStoredCredential()
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
