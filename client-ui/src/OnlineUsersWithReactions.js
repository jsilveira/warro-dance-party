import React, {Component} from "react";
import _ from 'lodash'
import Avatar from "./avatar";
import Reactions from "./reactions";
import client from "./feathers";
import SendMsgBar from "./SendMsgBar";

export default class OnlineUsersWithReactions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userStates: {},
      users: []
    };

    this.reactionsTimeouts = {};

    this.areaRef = React.createRef();
    this.handleMsg = this.handleMsg.bind(this);
    this.userUpdated = this.userUpdated.bind(this);
    this.onAuthenticated = this.onAuthenticated.bind(this);
  }

  userUpdated(updatedUser) {
    // Replace old user with new one
    let users = this.state.users;
    let pos = _.findIndex(users, u => u.id === updatedUser.id);
    if(pos >= 0) {
      users[pos] = updatedUser;
    }

    this.setState({users})
  }

  async onAuthenticated({user}) {
    const room = client.service('room');

    client.service('messages').on('created', this.handleMsg);
    client.service('users').on('updated', this.userUpdated);

    // Get all users and messages
    let users = await room.find();

      // Once both return, update the state
    this.setState({ users });

    client.service('users').on('updated', this.userUpdated);

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

  componentDidMount() {
    client.on("authenticated", this.onAuthenticated);
  }

  componentWillUnmount() {
    // Clean up listeners
    client.off("authenticated", this.onAuthenticated);
    client.service('messages').removeListener('created', this.handleMsg);
    client.service('users').removeListener('updated', this.userUpdated);
  }

  handleMsg({text, userId}) {
    this.state.userStates[userId] = ['user-sent-msg'];

    clearTimeout(this.reactionsTimeouts[userId]);

    this.reactionsTimeouts[userId] = setTimeout(() => {
      this.state.userStates[userId] = [];
      this.setState({userStates: this.state.userStates})
    }, 1500);

    this.setState({userStates: this.state.userStates})
  }

  getCirclePositionOffsetFromCenter(userIndex) {
    let total = this.state.users.length;

    let circleDiameter = 50;

    let rows = [
      [14, 150], // Row 1
      [17, 210], // Row 1
      [23, 270], // Row 2
      [31, 330], // Row 3
      [41, 390], // Row 3
    ];

    let d = null;
    let seat = userIndex + 1;
    let rowSeats = 1;
    let previousRowsSeats = 0;

    for (const [rowMaxUsers, rowDistanceToCenter] of rows) {
      if (seat <= rowMaxUsers) {
        d = rowDistanceToCenter;
        rowSeats = rowMaxUsers;
        break;
      }
      // Row full, try next row
      seat = seat - rowMaxUsers;
      previousRowsSeats += rowMaxUsers;
    }

    let angle = seat * (360 / Math.min(total - previousRowsSeats, rowSeats)) / 360 * 2 * Math.PI;
    let top = d * Math.sin(angle) - circleDiameter / 2;
    let left = d * Math.cos(angle) - circleDiameter / 2;

    return {left, top}
  }

  getCirclePositionStyle(index) {
    let {left, top} = this.getCirclePositionOffsetFromCenter(index);

    return {
      marginTop: `${top}px`,
      marginLeft: `${left}px`
    };
  }

  getUserPosition(userId) {
    if (this.areaRef.current) {
      let pos = _.findIndex(this.state.users, u => u.id === userId);

      let {x, y, width, height, top, right, bottom, left} = this.areaRef.current.getBoundingClientRect();

      let userPos = this.getCirclePositionOffsetFromCenter(pos);

      // Absolute position of the user with a random offset movement
      let l = 0.5 * width + userPos.left + left + (Math.random() * 60 - 30);
      let t = 0.5 * height + userPos.top + top + (Math.random() * 20 - 10) - 10;

      return {
        left: `${l}px`,
        top: `${t}px`,
      }
    } else {
      return {
        left: `${Math.random() * 50 + 25}%`,
        top: `${Math.random() * 50 + 25}%`,
      }
    }
  }

  render() {
    let {userStates, users} = this.state;

    let userAvatars = users.map((user, i) => {
      return <Avatar user={user} key={user.id} index={i} total={users.length}
                     className={'circle-position ' + ((userStates[user.id] || []).join(' '))}
                     style={this.getCirclePositionStyle(i)}/>;
    });

    return <React.Fragment>
      <div ref={this.areaRef} className={"online-users " + (users.length > 70 ? 'many-users' : '')}>
        <Reactions getUserPositionStyle={this.getUserPosition.bind(this)}/>

        {userAvatars}
      </div>

      <SendMsgBar users={users}/>
    </React.Fragment>
  }
};