import React, {Component} from 'react';
import Login from './login';
import DanceFloor from './DanceFloor';
import app from './feathers';
import StarsBackground from "./StarsBackground";

class Application extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.userUpdated = this.userUpdated.bind(this);

  }

  userUpdated(updatedUser) {
    if(updatedUser.id === this.state.user.id) {
      this.setState({user: updatedUser})
    }
  }

  componentDidMount() {
    // Try to authenticate with the JWT stored in localStorage
    let lastEmail = localStorage.getItem('email');
    if(lastEmail) {
      document.body.classList.add('user-authenticated');
    } else {
      document.body.classList.add('user-unknown');
    }

    window.io.on('connect', (res) => {
      console.log("Connected to server.", res);
      this.setState({connected: true});

      app.authenticate()
        .then(() => console.log("Authenticated with previous session."))
        .catch((err) => {
          console.log("Previous session auth failed, creating new login...")
          this.setState({requiresLogin: true});
        });
    });

    window.io.on("reconnecting", (delay, attempt) => {
      console.log("Disconnected ... trying to reconnect.", delay, attempt);
      this.setState({connected: false})
    });

    window.io.on("reconnect", () => {
      console.log("Reconnect")
    });

    window.io.on("reconnect_failed", () => {
      window.io.socket.reconnect();
      console.log("Reconnect failed")
    });

    // On successfull login
    app.on('authenticated', login => {
      console.log(`Authenticated user ${login.user.email} with ID ${login.user.id}`, );

      this.setState({user: login.user, requiresLogin: null});

      app.service('users').on('updated', this.userUpdated);
    });

    // On logout reset all all local state (which will then show the login screen)
    app.on('logout', () => this.setState({
      user: null,
    }));
  }

  componentWillUnmount() {
    app.service('users').removeListener('updated', this.userUpdated);
  }

  render() {
    let {connected, requiresLogin, user} = this.state;

    let lastEmail = localStorage.getItem('email');

    return <React.Fragment>
      <div className="container">
        {requiresLogin ? <Login lastEmail={lastEmail}/> : null}
      </div>

      <DanceFloor connected={connected} user={user}/>

      <StarsBackground/>
    </React.Fragment>
  }
}

export default Application;
