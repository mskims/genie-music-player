import { dialog } from 'electron'
import { autoUpdater } from 'electron-updater'

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
