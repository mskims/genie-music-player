import {BrowserWindow} from 'electron'
import url from 'url'
import path from 'path'
import {WindowManager} from '../../main/common'

export const get = () => {
  return WindowManager.get('login')
}

export const create = () => {
  let loginWindow = new BrowserWindow({
    width: 350,
    height: 400,
    show: false,
    frame: false,
    fullscreenable: false,
    titleBarStyle: 'hidden-inset',
    resizable: false,
    transparent: true
    // movable: true,
  })

  loginWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'renderer/login.html'),
    protocol: 'file:',
    slashes: true
  }))

  loginWindow.on('ready-to-show', () => {
    loginWindow.show()
  })

  // Emitted when the window is closed.
  loginWindow.on('closed', () => {
    WindowManager.del('login')
  })

  WindowManager.set('login', loginWindow)

  return loginWindow
}

export const sendAlertMessage = message => {
  get().webContents.send('alert', message)
}
