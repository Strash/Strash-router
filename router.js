window.STRouter = (() => {
  /**
   * Class Router.
   *
   * @class Router
   */
  class Router {
    constructor(routes = undefined) {
      this.routes = routes;
      this.defaulRoute = this.getDefaulRoute;
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
     * Setting global aliases.
     *
     * @memberof Router
     */
    __setGlobalAliases__() {
      window.$routes = this.routes;
      window.$location = this.getLocation;
    }

    /**
     * Checking a component for the type of the current path.
     *
     * @param {(Object|Function)} route Route object
     * @param {String} componentName Component name
     * @returns {Object} Component object
     * @memberof Router
     */
    __typeOfRouteComponents__(route, componentName) {
      switch (typeof route.components[componentName]) {
        case 'function':
          return route.components[componentName]();
        case 'object':
          return route.components[componentName];
      }
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

    /**
     * Tracking click on links.
     *
     * @param {Object} e
     * @memberof Router
     */
    __clickWatching__(e) {
      if (e.target.tagName == 'A') {
        e.preventDefault();
        this.links.push(e.target.toString());
        history.pushState('', '', e.target.toString());
        this.render();
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
     * Execution of component methods.
     *
     * @param {Object} component Component object
     * @returns {String} Template string
     * @memberof Router
     */
    _runMethods_(component) {
      const reg = /[^{]+(?=}})/ig;
      let template = component.template;
      const methods = component.methods;
      let strMethods = [];
      // тут все ок, ничего менять не нужно
      let tempMethod;
      while ((tempMethod = reg.exec(template)) !== null) {
        strMethods = strMethods.concat(tempMethod);
      }
      if (strMethods !== null) {
        strMethods.forEach(method => {
          if (methods && methods[method]) template = template.replace(RegExp(`{{${method}}}`), methods[method]());
        });
      }
      return template;
    }

    /**
     * Getting router version.
     *
     * @readonly
     * @memberof Router
     */
    get version() {
      return '0.4.0-beta';
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
    get getDefaulRoute() {
      let defaulRoute;
      if (this.routes) defaulRoute = this.routes.find(item => item.path == '*');
      if (!defaulRoute) {
        const error = new Error('STR-Warn: Не задан маршрут по-умолчанию. Default route is not defined.');
        console.warn(error.message);
      }
      return defaulRoute;
    }

    /**
     * Returning components corresponding to the current path.
     *
     * @returns
     * @memberof Router
     */
    getRouteComponents() {
      if (this.routes) {
        let components = this.routes.find(item => item.path == this.getLocation.path);
        return components ? components : this.defaulRoute;
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
     * name     {String} — a mandatory name that identifies the listener's name in the list of listeners;
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
      // если реестра нет или в нем не никого не зарегистрировано, то закругляемся
      if (!this.listeners) return;
      // если тип без слушателей, то удаляем его
      Object.keys(this.listeners).forEach(item => {
        if (this.listeners[item].length == 0) delete this.listeners[item];
      });
      // если объект слушателей пуст, то удаляем его и закругляемся
      if (Object.keys(this.listeners).length == 0) {
        delete this.listeners;
        return;
      }

      // 0
      // очистка всех once листнеров без аргументов
      if (arguments.length == 0) {
        Object.keys(this.listeners).forEach(listenerType => {
          this.listeners[listenerType].forEach(item => {
            if (item.once == true) item.target.removeEventListener(item.event, item.listener, item.options);
          });
          this.listeners[listenerType] = this.listeners[listenerType].filter(item => item.once == false);
        });
        return;

        // 1
        // если передан аргумент
      } else if (arguments.length == 1) {
        // если строка с именем слушателя
        if (typeof arg == 'string') {
          Object.keys(this.listeners).forEach(listenerType => {
            this.listeners[listenerType].forEach(item => {
              if (item.name == arg) item.target.removeEventListener(item.type, item.listener, item.options);
            });
            this.listeners[listenerType] = this.listeners[listenerType].filter(item => item.name !== arg);
          });
          return;
          // если объект
        } else if (typeof arg == 'object') {
          let argLength = Object.keys(arg).length;
          // если объект с именем слушателя
          // в этом условии будут приняты два варианта: когда только name и когда все три свойства
          if ('name' in arg) {
            Object.keys(this.listeners).forEach(listenerType => {
              this.listeners[listenerType].forEach(item => {
                if (item.name == arg.name) item.target.removeEventListener(item.type, item.listener, item.options);
              });
              this.listeners[listenerType] = this.listeners[listenerType].filter(item => item.name !== arg);
            });
            return;
          }
          // если передан только тип прослушиваемого объекта
          else if ('target' in arg && Object.keys(arg).length == 1) {
            Object.keys(this.listeners).forEach(listenerType => {
              this.listeners[listenerType].forEach(item => {
                if (item.target == target) target.removeEventListener(item.type, item.listener, item.options);
              });
              // чистка реестра
              this.listeners[listenerType] = this.listeners[listenerType].filter(item => item.target !== target);
            });
            return;
          }
          // если передан только тип прослушиваемого события
          else if ('type' in arg && Object.keys(arg).length == 1) {
            // проверка на наличие типа в реестре
            if (type in this.listeners) {
              this.listeners[type].forEach(item => item.target.removeEventListener(type, item.listener, item.options));
              // чистка реестра от типа
              delete this.listeners[type];
              return;
            }
          }
        }
      } else {
        // бросить исключение
        console.log('removeListeners выбросил исключение');
      }
    }

    /**
     * Insertion a component inside the parent component.
     *
     * @param {(Object|Function)} component Component object
     * @returns {String} Template string
     * @memberof Router
     */
    insertComponent(component) {
      if (!component) return;
      return this._runMethods_(this.__typeOfComponent__(component));
    }

    /**
     * Component rendering.
     *
     * @memberof Router
     */
    render() {
      this._setMountPlace_();
      if (!this.getRouteComponents()) return;
      // чистка
      this._clearMountPlace_();
      let currentRoute = this.getRouteComponents();

      // вспомогательная функция монтирования
      let __mountFun = name => {
        let template = this._runMethods_(this.__typeOfRouteComponents__(currentRoute, name));
        document.getElementsByName(`component-${name}`).forEach(node => node.insertAdjacentHTML('beforeend', template));
      };

      // удаление листнеров с предыдущих страниц
      this.removeListeners();

      // монтирование
      this.componentNames.forEach(name => {
        if (name in currentRoute.components) {
          Promise.resolve(name)
            .then(name => {
              // если есть beforeMount, то сначала его выполняем, потом методы компонента, потом монтирование
              if ('beforeMount' in this.__typeOfComponent__(currentRoute.components[name])) {
                const beforeMount = this.__typeOfComponent__(currentRoute.components[name]).beforeMount();
                // в beforeMount можно вернуть промис, или что-то другое, или вообще не возвращать
                if (beforeMount && beforeMount.toString() == '[object Promise]') beforeMount.then(() => __mountFun(name));
                else __mountFun(name);
              } else __mountFun(name);
            })
            .then(() => {
              if ('mounted' in this.__typeOfComponent__(currentRoute.components[name])) {
                this.__typeOfComponent__(currentRoute.components[name]).mounted();
              }
            });
        }
      });
    }
  }

  Router.version           = Router.prototype.version;
  Router.getLocation       = Router.prototype.getLocation;
  Router.insertComponent   = Router.prototype.insertComponent;
  Router._runMethods       = Router.prototype._runMethods_;
  Router.__typeOfComponent = Router.prototype.__typeOfComponent__;

  return Router;
})();