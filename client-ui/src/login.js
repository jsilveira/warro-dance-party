import React, { Component } from 'react';
import client from './feathers';

export default class Login extends Component {
  constructor(props) {
    super(props);

    let lastEmail = localStorage.getItem('email');

    this.state = {};

    if(lastEmail) {
      this.state = {email: lastEmail}
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

  login() {
    const { email } = this.state;

    document.body.classList.add('user-authenticated');

    return client.authenticate({
      strategy: 'local',
      email, password: '1234'
    }).catch(error => this.setState({ error }));
  }

  signup() {
    const { email } = this.state;

    localStorage.setItem('email', email);

    // document.body.classList.remove('user-unknown');

    return client.service('users')
      .create({ email, password: '1234' })
      .then(() => this.login());
  }

  render() {
    document.body.classList.add('user-unknown');
    return <div className="login">
        <div>
          <small className="mb-2">¡Sumate al chat, somos un montón! {this.state.error && this.state.error.message}</small>
          <div className={'field-wrap'}>
            <input className="form-control" type="email" name="email" placeholder="Ingresá tu nombre para chatear" onChange={ev => this.updateField('email', ev)} />
            <button className="btn btn-primary btn-send block signup mt-2" onClick={() => this.signup()}>
              <i className={'material-icons'}>chevron_right</i>
            </button>
          </div>
        </div>
    </div>;
  }
}
