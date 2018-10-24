const Href = {
  template: `<div
  style="padding: 10px 20px; background-color: #999;">
    Address: {{getLocation}}
  </div>`,
  methods: {
    getLocation () {
      return location.href;
    }
  }
};

export default Href;