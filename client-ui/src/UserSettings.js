import "./UserSettings.less";
import React, {Component} from "react";
import Avatar from "./Avatar.js";
import client from "./feathers.js"

function getImageFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.allowdirs = false;
    input.accept = 'image/*';
    input.onchange = event => {
      const file = input.files[0];
      resolve(file);
    };
    input.click();
  });
}

function getFileDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataURL = reader.result;
      resolve(dataURL);
    };
    reader.readAsDataURL(file);
  });
}

function cropImage(url, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const widthScale = width / img.width;
      const heightScale = height / img.height;
      const scale = Math.max(widthScale, heightScale);
      const sWidth = width / scale;
      const sHeight = height / scale;
      const sx = (img.width - sWidth) / 2;
      const sy = (img.height - sHeight) / 2;
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
      const jpegURL = canvas.toDataURL('image/jpeg');
      resolve(jpegURL);
    };
    img.src = url;
  });
}

export class UserSettings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showMenu: false,
    };

    this.showMenu = this.showMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
    this.onAuthenticated = this.onAuthenticated.bind(this);
  }

  onAuthenticated({user}) {
    this.setState({user});
  }

  componentDidMount() {
    client.on("authenticated", this.onAuthenticated);
  }

  componentWillUnmount() {
    client.off("authenticated", this.onAuthenticated);
  }

  showMenu(event) {
    event.preventDefault();

    this.setState({showMenu: true}, () => document.addEventListener('click', this.closeMenu));
  }

  closeMenu() {
    this.setState({showMenu: false}, () => document.removeEventListener('click', this.closeMenu));
  }

  async changeName(event) {
    event.preventDefault();

    let user = this.props.user;
    let newName = prompt("Modificá tu nombre", user.email);
    if (newName && newName !== user.email) {
      await client.service('users').update(user.id, {email: newName});
      localStorage.setItem('email', newName);
    }
  }

  changeAvatar(event) {
    event.preventDefault();

    getImageFile()
      .then(getFileDataURL)
      .then(url => cropImage(url, 60, 60))
      .then(async url => {
        const user = this.props.user;
        await client.service('users').update(user.id, {imageData: url});
        localStorage.setItem('avatarBase64Data', url);
      });
  }

  render() {
    let user = this.props.user;

    return (user ? (
      <div className="UserSettings">
        <a href="#" onClick={this.showMenu}>
          <Avatar user={user}/>
        </a>
        {this.state.showMenu ? (
          <div className="menu text-center">
            <div className={'mx-3 my-1'} style={{color: Avatar.getUserColor(user.id)}}>
              {user.email}
            </div>
            <ul>
              <li><a href="#" onClick={this.changeName.bind(this)}>Cambiar nombre...</a></li>
              <li><a href="#" onClick={this.changeAvatar.bind(this)}>Cambiar foto...</a></li>
            </ul>
          </div>
        ) : null}
      </div>
    ) : null);
  }
}
