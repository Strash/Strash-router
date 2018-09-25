let Page = () => {
  return {
    template: `
    <div
    style="padding: 10px 20px; background-color: #999;">
      ${location.pathname}
    </div>
    {{addLink}}`,
    methods: {
      checkRoute () {
        if (/projects/.test(location.pathname)) return true;
        else return false;
      },
      addLink () {
        if (this.checkRoute())
        return `<div style="margin:50px 0; padding: 50px; background-color:grey; height:150px; color: white;">Project</li>`;
        else return '';
      }
    }
  };
};

export default Page;