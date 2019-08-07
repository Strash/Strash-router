// TODO: добавить возможность пробрасывать в дочерние компоненты данные через атрибут подключенного потомка или как-то еще
// TODO: виртуальный DOM
// TODO: добавить data в корень компонента так, чтобы он был виден из любого места, хоть из корня, хоть из методов и т.д.
// TODO: убрать обязательное присутствие дефолтового пути

/**
 * DEPRECATED
 * - __setGlobalAliases__
 *    - window.$routes
 *    - window.$location
 * - __cleanListeners
 * - _detectMountPlace_
 * - __clickWatching__
 */

/**
 * NEW
 * - добавлены методы отоборажения сообщений в консоли для разных случаев;
 * - появилась возможность задать объект конфигурации:
 *    - режим продакшена и разработки. В режиме продакшена в консоли отображаются только ошибки,
 *    - постоянные для всех страниц префикс и суфикс заголовка страницы
 * - добавлен сеттер location. Теперь можно пушить переходы на другие пути с добавлением тайтла и объектом нагрузки;
 * - в объект location только для чтения добавлено свойство title - тайтл страницы;
 * - при добавлении слушателя, если не указан тип слушателя, то по-дефолту будет 'click';
 * - убраны глобавльные алиасы для window.$routes и window.$location;
 * - __cleanListeners переименован в __clear и убран внутрь метода removeListeners;
 * - _detectMountPlace_ переименован в isRouterViewTagExist и вынесен из класса;
 * - добавлена дополнительная проверка наличия атрибута name у тэга router-view функцией hasRouterViewNameAttribute;
 * - __clickWatching__ переименован в __clickWatching;
 * - _setMountPlace_ переименован в _setMountPlace;
 * - первичный рендеринг теперь осуществляется при инициализации роутера и не нужно его запускать дополнительно после создания экземпляра роутера;
 * - некоторые методы вынесены в скоуп IIFE. Конфиг хранится там же;
 * - для компонентов выделен отдельный класс;
 *
 * - рефакторинг;
 */


window.STRouter = (function () {
  // GLOBAL CONFIG
  let CONFIG;

  // Консольные сообщения
  function info(message) {
    console.info(`STR-Info: ${message}`);
  }
  function warn(message) {
    console.warn(`STR-Warn: ${message}`);
  }

  // Проверка режима
  function isDevMode() {
    if (CONFIG.mode == 'development') return true;
    else return false;
  }

  // Проверка точек монтирования
  function isRouterViewTagExist() {
    if (document.getElementsByTagName('router-view').length == 0) {
      if (isDevMode()) warn('Не установлены точки монтирования. Добавьте в разметку тег <router-view name="my-router"/>.');
      return false;
    } else return true;
  }

  // Проверка наличия атрибута name у точки монтирования
  function hasRouterViewNameAttribute() {
    for (let i = 0; i < document.getElementsByTagName('router-view').length; i++) {
      if (document.getElementsByTagName('router-view')[i].hasAttribute('name') == false) {
        if (isDevMode()) warn('Тэг router-view должен содержать атрибут name с названием. Например, <router-view name="my-router"/>');
        return false;
      } else return true;
    }
  }

  function collectComponents(routes) {
    if (Array.isArray(routes)) routes.forEach(r => Object.keys(r.components).forEach(n => this.componentNames.add(n)));
    this.componentNames.forEach(c => {
      // console.log(c);
      this.components[c] = '';
    });
    // console.log(this.components);
  }




  // Класс компонента
  class STRComponent {
    constructor() {}


  }

  window.STRComponent = STRComponent;





  // Класс роутера
  class Router {
    constructor(routes, config) {
      CONFIG = {
        mode: config.mode || 'production',
        titlePrefix: config.titlePrefix || '',
        titlePostfix: config.titlePostfix || ''
      };
      this.listeners = Object.create(null); // реестр слушателей
      this.componentNames = new Set(); // набор уникальных имен компонентов
      this.components = Object.create(null); // объект компонентов

      // TODO: в this.routes оставить только пути и названия компонентов для этого пути, а сами компоненты по одной штуке сохранить в this.components
      document.title = CONFIG.titlePrefix + document.title + CONFIG.titlePostfix; // установка татла страницы
      this.routes = routes; // пути
      this.links = [];
      // this.defaultRoute = this.getDefaultRoute;

      // слушатель нажатия по ссылкам
      this.addListener({
        target: document,
        listener: this.__clickWatching.bind(this),
        name: '_routerClickWatcher'
      });
      // слушатель перемещения по истории браузера кнопками "назад" / "вперед"
      this.addListener({
        target: window,
        type: 'popstate',
        listener: this.render.bind(this),
        name: '_routerHistoryWatcher'
      });

      this.render();
      collectComponents.bind(this)(routes);
    }

    // Version
    get version() {
      return '2.0.0';
    }

    // Getting location
    get location() {
      return {
        hash: location.hash,
        href: location.href,
        origin: location.origin,
        path: location.pathname,
        search: location.search,
        title: document.title
      };
    }

    // Setting location
    set location({
      data = Object.create(null),
      title,
      url = '/'
    }) {
      let newTitle = title ? CONFIG.titlePrefix + title + CONFIG.titlePostfix : document.title;
      this.links.push(url);
      history.pushState(data, newTitle, url);
      document.title = newTitle;
    }

    /**
     * Слежение за переходами по страницам.
     *
     * @param {Object} e — объект события
     */
    __clickWatching(e) {
      const __setRoute = (url, title) => {
        e.preventDefault();
        this.location = {
          url,
          title
        };
        this.render();
      };

      if (!e.target.hasAttribute('download')) {
        let parent;
        if (e.target.tagName !== 'A') {
          parent = e.target.parentNode;
          while (parent.tagName !== 'A') {
            parent = parent.parentNode;
            if (parent == null || !parent.tagName) return;
          }
        } else parent = e.target;
        if (RegExp(this.location.origin).test(parent.href) && parent.hasAttribute('target') && parent.getAttribute('target') !== '_blank' ||
          RegExp(this.location.origin).test(parent.href) && !parent.hasAttribute('target')) __setRoute(parent.href);
        else return;
      }
    }

    /**
     * Установка слушателей и добавление ссылок на них в роутер
     *
     * @param {Object} {
     * @requires target   {object HTMLDocument} — цель слушателя;
     * @requires type     {String} — тип события;
     * @requires listener {Function} — callback;
     * @requires name     {String} — уникальное имя слушателя. Для разных типов слушателя допустимы одинаковые имена;
     * @optional options  {Object} — объект характеристик события;
     * @optionsl once     {Boolean} — срок слушателя. Если true, то при переходе на другую страницу слушатель автоматически удаляется
     * }
     */
    addListener({
      target,
      type,
      listener,
      name,
      options,
      once
    }) {
      try {
        let args = Object.keys(arguments[0]).sort().join('');
        if (!(/listenernametarget/.test(args))) {
          throw Error('В аргументе слушателя не хватает обязательных свойств: target | listener | name');
        }
        if (type && !(type in this.listeners)) this.listeners[type] = [];
        else if (!type && !('click' in this.listeners)) this.listeners.click = [];
        let opt = Object.create(null);
        opt.target = target;
        opt.type = type ? type : 'click';
        opt.listener = listener;
        opt.name = name;
        opt.options = options || undefined;
        opt.once = once || false;

        this.listeners[opt.type].push(opt);
        target.addEventListener(opt.type, listener, options);
      } catch (e) {
        console.error(e);
      }
    }

    /**
     * Удаление слушателей и ссылок на них в автоматическом режиме
     *
     * @description
     * - Если нет аргументов, все слушатели со свойством once:true будут удалены.
     * - Если аргумент {target}, все слушатели этой цели будут удалены.
     * - Если аргументы {type}, все слушатели этого типа будут удалены.
     * - Если аргументы {target, type}, все слушатели этого типа у определенной цели будут удалены.
     * - Если аргумент 'name' | {name} | {target, type, name}, все слушатели с таким именем будут удалены. Предполагается, что имя уникально в рамках типа слушателя.
     *
     * @param {(Object|String)} arg {Object|String} — {...target: node, ...type: string, ...name: string | object}
     */
    removeListeners(arg) {
      /* Удаление слушателей */
      const __clean = (callback, filter) => {
        Object.keys(this.listeners).forEach(type => {
          this.listeners[type].forEach(item => callback(item));
          filter(type);
          if (this.listeners[type].length == 0) delete this.listeners[type];
        });
      };
      try {
        // Очистка реестра слушателей от пустых директорий.
        Object.keys(this.listeners).forEach(type => {
          if (this.listeners[type].length == 0) delete this.listeners[type];
        });
        // если в реестре не зарегистрировано слушателей, то выходим
        if (Object.keys(this.listeners).length == 0) {
          warn('Нет активных слушателей.');
          return;
        }

        // 0 аргументов
        // очистка всех once листнеров без аргументов
        if (arguments.length == 0) {
          __clean(item => {
            if (item.once == true) item.target.removeEventListener(item.type, item.listener, item.options);
          }, type => this.listeners[type] = this.listeners[type].filter(f => f.once == false));
          return;

          // 1
          // если передан аргумент
        } else if (arguments.length == 1) {
          // если строка с именем слушателя
          if (typeof arg == 'string') {
            if (arg == '_routerClickWatcher' || arg == '_routerHistoryWatcher') return;
            __clean(item => {
              if (item.name == arg) item.target.removeEventListener(item.type, item.listener, item.options);
            }, type => this.listeners[type] = this.listeners[type].filter(f => f.name !== arg));
            return;
            // если объект
          } else if (typeof arg == 'object') {
            // если объект с именем слушателя
            // в этом условии будут приняты два варианта: когда только name и когда все три свойства
            if ('name' in arg) {
              if (arg.name == '_routerClickWatcher' || arg.name == '_routerHistoryWatcher') return;
              __clean(item => {
                if (item.name == arg.name) item.target.removeEventListener(item.type, item.listener, item.options);
              }, type => this.listeners[type] = this.listeners[type].filter(f => f.name !== arg));
              return;
            }
            // если передан только тип прослушиваемого объекта
            else if ('target' in arg && Object.keys(arg).length == 1) {
              __clean(item => {
                if (item.target == arg.target && item.name !== '_routerClickWatcher' ||
                  item.target == arg.target && item.name !== '_routerHistoryWatcher') {
                  item.target.removeEventListener(item.type, item.listener, item.options);
                }
              }, type => {
                this.listeners[type] = this.listeners[type].filter(f => {
                  if (f.target == arg.target && f.name == '_routerClickWatcher' ||
                    f.target == arg.target && f.name == '_routerHistoryWatcher') return f;
                  else if (f.target !== arg.target) return f;
                });
              });
              return;
            }
            // если передан только тип прослушиваемого события
            else if ('type' in arg && Object.keys(arg).length == 1) {
              // проверка на наличие типа в реестре
              if (arg.type in this.listeners) {
                this.listeners[arg.type] = this.listeners[arg.type].filter(f => {
                  // исключение из очистки служебных слушателей
                  if (f.name == '_routerClickWatcher' || f.name == '_routerHistoryWatcher') return f;
                  else f.target.removeEventListener(arg.type, f.listener, f.options);
                });
                // Очистка реестра слушателей от пустых директорий.
                Object.keys(this.listeners).forEach(type => {
                  if (this.listeners[type].length == 0) delete this.listeners[type];
                });
                return;
              }
            }
          }
        } else throw Error('STRouter.removeListeners exeption. Вероятно, заданы неверные аргументы или ошибка неизвестна.');
      } catch (e) {
        console.error(e);
      }
    }

    // Замена тэгов router-view на div и добавление их в компоненты
    _setMountPlace() {
      let routerViews = document.getElementsByTagName('router-view');
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
        // if (document.getElementsByTagName('router-view').length > 0) removeRouterView();
      };
      removeRouterView();
    }

    // Component rendering
    render() {
      if (!isRouterViewTagExist() || !hasRouterViewNameAttribute()) return;
      // this._setMountPlace();
      // const routeComponents = this.getRouteComponents();
      // if (!routeComponents) return;
      // // чистка
      // this._clearMountPlace_();

      // // удаление листнеров с предыдущих страниц
      // this.removeListeners();

      // // монтирование
      // this.componentNames.forEach(name => {
      //   if (name in routeComponents.components) {
      //     // основная шина без beforeMount
      //     const __promise = component => {
      //       const __buss = (component, template) => {
      //         template = template || component.template;
      //         if ('methods' in component) template = this._runMethods_(component, template);
      //         document.getElementsByName(`component-${name}`).forEach(node => node.insertAdjacentHTML('beforeend', template));
      //         if ('mounted' in component) component.mounted();
      //         scrollTo(0, 0);
      //       };

      //       if ('children' in component) this._renderChildComponent_(component).then(res => __buss(component, res));
      //       else __buss(component);
      //     };

      //     const component = this.__typeOfComponent__(routeComponents.components[name]);

      //     // если есть beforeMount
      //     if ('beforeMount' in component) {
      //       const beforeMount = component.beforeMount();
      //       // если это промис
      //       if (beforeMount && beforeMount.toString() == '[object Promise]') {
      //         beforeMount.then(() => __promise(component));
      //         // если не промис
      //       } else __promise(component);
      //       // если нет beforeMount
      //     } else __promise(component);
      //   }
      // });

      // // установка класс для активных ссылок
      // this._setActiveLinks_();
    }
  }

  Router.version = Router.prototype.version;

  return Router;
})();