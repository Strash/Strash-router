import Subproject from "./subproject.js";

const Projects = {
  children: {
    subproject: Subproject
  },
  template: `
  <h2>Projects Page</h2>
  <a href="${location.origin}/projects/subproject">SubProject Link</a>
  <router-view name="subproject"></router-view>
  `
};

export default Projects;