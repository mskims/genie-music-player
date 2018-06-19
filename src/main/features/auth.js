import {ipcMain} from 'electron'
import * as keytar from 'keytar'
import {WindowManager, TrayManager, CurrentUser} from '../common'
import * as PlayerWindowHelper from '../../windows/player'
import * as LoginWindowHelper from '../../windows/login'
import * as constants from '../constants'

export const setHooks = () => {
  ipcMain.on('login', (e, payload) => {
    login(payload.id, payload.password).then(() => {
      console.log('로그인 성공')
    }).catch((reason) => {
      console.log('로그인 실패', reason)
    })
  })

  ipcMain.on('logout', () => {
    logout()
  })
}

export const login = async (id, password) => {
  const mainTray = TrayManager.get('main')

  mainTray.setTitle('로그인 중...')

  try {
    CurrentUser.id = await PlayerWindowHelper.login(id, password)
    CurrentUser.isLogged = true
  } catch (reason) {
    mainTray.setTitle('로그인이 필요합니다')
    LoginWindowHelper.sendAlertMessage(reason)
    return false
  }

  await clearCredentials()
  keytar.setPassword(constants.KEYTAR_SERVICE_NAME, id, password)

  mainTray.setTitle(`${id} 님`)

  await PlayerWindowHelper.loadPlayer()

  LoginWindowHelper.get().close()
  PlayerWindowHelper.show()

  return true
}

export const logout = () => {
  const playerWindow = WindowManager.get('player')
  clearCredentials()
  playerWindow.loadURL(constants.LOGOUT_URL)
}

export const submitStoredCredential = () => {
  keytar.findCredentials(constants.KEYTAR_SERVICE_NAME).then(credentials => {
    if (credentials.length < 1) {
      return
    }
    login(credentials[0].account, credentials[0].password)
  })
}

export const clearCredentials = () => {
  return keytar.findCredentials(constants.KEYTAR_SERVICE_NAME).then(credentials => {
    credentials.map(credential => {
      keytar.deletePassword(constants.KEYTAR_SERVICE_NAME, credential.account)
    })
  })
}
