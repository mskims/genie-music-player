export class User {
  constructor (
    {
      id = null,
      isLogged = false
    }
  ) {
    this.id = id
    this.isLogged = isLogged
  }
}

export class CurrentUser {
}
