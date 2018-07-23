import { dialog } from 'electron'
import { autoUpdater } from 'electron-updater'

let updater
autoUpdater.autoDownload = false

autoUpdater.on('error', (error) => {
  dialog.showErrorBox('Error: ', error == null ? 'unknown' : (error.stack || error).toString())
})

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Found Updates',
    message: `새로운 기능들이 있는데, 업데이트 하실래요?:\r\n${info.releaseNotes}`,
    buttons: ['네!', '싫어요..']
  }, (buttonIndex) => {
    if (buttonIndex === 0) {
      autoUpdater.downloadUpdate()
    } else {
      dialog.showMessageBox({
        title: 'Okay..',
        message: '알겠어요......... 😞'
      })
      if (updater) {
        updater.enabled = true
        updater = null
      }
    }
  })
})

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    title: 'Install Updates',
    message: '업데이트를 적용할 준비가 끝났어요! \r\n곧 지니를 재시작할게요. 👋'
  }, () => {
    setImmediate(() => autoUpdater.quitAndInstall())
  })
})

export const initialize = () => {
  autoUpdater.checkForUpdates()
}

export const checkForUpdates = (menuItem, focusedWindow, event) => {
  updater = menuItem
  updater.enabled = false
  autoUpdater.checkForUpdates()

  autoUpdater.once('update-not-available', () => {
    dialog.showMessageBox({
      title: 'No Updates',
      message: '최신버전이네요! 축하드립니다 🎉'
    })
    updater.enabled = true
    updater = null
  })
}
