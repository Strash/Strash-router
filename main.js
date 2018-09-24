// ROUTER
import Router from './router.js';

// COMPONENTS
import Page from './components/page.js';
import Menu from './components/menu.js';

const router = new Router([
  {
    path: '/',
    components: {
      menu: Menu,
      page: Page
    }
  },
  {
    path: '/about',
    components: {
      menu: Menu,
      page: Page
    }
  },
  // 404
  {
    path: 'missingPage',
    components: {
      menu: Menu,
      page: Page
    }
  }
]);

window.router = router;