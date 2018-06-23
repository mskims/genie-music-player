'use strict'

window.$ = window.jQuery = require('jquery')

$('.input100').each(function () {
  $(this).on('blur', function () {
    if ($(this).val().trim() != '') {
      $(this).addClass('has-val')
    } else {
      $(this).removeClass('has-val')
    }
  })
})

const {ipcRenderer} = require('electron')

window.onload = function () {
  const $loginForm = document.getElementById('login-form')

  $loginForm.addEventListener('submit', function (e) {
    e.preventDefault()
    ipcRenderer.send('login', {
      id: this.id.value,
      password: this.password.value,
    })
    return false
  })

  ipcRenderer.on('alert', (e, payload) => {
    alert(payload)
  })
}