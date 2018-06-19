class BaseManager {
  constructor (storage) {
    this.storage = storage || {}
  }

  set (name, target) {
    this.storage[name] = target
  }

  get (name) {
    if (this.exists(name)) {
      return this.storage[name]
    } else {
      throw Error(`'${name}' does not exists. `)
    }
  }

  del (name) {
    if (this.exists(name)) {
      this.storage[name] = null
      delete this.storage[name]
      return true
    } else {
      throw Error(`'${name}' does not exists. `)
    }
  }

  exists (name) {
    return name in this.storage
  }
}

export const WindowManager = new BaseManager({})

export const TrayManager = new BaseManager({})
