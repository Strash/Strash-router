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
      page: Main
    }
  },
  {
    path: '/projects',
    components: {
      menu: Menu,
      href: Href,
      page: Projects
    }
  },
  {
    path: '/projects/:placeholder',
    components: {
      menu: Menu,
      href: Href,
      page: Subproject
    }
  },
  {
    path: '/about',
    components: {
      menu: Menu,
      href: Href,
      page: About
    }
  },
  // 404
  {
    path: '*',
    components: {
      menu: Menu,
      href: Href,
      page: Default
    }
  }
]);

router.render();