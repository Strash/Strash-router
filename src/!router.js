window.STRouter = (() => {
  /**
   * Class Router.
   *
   * @class Router
   */
  class Router {
    constructor(routes = undefined) {
      this.routes = routes;
      this.defaultRoute = this.getDefaultRoute;
      this.links = [];
      this.componentNames = new Set();

      this.__setGlobalAliases__();
      this._detectMountPlace_();

      this.addListener({
        target: document,
        type: 'click',
        listener: this.__clickWatching__.bind(this),
        name: '_routerClickWatcher'
      });
      this.addListener({
        target: window,
        type: 'popstate',
        listener: this.render.bind(this),
        name: '_routerHistoryWatcher'
      });
    }

    /**
     * Getting router version.
     *
     * @readonly
     * @memberof Router
     */
    get version() {
      return '1.0.4';
    }

    /**
     * Setting global aliases.
     *
     * @memberof Router
     */
    __setGlobalAliases__() {
      window.$routes = this.routes;
      window.$location = this.getLocation;
    }

    /**
     * Compare paths and return a suitable router.
     *
     * @returns {Object}
     * @memberof Router
     */
    __comparePaths__() {
      let componentArr = '';
      const locationArr = this.getLocation.path.split('/');
      let component;
      // если в пути последний символ '/', то при сплите в массив добавляется пустая строка и тут она убирается
      // (locationArr.length > 2) нужно потому что массив для главной страницы будет ['',''] и если в нем обрезать последний элемент, то главная никогда не откроется
      if (locationArr.length > 2 && locationArr[locationArr.length - 1] == '') locationArr.pop();
      // достаем подходящий компонент
      this.routes.forEach(item => {
        let compareArr = [];
        componentArr = item.path.split('/');
        if (componentArr.length == locationArr.length) {
          componentArr.forEach((str, i) => {
            if (str.indexOf(':') == -1 && str === locationArr[i]) compareArr.push(1);
            else if (str.indexOf(':') == -1 && str !== locationArr[i] && locationArr[i] == '') compareArr.push(0);
            else if (str.indexOf(':') > -1) compareArr.push(1);
            else compareArr.push(0);
          });
          if (!compareArr.some(num => num == 0)) component = item;
        }
      });
      return component;
    }

    /**
     * Checking for the type of nested component.
     *
     * @param {Object} component Component object
     * @returns {Object} Component object
     * @memberof Router
     */
    __typeOfComponent__(component) {
      switch (typeof component) {
        case 'function':
          return component();
        case 'object':
          return component;
      }
    }

    __cleanListeners() {
      // если тип без слушателей, то удаляем его
      Object.keys(this.listeners).forEach(item => {
        if (this.listeners[item].length == 0) delete this.listeners[item];
      });
      // если объект слушателей пуст, то удаляем его и закругляемся
      if (Object.keys(this.listeners).length == 0) {
        delete this.listeners;
        return;
      }
    }

    /**
     * RUN BEFOREMOUNT IN CHILDREN
     *
     * @param {Object} parent
     * @returns {Array} Promises
     * @memberof Router
     */
    __runChildrenBeforeMount(parent) {
      let map = [];
      const recursion = parent => {
        Object.keys(parent.children).forEach(name => {
          const child = this.__typeOfComponent__(parent.children[name]);
          if ('beforeMount' in child) map.push(child.beforeMount());
          if ('children' in child) recursion(child);
        });
      };
      recursion(parent);
      return map.filter(item => item !== undefined);
    }

    /**
     * Tracking click on links.
     *
     * @param {Object} e
     * @memberof Router
     */
    __clickWatching__(e) {
      if (!e.target.hasAttribute('download')) {
        if (e.target.tagName !== 'A') {
          let parent = e.target.parentNode;
          while (parent.tagName !== 'A') {
            parent = parent.parentNode;
            if (parent == null || !parent.tagName) return;
          }
          if (parent.tagName == 'A' && RegExp(location.origin).test(parent.href)) {
            e.preventDefault();
            this.links.push(parent.href);
            history.pushState('', '', parent.href);
            this.render();
          }
        } else {
          if (RegExp(location.origin).test(e.target.href)) {
            e.preventDefault();
            this.links.push(e.target.href);
            history.pushState('', '', e.target.href);
            this.render();
          }
        }
      }
    }

    /**
     * Checking the locations for mounting components.
     *
     * @memberof Router
     */
    _detectMountPlace_() {
      if (document.getElementsByTagName('router-view').length == 0) {
        const error = new Error('STR-Warn: Не установлены точки монтирования. Missing "<router-view>" tag.');
        console.warn(error.message);
      }
    }

    /**
     * router-view -> div
     *
     * @memberof Router
     */
    _setMountPlace_() {
      let routerViews = document.getElementsByTagName('router-view');
      if (routerViews.length == 0) return;
      for (let i = 0; i < routerViews.length; i++) {
        this.componentNames.add(routerViews[i].getAttribute('name'));
        let div = document.createElement('div');
        div.setAttribute('name', `component-${routerViews[i].getAttribute('name')}`);
        routerViews[i].insertAdjacentElement('beforebegin', div);
      }
      const removeRouterView = () => {
        for (let i = 0; i < document.getElementsByTagName('router-view').length; i++) {
          document.getElementsByTagName('router-view')[i].remove();
        }
        if (document.getElementsByTagName('router-view').length > 0) removeRouterView();
      };
      removeRouterView();
    }

    /**
     * Cleaning divs before mounting.
     *
     * @memberof Router
     */
    _clearMountPlace_() {
      this.componentNames.forEach(name => {
        document.getElementsByName(`component-${name}`).forEach(node => node.innerHTML = '');
      });
    }

    /**
     * CHILDREN FUNCTION
     *
     * @param {Object} parentComponent
     * @returns {String} template
     * @memberof Router
     */
    _renderChildComponent_(parentComponent) {
      let parentTemplate = parentComponent.template;
      return Promise.resolve()
        .then(() => {
          const __main = parent => {
            if ('children' in parent) {
              const childNames = Object.keys(parent.children);
              childNames.forEach(name => {
                const reg = `<router.*?\s*name[^\w]*${name}[^\w]*><\/[^\w]*router.*?>`;
                const child = this.__typeOfComponent__(parent.children[name]);
                let template = child.template;
                if ('methods' in child) template = this._runMethods_(child);
                if (RegExp(reg, 'g').test(parentTemplate)) {
                  const regExec = RegExp(reg, 'g');
                  let routerView, views = [];
                  while ((routerView = regExec.exec(parentTemplate)) !== null) views = views.concat(routerView);
                  // возможно покажется, что реплейсинг можно засунуть в while, но не стоит. от этого сильно страдает производительность
                  views.forEach(view => parentTemplate = parentTemplate.replace(RegExp(view), template));
                }
                if ('mounted' in child) child.mounted();
                if ('children' in child) __main(child);
              });
            }
          };

          /* jshint ignore:start */
          const __asyncFun = async () => {
            await Promise.all(this.__runChildrenBeforeMount(parentComponent));
            __main(parentComponent);
            return parentTemplate;
          };
          /* jshint ignore:end */
          return __asyncFun();
        });
    }

    /**
     * RUN METHODS
     *
     * @param {Object} component
     * @param {String} temp template
     * @returns {String} template
     * @memberof Router
     */
    _runMethods_(component, temp) {
      const reg = /[^{]+(?=}})/ig;
      let template = temp || component.template;
      const methods = component.methods;
      let strMethods = [];
      // тут все ок, ничего менять не нужно
      let tempMethod;
      while ((tempMethod = reg.exec(template)) !== null) {
        strMethods = strMethods.concat(tempMethod);
      }
      // возможно покажется, что реплейсинг можно засунуть в while, но не стоит. от этого сильно страдает производительность
      strMethods.forEach(method => {
        if (method && methods[method]) template = template.replace(RegExp(`{{${method}}}`), methods[method]());
      });
      return template;
    }


    /**
     * SET ACTIVE LINK
     *
     * @memberof Router
     */
    _setActiveLinks_() {
      const links = document.getElementsByTagName('a');
      setTimeout(() => {
        Object.keys(links).forEach(link => {
          if (document.getElementsByTagName('a')[link].href == location.href) {
            document.getElementsByTagName('a')[link].classList.add('router-link-active');
          } else document.getElementsByTagName('a')[link].classList.remove('router-link-active');
        });
      }, 100);
    }

    /**
     * Getting location.
     *
     * @readonly
     * @memberof Router
     */
    get getLocation() {
      return {
        hash: location.hash,
        href: location.href,
        origin: location.origin,
        path: location.pathname,
        search: location.search,
      };
    }

    /**
     * Getting default component.
     *
     * @readonly
     * @memberof Router
     */
    get getDefaultRoute() {
      let defaultRoute;
      if (this.routes) defaultRoute = this.routes.find(item => item.path == '*');
      if (!defaultRoute) {
        const error = new Error('STR-Warn: Не задан маршрут по-умолчанию. Default route is not defined.');
        console.warn(error.message);
      }
      return defaultRoute;
    }

    /**
     * Returning components corresponding to the current path.
     *
     * @returns
     * @memberof Router
     */
    getRouteComponents() {
      if (this.routes) {
        const components = this.__comparePaths__();
        return components ? components : this.defaultRoute;
      } else {
        const error = new Error('STR-Warn: Не заданы маршруты. Routes are not defined.');
        console.warn(error.message);
        return;
      }
    }

    /**
     * Adding listeners to the roster and installing the listener.
     *
     * @param {Object} {
     * target   {object HTMLDocument} — required object type;
     * type     {String} — required event type;
     * listener {Function} — required callback function;
     * options  {Object} — an optional object that defines the characteristics of an object listening for an event;
     * name     {String} — required name that identifies the listener's name in the list of listeners;
     * once     {Boolean} — lifetime of the listener. If true, when moving to another page, the listener is automatically deleted from the listened object, as well as from the list of listeners
     * }
     * @memberof Router
     */
    addListener({
      target,
      type,
      listener,
      options,
      name,
      once
    }) {
      // TODO: пробросить сообщение о том, что не все аргументы заданы
      if (Object.keys(arguments[0]).length < 4) return;
      if (!('listeners' in this)) this.listeners = {};
      if (!(type in this.listeners)) this.listeners[type] = [];
      this.listeners[type].push({
        target,
        type,
        listener,
        options: options ? options : undefined,
        name,
        once: once || false
      });
      target.addEventListener(type, listener, options ? options : undefined);
    }

    /**
     * Delete listeners and links to them in automatic mode.
     *
     * @description
     * If there are no arguments, all listeners with the once: true flag will be deleted.
     * If the argument is {target}, all listeners of the listening object will be deleted.
     * if the argument is {type}, all listeners of this type will be deleted.
     * if the arguments is {target, type}, all listeners of this type for a particular object will be deleted.
     * If the argument is {name} or {target, type, name}, all listeners with this name will be deleted. You can also pass only the 'name' as a string.
     *
     * @param {(Object|String)} arg {Object} — {Function} target, {String} type, {String} name; {String} — listner's name
     * @memberof Router
     */
    removeListeners(arg) {
      // TODO: прокинуть предупреждение, что не прослушиваются никакие объекты и реестр пуст и в каждое условие добавить сообщения
      this.__cleanListeners();
      // если реестра нет или в нем не никого не зарегистрировано, то закругляемся
      if (!this.listeners) return;

      // 0
      // очистка всех once листнеров без аргументов
      if (arguments.length == 0) {
        Object.keys(this.listeners).forEach(listenerType => {
          this.listeners[listenerType].forEach(item => {
            if (item.once == true) item.target.removeEventListener(item.type, item.listener, item.options);
          });
          this.listeners[listenerType] = this.listeners[listenerType].filter(item => item.once == false);
        });
        this.__cleanListeners();
        return;

        // 1
        // если передан аргумент
      } else if (arguments.length == 1) {
        // если строка с именем слушателя
        if (typeof arg == 'string') {
          if (arg == '_routerClickWatcher' || arg == '_routerHistoryWatcher') return;
          Object.keys(this.listeners).forEach(listenerType => {
            this.listeners[listenerType].forEach(item => {
              if (item.name == arg) item.target.removeEventListener(item.type, item.listener, item.options);
            });
            this.listeners[listenerType] = this.listeners[listenerType].filter(item => item.name !== arg);
          });
          this.__cleanListeners();
          return;
          // если объект
        } else if (typeof arg == 'object') {
          // если объект с именем слушателя
          // в этом условии будут приняты два варианта: когда только name и когда все три свойства
          if ('name' in arg) {
            if (arg.name == '_routerClickWatcher' || arg.name == '_routerHistoryWatcher') return;
            Object.keys(this.listeners).forEach(listenerType => {
              this.listeners[listenerType].forEach(item => {
                if (item.name == arg.name) item.target.removeEventListener(item.type, item.listener, item.options);
              });
              this.listeners[listenerType] = this.listeners[listenerType].filter(item => item.name !== arg);
            });
            this.__cleanListeners();
            return;
          }
          // если передан только тип прослушиваемого объекта
          else if ('target' in arg && Object.keys(arg).length == 1) {
            Object.keys(this.listeners).forEach(listenerType => {
              this.listeners[listenerType].forEach(item => {
                if (item.target == arg.target && item.name !== '_routerClickWatcher' ||
                    item.target == arg.target && item.name !== '_routerHistoryWatcher') {
                      item.target.removeEventListener(item.type, item.listener, item.options);
                }
              });
              // чистка реестра
              this.listeners[listenerType] = this.listeners[listenerType].filter(item => {
                if (item.target == arg.target && item.name == '_routerClickWatcher' ||
                    item.target == arg.target && item.name == '_routerHistoryWatcher') return item;
                else if (item.target !== arg.target) return item;
              });
            });
            this.__cleanListeners();
            return;
          }
          // если передан только тип прослушиваемого события
          else if ('type' in arg && Object.keys(arg).length == 1) {
            // проверка на наличие типа в реестре
            if (arg.type in this.listeners) {
              this.listeners[arg.type] = this.listeners[arg.type].filter(item => {
                // исключение из очистки служебных слушателей
                if (item.name == '_routerClickWatcher' || item.name == '_routerHistoryWatcher') return item;
                else item.target.removeEventListener(arg.type, item.listener, item.options);
              });
              // чистка реестра от типа
              this.__cleanListeners();
              return;
            }
          }
        }
      } else {
        // бросить исключение
        console.log('STRouter.removeListeners выбросил исключение');
      }
    }

    /**
     * Component rendering.
     *
     * @memberof Router
     */
    render() {
      this._setMountPlace_();
      const routeComponents = this.getRouteComponents();
      if (!routeComponents) return;
      // чистка
      this._clearMountPlace_();

      // удаление листнеров с предыдущих страниц
      this.removeListeners();

      // монтирование
      this.componentNames.forEach(name => {
        if (name in routeComponents.components) {
          // основная шина без beforeMount
          const __promise = component => {
            const __buss = (component, template) => {
              template = template || component.template;
              if ('methods' in component) template = this._runMethods_(component, template);
              document.getElementsByName(`component-${name}`).forEach(node => node.insertAdjacentHTML('beforeend', template));
              if ('mounted' in component) component.mounted();
              scrollTo(0, 0);
            };

            if ('children' in component) this._renderChildComponent_(component).then(res => __buss(component, res));
            else __buss(component);
          };

          const component = this.__typeOfComponent__(routeComponents.components[name]);

          // если есть beforeMount
          if ('beforeMount' in component) {
            const beforeMount = component.beforeMount();
            // если это промис
            if (beforeMount && beforeMount.toString() == '[object Promise]') {
              beforeMount.then(() => __promise(component));
              // если не промис
            } else __promise(component);
            // если нет beforeMount
          } else __promise(component);
        }
      });

      // установка класс для активных ссылок
      this._setActiveLinks_();
    }
  }

  Router.version = Router.prototype.version;
  Router.getLocation = Router.prototype.getLocation;

  return Router;
})();

// https://dev.to/ycmjason/building-a-simple-virtual-dom-from-scratch-3d05