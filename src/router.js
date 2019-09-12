// TODO: добавить возможность пробрасывать в дочерние компоненты данные через аргумент подключенного потомка или как-то еще
// TODO: виртуальный DOM
// TODO: добавить data в корень компонента так, чтобы он был виден из любого места, хоть из корня, хоть из методов и т.д.
// TODO: убрать обязательное присутствие дефолтового пути
// TODO: поправить README.md

/**
 * DEPRECATED
 * - __setGlobalAliases__
 *    - window.$routes
 *    - window.$location
 * - __cleanListeners
 * - _detectMountPlace_
 * - __clickWatching__
 * - _setMountPlace
 * - <div name="component-name"> -> <div class="component-name">
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
 * - добавлена дополнительная проверка наличия атрибута class у тэга router-view функцией hasRouterViewClassAttribute;
 * - __clickWatching__ переименован в __clickWatching;
 * - _setMountPlace_ переименован в _setMountPlace;
 * - первичный рендеринг теперь осуществляется при инициализации роутера и не нужно его запускать дополнительно после создания экземпляра роутера;
 * - некоторые методы вынесены в скоуп IIFE. Конфиг хранится там же;
 * - для компонентов выделен отдельный класс;
 * - рефакторинг.
 * - - - - - - - - - - -
 * - при создании роутера в аргументе вместо массива объектов путей допускается использовать объект без обертывания массивом, если объект всего один;
 * - изменено свойство STRouter.routes. Теперь это объект с ключами в виде путей и свойствами в виде массива имен компонентов;
 * - убрано свойство STRouter.componentNames (Set) с набором имен компонентов. Вместо него новое свойство-объект STRouter.components с набором уникальных компонентов;
 * - __typeOfComponent__ переименован в checkComponentType и вынесен из класса;
 * - убрано свойство STRouter.links. В этот массив логировались посещенные пути, но никак не использовались;
 * - метод _setMountPlace переименован в setMountPlace и вынесен из класса;
 * - при рендеринге у точки монтирования теперь вместо name="component-name" устанавливается класс class="component-name";
 * - тэг <router-view> теперь может содержать любые атрибуты, все они переносятся в точку монтирования;
 * - точка монтирования теперь доступна из интерфейса компонента как STRouter.components.MyComponent.self;
 * - для дочерних компонентов доступен родительский компонент через parent;
 * - VDOM в виде объекта дерева DOM. При загрузке страницы собирает DOM в VDOM, чистит все внутри body и ререндерит уже из VDOM;
 * - рефакторинг.
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

  // Проверка типа компонента
  function checkComponentType(component) {
    switch (typeof component) {
      case 'function':
        return component();
      case 'object':
        return component;
    }
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

  // Проверка наличия атрибута class у точки монтирования
  function hasRouterViewClassAttribute() {
    for (let i = 0; i < document.getElementsByTagName('router-view').length; i++) {
      if (document.getElementsByTagName('router-view')[i].hasAttribute('class') == false) {
        if (isDevMode()) warn('Тэг router-view должен содержать атрибут class с названием. Например, <router-view class="my-router"></router-view>');
        return false;
      } else return true;
    }
  }

  // Регистрация компонентов и путей
  function collectComponents(routes) {
    let components = Object.create(null);
    if (Array.isArray(routes)) {
      routes.forEach(route => {
        __collectRoutes.bind(this)(route);
        components = {...components, ...route.components};
      });
      __createComponents.bind(this)(components);
    } else if (typeof routes == 'object') {
      __collectRoutes.bind(this)(routes);
      __createComponents.bind(this)(routes.components);
    }
  }

  // Регистрация объекта путей вида {"path": ["component", ...]}
  function __collectRoutes(route) {
    this.routes[route.path] = Object.keys(route.components);
  }

  // Создание компонентов
  function __createComponents(components) {
    Object.keys(components).forEach(name => this.components[name] = new STRComponent(name, components[name]));
  }

  // Замена тэгов router-view на div и добавление в компонент
  function setMountPlace(components) {
    // фильтрация атрибута class. убирает класс с именем компонента
    const filterClasses = (classes, names) => classes.filter(c => c != names);

    try {
      const componentNames = [...Object.keys(components)];
      for (let i = 0; i < componentNames.length; i++) {
        // проверка точки монтирования
        if (!document.querySelector(`router-view[class*=${componentNames[i]}]`)) {
          throw Error(`Для компонента ${componentNames[i]} не найден тэг <router-view class="${componentNames[i]}"></router-view> в разметке.`);
        }
        const view = document.querySelector(`router-view[class*=${componentNames[i]}]`);
        components[componentNames[i]].self = document.createElement('div');
        // сохранение всех атрибутов
        for (let j = 0; j < view.attributes.length; j++) {
          if (view.attributes[j].name == 'class') {
            components[componentNames[i]].self.setAttribute('class', `component-${componentNames[i]} ${filterClasses(view.attributes[j].value.split(' '), componentNames[i]).join(' ')}`);
          } else components[componentNames[i]].self.setAttribute(view.attributes[j].name, view.attributes[j].value);
        }
        view.insertAdjacentElement('beforebegin', components[componentNames[i]].self);
        view.remove();
      }
    } catch (e) {
      console.error(e);
    }
  }





  // VNODE
  // создание виртуального элемента
  function createElementVNode(node, vnList) {
    node.attributes.map = Array.prototype.map; // наследование
    let obj = Object.create(null); // создание объекта без наследования
    obj.nodeType = 1;
    obj.nodeName = node.nodeName;
    obj.namespaceURI = node.namespaceURI;
    obj.attributes = node.attributes.map(a => { return { name: a.name, value: a.value }; });
    obj.children = node.childNodes.length > 0 ? getVNode(node.childNodes) : null;
    vnList.push(obj);
  }
  // создание виртуального текстового элемента
  function createTextVNode(node, vnList) {
    let obj = Object.create(null);
    obj.nodeType = 3;
    obj.nodeName = node.nodeName; // '#text'
    obj.nodeValue = node.nodeValue;
    vnList.push(obj);
  }
  // создание виртуального комментария
  function createCommentVNode(node, vnList) {
    let obj = Object.create(null);
    obj.nodeType = 8;
    obj.nodeName = node.nodeName; // '#comment'
    obj.nodeValue = node.nodeValue;
    vnList.push(obj);
  }
  // рекурсионный проход по дереву DOM и клонирование элементов в vnode
  function getVNode(nodeList) {
    let vnode = Array(0);
    for(let n = 0; n < nodeList.length; n++) {
      switch (nodeList[n].nodeType) {
        case 1: createElementVNode(nodeList[n], vnode); break; // element node
        case 3: createTextVNode(nodeList[n], vnode); break; // text node
        case 8: createCommentVNode(nodeList[n], vnode); // comment node
      }
    }
    return vnode;
  }

  // создание элемента
  function createElement(vnode) {
    let el;
    // условие для svg и других элементов со своим пространством имен
    if (vnode.namespaceURI.indexOf('xhtml') == -1) {
      el = document.createElementNS(vnode.namespaceURI, vnode.nodeName);
      vnode.attributes.forEach(a => el.setAttribute(a.name, a.value));
    // условие для обычных элементов
    } else {
      el = document.createElement(vnode.nodeName);
      vnode.attributes.forEach(a => el.setAttribute(a.name, a.value));
    }
    // если есть потомки
    if (vnode.children !== null) setDOM(vnode.children, el);
    return el;
  }
  // создание текстового элемента
  function createText(vnode) {
    return document.createTextNode(vnode.nodeValue);
  }
  // создание комментария
  function createComment(vnode) {
    return document.createComment(vnode.nodeValue);
  }
  // рекурсивное создание DOM
  function setDOM(vnodeList, parent) {
    for(let n = 0; n < vnodeList.length; n++) {
      switch (vnodeList[n].nodeType) {
        case 1: parent.appendChild(createElement(vnodeList[n])); break; // element node
        case 3: parent.appendChild(createText(vnodeList[n])); break; // text node
        case 8: parent.appendChild(createComment(vnodeList[n])); // comment node
      }
    }
  }




  const observer = new MutationObserver(o => console.log(o));






  // Класс компонента
  class STRComponent {
    constructor(name, component) {
      this.name = name;
      // перенос всех свойств и методов в компонент
      Object.keys(checkComponentType(component)).forEach(key => this[key] = checkComponentType(component)[key]);
      // если есть потомки
      if ('children' in this) {
        Object.keys(this.children).forEach(name => {
          this.children[name] = new STRComponent(name, this.children[name]);
          this.children[name].parent = this;
        });
      }
    }

  }





  // Класс роутера
  class Router {
    constructor(routes, config) {
      // объект конфигураций
      CONFIG = {
        mode: config.mode || 'production',
        titlePrefix: config.titlePrefix || '',
        titlePostfix: config.titlePostfix || ''
      };
      // реестр слушателей
      this.listeners = Object.create(null);
      // объект компонентов
      this.components = Object.create(null);
      // пути
      this.routes = Object.create(null);
      // виртуальный DOM
      this.vn = getVNode(document.body.childNodes);
      // очистка бодей
      document.body.innerHTML = '';
      // отрисовка из виртуального DOM
      setDOM(this.vn, document.body);
      // TODO: тут про дефолтовый роутер
      // this.defaultRoute = this.getDefaultRoute;

      // проверка на наличие тэга <router-view>
      isRouterViewTagExist();
      // проверка на наличие атрибута class у тэга <router-view>
      hasRouterViewClassAttribute();
      // сбор компонентов
      collectComponents.bind(this)(routes);
      // вставка точки монтирования вместо тэга <router-view>
      // setMountPlace.bind(this)(this.components);
      // установка тайтла страницы
      document.title = CONFIG.titlePrefix + document.title + CONFIG.titlePostfix;
      // рендеринг
      this.render();

      // системный слушатель нажатия по ссылкам
      this.addListener({
        target: document,
        listener: this.__clickWatching.bind(this),
        name: '_routerClickWatcher'
      });
      // системный слушатель перемещения по истории браузера кнопками "назад" / "вперед"
      this.addListener({
        target: window,
        type: 'popstate',
        listener: this.render.bind(this),
        name: '_routerHistoryWatcher'
      });
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
      history.pushState(data, newTitle, url);
      document.title = newTitle;
    }

    /**
     * Слежение за переходами по страницам.
     *
     * @param {Object} e — объект события
     */
    __clickWatching(e) {
      // TODO: прокидывать тайтлы страницы
      const __setRoute = (url, title) => {
        e.preventDefault();
        this.location = {
          url,
          title
        };
        // TODO: вместо повторного рендеринга следить за изменением дома
        // this.render();
      };

      let parent;
      if (e.target.tagName !== 'A') {
        parent = e.target.parentNode;
        while (parent.tagName !== 'A') {
          parent = parent.parentNode;
          if (parent == null || !parent.tagName) return;
        }
      } else parent = e.target;
      if (parent.hasAttribute('download')) return;
      if (RegExp(this.location.origin).test(parent.href) && parent.hasAttribute('target') && parent.getAttribute('target') !== '_blank' ||
        RegExp(this.location.origin).test(parent.href) && !parent.hasAttribute('target')) __setRoute(parent.href);
      else return;
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



    // Component rendering
    render() {


      // TODO: temporary
      observer.observe(document.body, {childList: true, attributes: true, characterData: true, subtree: true, attributeOldValue: true, characterDataOldValue: true});
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