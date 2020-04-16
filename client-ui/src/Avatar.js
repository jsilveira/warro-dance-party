import React, {Component} from "react";

const name = (user) => user.email.split('@')[0]

export default class Avatar extends Component {
  static getUserColor(id) {
    let [h, s, l] = [
      Number.parseInt(id.slice(0, 2), 16) / 256 * 365,
      Number.parseInt(id.slice(2, 4), 16) / 256 * 100,
      Number.parseInt(id.slice(4, 6), 16) / 256 * 100
    ];

    return `hsl(${h},${s / 2 * 1 + 30}%,${l / 4 + 55}%)`;
  }

  render() {
    let {user, positionInCircle, style, className} = this.props;
    let {email, id} = user;

    let initials = (email || "").slice(0, 2)

    const colA = Avatar.getUserColor(user.id);

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

    style = style || {};

    return <div className={"avatar "+(className || "")} style={style}>
      <div className={"round-avatar"} style={styleBgd}>
        <span className={'initials'} style={styleColor}>{initials}</span>
        <img src={user.avatar.replace(/s=60$/, "s=60&d=blank")} alt={user.email} className="gravatar"/>
        <div className={'avatar-fill'} style={styleFill}></div>
      </div>
      <div className="avatar-name bg-dark shadow-sm" style={styleColor}>{name(this.props.user)}</div>
    </div>;
  }
}