// COMPONENTS
import Main from './components/main.js';
import Projects from './components/projects.js';
import Subproject from './components/subproject.js';
import About from './components/about.js';
import Default from './components/404.js';
import Header from './components/header.js';



window.router = new STRouter([
  {
    path: '/',
    components: {
      header: Header,
      pageMain: Main
    }
  },
  {
    path: '/projects',
    components: {
      header: Header,
      pageProj: Projects
    }
  },
  {
    path: '/projects/:placeholder',
    components: {
      header: Header,
      pageSub: Subproject
    }
  },
  {
    path: '/about',
    components: {
      header: Header,
      pageAbout: About
    }
  },
  // 404
  {
    path: '*',
    components: {
      header: Header,
      pageDef: Default
    }
  }
], {
  mode: 'development',
  titlePrefix: 'STR | '
});