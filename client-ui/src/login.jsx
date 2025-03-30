import React, { Component } from 'react';
import app from './feathers';

export default class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    if(props.lastEmail) {
      this.state = {email: props.lastEmail};
    }
  }

  componentDidMount() {
    if(this.state.email) {
      this.signup();
    }
  }

  updateField(name, ev) {
    this.setState({ [name]: ev.target.value });
  }

  async login() {
    const { email } = this.state;

    try {
      await app.authenticate({
        strategy: 'local',
        email, password: '1234'
      });

      document.body.classList.add('user-authenticated');
      document.body.classList.remove('user-unknown');
      console.log("Login with user")
    } catch(error) {
      this.setState({ error })
    }
  }

  async signup() {
    let users = app.service('users');

    const { email } = this.state;

    localStorage.setItem('email', email);

    let newUser = { email, password: '1234' };

    newUser.isPlaying = localStorage.getItem('player-state') !== "paused";

    console.log("NEW", newUser)

    // If the user has an avatar image from the past, make sure to set it
    let lastAvatarData = localStorage.getItem('avatarBase64Data');
    if(lastAvatarData) {
      console.log("Setting previous avatar image...");
      newUser.imageData = lastAvatarData;
    }

    await users.create(newUser);

    await this.login();
  }

  render() {
    if(!this.props.lastEmail) {
      return <div className="login">
        <div>
          <small className="mb-2">¡Sumate al chat, somos un
            montón! {this.state.error && this.state.error.message}</small>
          <div className={'field-wrap'}>
            <input className="form-control" type="email" name="email" placeholder="Ingresá tu nombre para chatear"
                   onChange={ev => this.updateField('email', ev)}/>
            <button className="btn btn-primary btn-send block signup mt-2" onClick={() => this.signup()}>
              <i className={'material-icons'}>chevron_right</i>
            </button>
          </div>
        </div>
      </div>;
    } else {
      return null;
    }
  }
}
