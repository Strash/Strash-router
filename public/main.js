// COMPONENTS
import Menu from './components/menu.js';
import Href from './components/href.js';
import Main from './components/main.js';
import Projects from './components/projects.js';
import Subproject from './components/subproject.js';
import About from './components/about.js';
import Default from './components/404.js';

window.router = new STRouter([
  {
    path: '/',
    components: {
      menu: Menu,
      href: Href,
      pageMain: Main
    }
  },
  {
    path: '/projects',
    components: {
      menu: Menu,
      href: Href,
      pageProj: Projects
    }
  },
  {
    path: '/projects/:placeholder',
    components: {
      menu: Menu,
      href: Href,
      pageSub: Subproject
    }
  },
  {
    path: '/about',
    components: {
      menu: Menu,
      href: Href,
      pageAbout: About
    }
  },
  // 404
  {
    path: '*',
    components: {
      menu: Menu,
      href: Href,
      pageDef: Default
    }
  }
], {
  mode: 'development',
  titlePrefix: 'STR | '
});