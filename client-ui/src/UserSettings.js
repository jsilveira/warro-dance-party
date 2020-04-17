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
      showMenu : false,
      user : {
        email : "fdsa",
        id : "123456789",
        avatar :
            "https://s.gravatar.com/avatar/da71b39fd9972ecff794c1eb837058a2?s=60&d=blank",
      }
    };
    this.showMenu = this.showMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
  }

  showMenu(event) {
    event.preventDefault();

    this.setState(
        {showMenu : true},
        () => { document.addEventListener('click', this.closeMenu); });
  }

  closeMenu() {
    this.setState(
        {showMenu : false},
        () => { document.removeEventListener('click', this.closeMenu); });
  }

  changeName(event) {
    event.preventDefault();
    //
  }

  changeAvatar(event) {
    event.preventDefault();
    getImageFile()
        .then(getFileDataURL)
        .then(url => { return cropImage(url, 40, 40); })
        .then(url => {
          const user = this.state.user;
          user.avatar = url;
          this.setState({user});
        });
  }

  render() {
    return (
      <div className="UserSettings">
        <a href="#" onClick={this.showMenu}>
          <Avatar user={
      this.state.user} />
        </a>
        {this.state.showMenu ? (
          <div className="menu">
            <ul>
              {/* TODO <li><a href="#" onClick={this.changeName.bind(this)}>Cambiar nombre</a></li> */}
              <li><a href="#" onClick={this.changeAvatar.bind(this)}>Cambiar foto</a></li>
            </ul>
          </div>
        ) : null}
      </div>
    );
  }
}
