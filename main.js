// ROUTER
import Router from './router.js';

// COMPONENTS
import Menu from './components/menu.js';
import Page from './components/page.js';

window.router = new Router([
  {
    path: '/',
    components: {
      menu: Menu
    }
  },
  {
    path: '/about',
    components: {
      menu: Menu,
      page: Page
    }
  },
  {
    path: '/projects',
    components: {
      menu: Menu,
      page: Page
    }
  },
  // 404
  {
    path: '*',
    components: {
      menu: Menu,
      page: Page
    }
  }
]);