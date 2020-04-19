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
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
      const jpegURL = canvas.toDataURL('image/jpeg');
      resolve(jpegURL);
    };
    img.src = url;
  });
}

const TOOTLTIP_KEY_CHANGE_AVATAR = 'tooltipChangeAvatar';

export class UserSettings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showMenu: false,
      showMobileMenu: false,
    };

    this.showMenu = this.showMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
    this.showMobileMenu = this.showMobileMenu.bind(this);
    this.closeMobileMenu = this.closeMobileMenu.bind(this);
    this.onAuthenticated = this.onAuthenticated.bind(this);
    
    var newfeat = localStorage.getItem(TOOTLTIP_KEY_CHANGE_AVATAR);
    if (newfeat== null) {
      localStorage.setItem(TOOTLTIP_KEY_CHANGE_AVATAR, 1);
    } else {
      localStorage.setItem(TOOTLTIP_KEY_CHANGE_AVATAR, 0);
    }
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
    localStorage.setItem(TOOTLTIP_KEY_CHANGE_AVATAR, 0);
    this.setState({showMenu: false}, () => document.removeEventListener('click', this.closeMenu));
  }

  showMobileMenu(event) {
    event.preventDefault();

    this.setState({showMobileMenu: true}, () => document.addEventListener('click', this.closeMobileMenu));
  }

  closeMobileMenu() {
    localStorage.setItem(TOOTLTIP_KEY_CHANGE_AVATAR, 0);
    this.setState({showMobileMenu: false}, () => document.removeEventListener('click', this.closeMobileMenu));
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
      .then(url => {
        this.setState({uploading: true});
        return cropImage(url, 100, 100);
      })
      .then(async url => {
        const user = this.props.user;
        try {
          await client.service('users').update(user.id, {imageData: url});
          localStorage.setItem('avatarBase64Data', url);
        } catch(err) {
          console.error(err);
        }
        this.setState({uploading: false});
      });
  }

  render() {
    let user = this.props.user;

    let tooltipCambiaTufoto = <div className={this.state.showMenu ? 'new-stuff hide' : 'new-stuff'}>¡Ahora podés cambiar tu nombre y foto!</div>;

    return (user ? (
      <div className="UserSettings">
        <a href="#" onClick={this.showMenu} className={'menu-toggle'}>
          <Avatar user={user}/>
          {localStorage.getItem(TOOTLTIP_KEY_CHANGE_AVATAR) == 1 ? tooltipCambiaTufoto : null}
        </a>
        {this.state.showMenu ? (
          <div className="menu">
            <div className={'username text-uppercase'} style={{color: Avatar.getUserColor(user.id)}}>
              ¡Hola {user.email}!
            </div>

            <ul className={'text-uppercase'}>
              <li><a href="#" onClick={this.changeName.bind(this)}>Cambiar nombre <i className={'material-icons'}>chevron_right</i></a></li>
              <li><a href="#" onClick={this.changeAvatar.bind(this)}>Cambiar foto <i className={'material-icons'}>chevron_right</i></a></li>
            </ul>

            { this.state.uploading ? <div className={'mt-2 text-primary small text-center'}>Subiendo foto...</div> : null }
          </div>
        ) : null}

        <div className={'mobileNav'}>
          <a href="#" onClick={this.showMobileMenu} className={'menu-toggle-mobile'}><i className={"material-icons"}>more_vert</i></a>
          {this.state.showMobileMenu ? (
          <div className="menu">
            <div className={'username text-uppercase'} style={{color: Avatar.getUserColor(user.id)}}>
              ¡Hola {user.email}!
            </div>

            <ul className={'text-uppercase'}>
              <li><a href="#" onClick={this.changeName.bind(this)}>Cambiar nombre <i className={'material-icons'}>chevron_right</i></a></li>
              <li><a href="#" onClick={this.changeAvatar.bind(this)}>Cambiar foto <i className={'material-icons'}>chevron_right</i></a></li>
              <li className={'sep'}><a href="/agenda" target={'_blank'}>Ver agenda <i className={'material-icons'}>chevron_right</i></a></li>
            </ul>

            { this.state.uploading ? <div className={'mt-2 text-primary small text-center'}>Subiendo foto...</div> : null }
          </div>
        ) : null}
        </div>
      </div>
    ) : null);
  }
}
