let Page = () => {
  return {
    template: `
    <div
    style="padding: 10px 20px; background-color: #999;">
      ${location.pathname}
    </div>`
  };
};

export default Page;