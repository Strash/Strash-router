import Menu from './menu.js';
import Href from './href.js';

const Header = {
  template: `
  <div>
    <router-view name="menu"></router-view>
    <router-view name="href"></router-view>
  </div>`,
  children: {
    menu: Menu,
    href: Href
  }
};

export default Header;