import Subproject from "./subproject.js";

const Projects = {
  props: {

  },
  children: {
    subproject: Subproject
  },
  template: `
  <h2>Projects Page</h2>
  <a href="${location.origin}/projects/subproject">SubProject Link</a>
  <router-view class="subproject"></router-view>
  `
};

export default Projects;