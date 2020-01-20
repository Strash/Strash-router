// TODO: добавить возможность пробрасывать в дочерние компоненты данные через аргумент подключенного потомка или как-то еще
// TODO: виртуальный DOM
// TODO: добавить data в корень компонента так, чтобы он был виден из любого места, хоть из корня, хоть из методов и т.д.
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
 * - __comparePaths__
 * - getDefaultRoute
 * - _clearMountPlace_
 * - __typeOfComponent__
 * - STRouter.links
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
 * - - - - - - - - - - -
 * - комментарии в разметке рендерятся только в режиме development;
 * - внутри компонента свой виртуальный кусок DOM из template;
 * - если в компоненте нет template, то в консоле выдается предупреждение;
 * - getRouteComponents теперь геттер и возвращает объект вида { имя пути: [имя компонента, ...] };
 * - __clickWatching__ переименован в _clickWatching;
 * - убран геттер getDefaultRoute и дефолтовый маршрут '*' теперь необязателен;
 * - поправлена установка CONFIG;
 * - добалено сообщение о том, что включен режим разработки;
 * - hasRouterViewClassAttribute переименован в hasRouterViewNameAttribute и проверяет наличие атрибута name с именем роутера;
 * - hasRouterViewNameAttribute теперь проверяет по ходу создания VNODE, соответственно проверяет и точки монтирования внутри компонентов;
 * - добавлена проверка количества имен у точки монтирования hasRouterViewMultipleNames. Если их несколько, то сохраняется только первое, остальные игнорируются;
 * - добавлено сравнение точки монтирования с именами компонентов для текущего пути isEqualRoute;
 * - добавлено свойство в объект vn точки монтирования - layer. Нужен для того чтобы отличать точки монтирования: из разметки и из компонентов — 'DOM'/'component';
 * - во всех точках монтирования разметка рендерится как есть, без дополнительных оберток;
 * - реализован рендеринг из основного VNODE и из VNODE компонентов.
 * - - - - - - - - - - -
 * - добавлена функция установка тайтла - setTitle;
 * - в свойство children объектов router.vn для router-view добавляются виртуальные ноды их потомков из компонентов;
 * - в виртуальные объекты текстового узла и комментария добавлено свойство self;
 * - setMountPlace переименован в mount;
 * - getRouteComponents теперь возвращает объект с двумя свойствами {route: '/', component: ['componentName', ...]};
 * - добавлена функция нахождения имени компонента из атрибута VNODE - getComponentName;
 * - после создания экземпляра компонента, в нем доступна ссылка на роутер - $router;
 */


window.STRouter = (function () {
  // GLOBAL CONFIG
  let CONFIG;

  // GLOBAL OBSERVER
  const OBSERVER = new MutationObserver(mutationObserving);

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
      case 'function': return component();
      case 'object':   return component;
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
  // Проверка наличия атрибута name у точки монтирования - <router-view>
  function hasRouterViewNameAttribute(node) {
    if (!node.hasAttribute('name')) {
      if (isDevMode()) warn(`Тэг ${node.outerHTML} router-view должен содержать атрибут name с именем точки монтирования. Например, <router-view name="my-router"></router-view>`);
      return false;
    } else return true;
  }
  // Проверка наличия нескольких имён у точки монтирования
  function hasRouterViewMultipleNames(node) {
    if (node.hasAttribute('name') && node.getAttribute('name').split(' ').length > 1) {
      const name = node.getAttribute('name').split(' ')[0];
      if (isDevMode()) warn(`Точка монтирования ${node.outerHTML} содержит больше одного имени. Использоваться будет только первое — "${name}", остальные будут игнорироваться.`);
      return name;
    } else return false;
  }
  // Проверка наличия путей при создании экземпляра роутера
  function isRoutesExist(routes) {
    if (routes == undefined || routes == null) {
      warn('Для экземлпяра роутера не заданы маршруты с компонентами.');
      return false;
    } else return true;
  }
  // Сравнение точки монтирования с допустимыми именами компонентов для текущего пути
  function isEqualRoute(vnode, routeComponents) {
    let attributeValue = getComponentName(vnode);
    if (routeComponents.component.some(name => name == attributeValue)) return attributeValue;
    else return undefined;
  }



  // Установка тайтла страницы
  function setTitle(title = document.title) {
    const cleanTitle = title.replace(CONFIG.titlePrefix, '').replace(CONFIG.titlePostfix, '');
    return (document.title = `${CONFIG.titlePrefix}${cleanTitle}${CONFIG.titlePostfix}`);
  }

  // Регистрация объекта путей вида {"path": ["componentName", ...]}
  function _collectRoutes(route) {
    if ('path' in route) this.routes[route.path] = Object.keys(route.components);
    else warn('Нужно указать "path" маршрута при создании роутера');
  }
  // Создание компонентов
  function _createComponentsFromRoute(components) {
    Object.keys(components).forEach(name => this.components[name] = new STRComponent(name, components[name]));
  }
  // Регистрация компонентов и путей
  function collectComponentsFromRoute(routes) {
    if (!isRoutesExist(routes)) return;
    let components = Object.create(null);
    if (Array.isArray(routes)) {
      routes.forEach(route => {
        _collectRoutes.call(this, route);
        components = {...components, ...route.components};
      });
      _createComponentsFromRoute.call(this, components);
    } else if (typeof routes == 'object') {
      _collectRoutes.call(this, routes);
      _createComponentsFromRoute.call(this, routes.components);
    }
  }
  // Определение имени компонента из аттрибута VNODE точки монтирования
  function getComponentName(vnode) {
    for (let i = 0; i < vnode.attributes.length; i++) {
      if (vnode.attributes[i].name == 'name') return vnode.attributes[i].value;
    } return undefined;
  }





  // VNODE
  // создание виртуального элемента
  function _createElementVNode(node, vnList, layout) {
    let name;
    if (node.nodeName == 'ROUTER-VIEW') {
      if (!hasRouterViewNameAttribute(node)) return; // если нет имени, то VNODE для точки монтирования не создается
      name = hasRouterViewMultipleNames(node); // если у точки монтирования несколько имен, то сохраняется только первое
    }
    let obj = Object.create(null); // создание объекта без наследования
    obj.self = node;
    obj.layout = layout;
    obj.nodeType = 1;
    obj.nodeName = node.nodeName;
    obj.namespaceURI = node.namespaceURI;
    obj.attributes = node.attributes.length > 0 ? [] : null;
    for (let i = 0; i < node.attributes.length; i++) {
      obj.attributes.push({
        name: node.attributes[i].name,
        value: node.attributes[i].name == 'name' && name ? name : node.attributes[i].value
      });
    }
    obj.children = node.childNodes.length > 0 ? getVNode(node.childNodes, layout) : null;
    vnList.push(obj);
  }
  // создание виртуального текстового элемента
  function _createTextVNode(node, vnList, layout) {
    let obj = Object.create(null);
    obj.self = node;
    obj.layout = layout;
    obj.nodeType = 3;
    obj.nodeName = node.nodeName; // '#text'
    obj.nodeValue = node.nodeValue;
    vnList.push(obj);
  }
  // создание виртуального комментария
  function _createCommentVNode(node, vnList, layout) {
    let obj = Object.create(null);
    obj.self = node;
    obj.layout = layout;
    obj.nodeType = 8;
    obj.nodeName = node.nodeName; // '#comment'
    obj.nodeValue = node.nodeValue;
    vnList.push(obj);
  }
  // рекурсионный проход по дереву DOM и клонирование элементов в vnode
  function getVNode(nodeList, layout) {
    let vnode = Array(0);
    for(let n = 0; n < nodeList.length; n++) {
      switch (nodeList[n].nodeType) {
        case 1: _createElementVNode(nodeList[n], vnode, layout); break; // element node
        case 3: _createTextVNode(nodeList[n], vnode, layout); break; // text node
        case 8: _createCommentVNode(nodeList[n], vnode, layout); break; // comment node
      }
    }
    return vnode;
  }




  // создание элемента
  function createElement(vnode) {
    // условие для svg и других элементов со своим пространством имен
    if (vnode.namespaceURI.indexOf('xhtml') == -1) {
      vnode.self = document.createElementNS(vnode.namespaceURI, vnode.nodeName);
      vnode.attributes.forEach(a => vnode.self.setAttribute(a.name, a.value));
    // условие для обычных элементов
    } else {
      if (vnode.nodeName == 'ROUTER-VIEW') {
        mount.call(this, vnode); // вставка точки монтирования вместо тэга <router-view>
      } else {
        vnode.self = document.createElement(vnode.nodeName);
        if (vnode.attributes !== null) vnode.attributes.forEach(a => vnode.self.setAttribute(a.name, a.value));
      }
    }
    // если есть потомки
    if (vnode.nodeName !== 'ROUTER-VIEW' && vnode.children !== null) setDOM.call(this, vnode.children, vnode.self);
    return vnode;
  }
  // создание текстового элемента
  function createText(vnode) {
    vnode.self = document.createTextNode(vnode.nodeValue);
    return vnode.self;
  }
  // создание комментария
  function createComment(vnode) {
    vnode.self = document.createComment(vnode.nodeValue);
    return vnode.self;
  }
  // рекурсивное создание DOM
  function setDOM(vnodeList, parent) {
    for(let n = 0; n < vnodeList.length; n++) {
      switch (vnodeList[n].nodeType) {
        case 1:
          const element = createElement.call(this, vnodeList[n]);
          if (element.self !== undefined) parent.appendChild(element.self); break; // element node
        case 3: parent.appendChild(createText(vnodeList[n])); break; // text node
        case 8: if (isDevMode()) { parent.appendChild(createComment(vnodeList[n])); break; } // comment node
      }
    }
  }

  // Замена router-view на DOM компонента
  function mount(vnode) {
    if (vnode.layout == 'DOM') {
      const routeComponents = this.getRouteComponents;
      const componentName = isEqualRoute(vnode, routeComponents);
      if (componentName !== undefined) {
        vnode.self = document.createDocumentFragment();
        vnode.children = this.components[componentName].vn;
        setDOM.call(this, vnode.children, vnode.self);
      }
    } else if (vnode.layout == 'component') {
      vnode.self = document.createDocumentFragment();
      vnode.children = this.getComponent(getComponentName(vnode)).vn;
      setDOM.call(this, vnode.children, vnode.self);
    }
  }

  // выгрузка нод неактуальных для текущего пути
  function unmount() {
    const unusedComponents = Object.keys(this.components).filter(name => !this.getRouteComponents.component.some(n => name === n));
    unusedComponents.forEach(name => {
      this.getComponent(name).vn.forEach(vnode => {
        if ('self' in vnode) {
          vnode.self.remove();
          delete vnode.self;
        }
      });
    });
  }





  // Слежение за изменениями в DOM
  function mutationObserving(o) {
    console.log(o);
  }
  OBSERVER.observe(document.body, {childList: true, attributes: true, characterData: true, subtree: true, attributeOldValue: true, characterDataOldValue: true});





  // Класс компонента
  class STRComponent {
    constructor(name, component) {
      this.name = name;
      // перенос всех свойств и методов в компонент
      Object.keys(checkComponentType(component)).forEach(key => this[key] = checkComponentType(component)[key]);
      // проверяем есть ли template
      if ('template' in this) {
        const container = document.createElement('div');
        container.innerHTML = this.template;
        this.vn = getVNode(container.childNodes, 'component'); // виртуальный DOM компонента
      } else {
        if (isDevMode()) warn(`В компоненте "${this.name}" не найдено свойство "template".`);
      }
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
        mode:         config && config.mode ? config.mode : 'production',
        titlePrefix:  config && config.titlePrefix ? config.titlePrefix : '',
        titlePostfix: config && config.titlePostfix ? config.titlePostfix : ''
      };

      setTitle(); // установка татйла при первой загрузке, далее устанавливается из _clickWatching

      if (isDevMode()) info('Вы находитесь в режиме разработки "development".');

      this.listeners  = Object.create(null);  // реестр слушателей
      this.components = Object.create(null);  // объект компонентов
      this.routes     = Object.create(null);  // пути

      STRComponent.prototype.$router = this;

      isRouterViewTagExist(); // проверка на наличие тэга <router-view>

      this.vn = getVNode(document.body.childNodes, 'DOM'); // виртуальный DOM

      collectComponentsFromRoute.call(this, routes); // сбор компонентов

      document.body.innerHTML = ''; // очистка бодей
      setDOM.call(this, this.vn, document.body); // отрисовка из виртуального DOM

      // системный слушатель нажатия по ссылкам
      this.addListener({
        target: document,
        listener: this._clickWatching.bind(this),
        name: '_routerClickWatcher'
      });
      // системный слушатель перемещения по истории браузера кнопками "назад" / "вперед"
      this.addListener({
        target: window,
        type: 'popstate',
        listener: this.render.bind(this),
        name: '_routerHistoryWatcher'
      });

      this.render(); // рендеринг
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
      history.pushState(data, setTitle(title), url);
    }

    /**
     * Слежение за переходами по страницам.
     *
     * @param {Object} e — объект события
     */
    _clickWatching(e) {
      // TODO: прокидывать тайтлы страницы
      const __setRoute = (url, title) => {
        e.preventDefault();
        this.location = {
          url,
          title
        };
        this.render();
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
          if (isDevMode()) warn('Нет активных слушателей.');
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

    // getting component by name
    getComponent(name) {
      let component;
      function _getComponentFromLayer(layer) {
        Object.keys(layer).forEach(cmpnnt => {
          if (cmpnnt == name) component = layer[cmpnnt];
          if ('children' in layer[cmpnnt]) _getComponentFromLayer(layer[cmpnnt].children);
        });
      }
      _getComponentFromLayer(this.components);
      return component;
    }

    // getting route component names
    get getRouteComponents() {
      let componentArr = [];
      const locationArr = this.location.path.split('/');
      let stringRoute;
      // если в пути последний символ '/', то при сплите в массив добавляется пустая строка и тут она убирается
      // (locationArr.length > 2) нужно потому что массив для главной страницы будет ['',''] и если в нем обрезать последний элемент, то главная никогда не откроется
      if (locationArr.length > 2 && locationArr[locationArr.length - 1] == '') locationArr.pop();
      // достаем подходящий компонент
      Object.keys(this.routes).forEach(route => {
        let compareArr = [];
        componentArr = route.split('/');
        if (componentArr.length == locationArr.length) {
          componentArr.forEach((str, i) => {
            if (str.indexOf(':') == -1 && str === locationArr[i]) compareArr.push(1);
            else if (str.indexOf(':') == -1 && str !== locationArr[i] && locationArr[i] == '') compareArr.push(0);
            else if (str.indexOf(':') > -1) compareArr.push(1);
            else compareArr.push(0);
          });
          if (!compareArr.some(num => num == 0)) stringRoute = route;
        }
      });
      if (stringRoute) return {route: stringRoute, component: this.routes[stringRoute]};
      else if (this.routes['*']) return {route: '*', component: this.routes['*']};
      else {
        if (isDevMode()) warn('Для этого пути не определен маршрут и нет маршрута по-умолчанию "*".');
        return {route: this.location.path, component: undefined};
      }
    }

    // Component rendering
    render() {
      unmount.call(this);
      // setDOM.call(this, this.vn, document.body); // отрисовка из виртуального DOM

      // удаление листнеров с предыдущих страниц
      this.removeListeners();

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