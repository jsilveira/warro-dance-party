import React, {Component} from "react";

const name = (user) => user.email.split('@')[0]

export class Avatar extends Component {
  getCirclePositionStyle() {
    let {index, total} = this.props;

    let circleDiameter = 50;

    // [rowMaxUsers, rowDistanceToCenter]

    let rows = [
      [14, 150], // Row 1
      [17, 210], // Row 1
      [23, 270], // Row 2
      [31, 330], // Row 3
      [41, 390], // Row 3
    ];

    let d = null;
    let seat = index+1;
    let rowSeats = 1;
    let previousRowsSeats = 0;

    for(const [rowMaxUsers, rowDistanceToCenter] of rows) {
      if(seat <= rowMaxUsers) {
        d = rowDistanceToCenter;
        rowSeats = rowMaxUsers;
        break;
      }
      // Row full, try next row
      seat = seat - rowMaxUsers;
      previousRowsSeats += rowMaxUsers;
    }

    let angle = seat * (360 / Math.min(total - previousRowsSeats, rowSeats)) / 360 * 2 * Math.PI;
    let top = d * Math.sin(angle) - circleDiameter/2;
    let left = d * Math.cos(angle) - circleDiameter/2;

    return {
      marginTop: `${top}px`,
      marginLeft: `${left}px`
    };
  }

  render() {
    let {user, positionInCircle} = this.props;
    let {email, id} = user;

    let words = (email || "").split("@")[0].trim().split(/[^\w]/);
    let initials = words[0].slice(0, 2)
    // if (words.length > 1) {
    //   initials = words[0].slice(0, 2) + ' ' + words[1].slice(0, 2)
    // }
    let [h, s, l] = [
      Number.parseInt(id.slice(0, 2), 16) / 256 * 365,
      Number.parseInt(id.slice(2, 4), 16) / 256 * 100,
      Number.parseInt(id.slice(4, 6), 16) / 256 * 100
    ];

    const colA = `hsl(${h},${s / 2 * 1 + 10}%,${l / 3 + 50}%)`;
    const colB = `hsl(${h},${s / 2 * 1+ 35}%,${l / 3 + 20}%)`;
    // const colB = colA;

    const styleBgd = {
      // background: `linear-gradient(${s}deg, ${colA} 20%, ${colB} 80%)`
      border: `solid 1px ${colA}`
    };

    const styleFill = {
      // background: `linear-gradient(${s}deg, ${colA} 20%, ${colB} 80%)`
      background: `${colA}`
    };

    const styleColor = {
      color: `${colA}`
    };

    let avatarPosition = positionInCircle ? this.getCirclePositionStyle() : {};

    return <div className={"avatar "+(positionInCircle ? 'circle-position' : '')} style={avatarPosition}>
      <div className={"round-avatar"} style={styleBgd} title={user.email}>
        <span className={'initials'} style={styleColor}>{initials}</span>
        <img src={user.avatar.replace(/s=60$/, "s=60&d=blank")} alt={user.email} className="gravatar"/>
        <div className={'avatar-fill'} style={styleFill}></div>
      </div>
      <div className="avatar-name bg-dark shadow-sm" style={styleColor}>{name(this.props.user)}</div>
    </div>;
  }
}