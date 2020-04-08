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

    return client.authenticate({
      strategy: 'local',
      email, password: '1234'
    }).catch(error => this.setState({ error }));
  }

  signup() {
    const { email } = this.state;

    localStorage.setItem('email', email);

    return client.service('users')
      .create({ email, password: '1234' })
      .then(() => this.login());
  }


  render() {
    return <div className="login">
        <div className="text-center  bg-white shadow-sm rounded mt-5 p-2">
          <h3 className="mb-2">¿Quién sos 🐱?</h3>
          <p>{this.state.error && this.state.error.message}</p>

          <div>
            <fieldset>
              <input className="form-control" type="email" name="email" placeholder="email" onChange={ev => this.updateField('email', ev)} />
            </fieldset>

            <div className="btn btn-primary block signup mt-2" onClick={() => this.signup()}>
              Enter the party
            </div>
          </div>
        </div>
    </div>;
  }
}
