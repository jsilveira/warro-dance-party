import React, { Component } from 'react';
import Login from './login';
import Chat from './chat';
import client from './feathers';
import _ from 'lodash'
import StarsBackground from "./StarsBackground";

class Application extends Component {
  constructor(props) {
    super(props);

    this.state = {users: []};

    this.chatRef = React.createRef();
    this.userUpdated = this.userUpdated.bind(this);
  }


  userUpdated(user) {
    // Replace old user with new one
    let users = this.state.users;
    let pos = _.findIndex(users, u => u.id === user.id);
    if(pos >= 0) {
      users[pos] = user;
    }

    // Update messages' users
    _.each(this.state.messages, msg => {
      if(msg.user.id === user.id) {
        msg.user = user;
      }
    });

    this.setState({users, messages: this.state.messages})
  }

  componentDidMount() {
    const messages = client.service('messages');
    const room = client.service('room');

    // Try to authenticate with the JWT stored in localStorage
    client.authenticate().catch(() => this.setState({ login: null, connected: true }));

    window.io.on("reconnecting", (delay, attempt) => {
      console.log("Disconnected ... trying to reconnect.", delay, attempt);
      this.setState({login: undefined, connected: false})
    });

    window.io.on("reconnect", () => {
      console.log("reconnect")
      client.authenticate().catch(() => this.setState({ login: null, connected: true }));
    });

    window.io.on("reconnect_failed", () => {
      window.io.socket.reconnect();
      console.log("Reconnect failed")
    });


    // On successfull login
    client.on('authenticated', login => {
      // Get all users and messages
      Promise.all([
        messages.find({
          query: {
            $sort: { createdAt: -1 },
            $limit: 400
          }
        }),
        room.find()
      ]).then( ([ messagePage, roomUsers ]) => {
        // We want the latest messages but in the reversed order
        const messages = messagePage.data.reverse();
        const users = roomUsers;

        // Once both return, update the state
        this.setState({ login, messages, users, connected: true });

        // Once messages are loaded, scroll to the last one
        setTimeout(() => {
          if (this.chatRef.current) {
            this.chatRef.current.scrollToBottom();
          }
        }, 0)
      });

      client.service('users').on('updated', this.userUpdated);
    });

    // On logout reset all all local state (which will then show the login screen)
    client.on('logout', () => this.setState({
      login: null,
      messages: null,
      users: null
    }));

    // Add new messages to the message list
    messages.on('created', message => this.setState({
      messages: (this.state.messages || []).concat(message)
    }));

    // Add new users to the user list
    room.on('created', user => {
      let newUsers = _.unionBy(this.state.users, [user], 'id');
      this.setState({
        users: newUsers
      });
    });

    room.on('removed', user => {
      this.setState({
        users: _.filter(this.state.users, u => user.id !== u.id)
      });
    });
  }

  render() {
    let login = null;

    if (this.state.connected && !this.state.login) {
      login = <div className="container">
        <Login/>
      </div>;
    }
    return <React.Fragment>
      {login}
      <Chat ref={this.chatRef} messages={this.state.messages} users={this.state.users} connected={this.state.connected}/>
      <StarsBackground/>
    </React.Fragment>
  }
}

export default Application;
