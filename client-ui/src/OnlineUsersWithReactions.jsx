import React, {Component} from "react";
import _ from 'lodash'
import Avatar from "./Avatar";
import Reactions from "./reactions";
import app from "./feathers";
import SendMsgBar from "./SendMsgBar";

export default class OnlineUsersWithReactions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userStates: {},
      users: []
    };
    this.users = [];

    this.reactionsTimeouts = {};

    this.areaRef = React.createRef();
    this.handleMsg = this.handleMsg.bind(this);
    this.userUpdated = this.userUpdated.bind(this);
    this.onAuthenticated = this.onAuthenticated.bind(this);

    this.updateUsersThrottled = _.throttle(this.updateUsers.bind(this), 500);
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
    const room = app.service('room');

    app.service('messages').on('created', this.handleMsg);
    app.service('users').on('updated', this.userUpdated);

    // Get all users and messages
    let users = await room.find();

      // Once both return, update the state
    this.setState({ users });
    this.users = users;

    app.service('users').on('updated', this.userUpdated);

    // Add new users to the user list
    room.on('created', user => {
      this.users = _.unionBy(this.users, [user], 'id');
      this.updateUsersThrottled();
    });

    room.on('removed', user => {
      this.users = _.filter(this.users, u => user.id !== u.id);
      this.updateUsersThrottled();
    });
  }


  updateUsers() {
    this.setState({users: this.users, userStates: this.state.userStates});
  }

  componentDidMount() {
    app.on("authenticated", this.onAuthenticated);
  }

  componentWillUnmount() {
    // Clean up listeners
    app.off("authenticated", this.onAuthenticated);
    app.service('messages').removeListener('created', this.handleMsg);
    app.service('users').removeListener('updated', this.userUpdated);
  }

  handleMsg({text, userId}) {
    this.state.userStates[userId] = ['user-sent-msg'];

    clearTimeout(this.reactionsTimeouts[userId]);

    this.reactionsTimeouts[userId] = setTimeout(() => {
      this.state.userStates[userId] = [];
      this.updateUsersThrottled();
    }, 1500);

    this.updateUsersThrottled();
    // this.setState({userStates: this.state.userStates})
  }

  getCirclePositionOffsetFromCenter(userIndex) {
    let total = this.state.users.length;

    let circleDiameter = 50;

    let rows = [
      [14, 150], // Row 1
      [17, 210], // Row 1
      [23, 270], // Row 2
      [31, 330], // Row 3
      [41, 390], // Row 4
      [55, 450], // Row 5
      [73, 510], // Row 5
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
      return <Avatar user={user} key={user.id} index={i} total={users.length} includeState={true}
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