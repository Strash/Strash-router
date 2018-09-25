/*
 * RENDERING ALGORITHM
 * 1.  Router (once)
 * 1.1 detect router views
 * 1.2 creating virtual object with components from router views
 * 2.  Components
 * 2.1 an requests from server
 * 2.2 components rendering
 * 3.  Router
 * 3.1 run component methods
 * 3.2 mount components into DOM
 * 3.3 unmount node from DOM if it doesn't match a component
 * 3.4 setting watcher on clicks on links
 * 3.5 setting watcher onto browser history
 *
 */
const Router = (() => {
  class Router {
    constructor(routes = undefined) {
      this.routes = routes;
      this.defaulRoute = this.getDefaulRoute;
      this.links = [];
      this.componentNames = new Set();
      // this.vnode = [];

      this.__setGlobalAliases();

      this.detectMountPlace();
      this._clickWatching();
      this._popWatching();
      this.render();
    }

    get version () {
      return '0.2.0-beta';
    }

    // геттер адресной строки
    get getLocation () {
      return {
        hash:   location.hash,
        href:   location.href,
        origin: location.origin,
        path:   location.pathname,
        search: location.search,
      };
    }

    __setGlobalAliases () {
      window.$routes = this.routes;
    }

    // метод, возвращающий компоненты, соответствующие текущему пути
    getComponents () {
      if (this.routes) {
        let components = this.routes.find(item => item.path == this.getLocation.path);
        return components ? components : this.defaulRoute;
      } else {
        const error = new Error('STR-Warn: Не заданы маршруты. Routes are not defined.');
        console.warn(error.message);
        return;
      }
    }

    // геттер дефолтового компонента для 404 страниц
    get getDefaulRoute () {
      let defaulRoute;
      if (this.routes) defaulRoute = this.routes.find(item => item.path == '*');
      if (!defaulRoute) {
        const error = new Error('STR-Warn: Не задан маршрут по-умолчанию. Default route is not defined.');
        console.warn(error.message);
      } return defaulRoute;
    }

    // проверка мест для монтирования компонент
    detectMountPlace () {
      if (document.getElementsByTagName('router-view').length == 0) {
        const error = new Error('STR-Warn: Не установлены точки монтирования. Missing "<router-view>" tag.');
        console.warn(error.message);
      }
    }

    // замена роутеров на дивы
    _setMountPlace () {
      let routerViews = document.getElementsByTagName('router-view');
      for (let i = 0; i < routerViews.length; i++) {
        this.componentNames.add(routerViews[i].getAttribute('name'));
        let div = document.createElement('div');
        div.setAttribute('name', `component-${routerViews[i].getAttribute('name')}`);
        routerViews[i].insertAdjacentElement('beforebegin',div);
      }
      let removeRouterView = () => {
        for (let i = 0; i < document.getElementsByTagName('router-view').length; i++) {
          document.getElementsByTagName('router-view')[i].remove();
        }
        if (document.getElementsByTagName('router-view').length > 0) removeRouterView();
      };
      removeRouterView();
    }

    // очистка дивов перед монтированием
    _clearMountPlace () {
      this.componentNames.forEach(name => {
        document.getElementsByName(`component-${name}`).forEach(node => node.innerHTML = '');
      });
    }

    // проверка на теги внутри текста и на одиночные тэги
    // TODO: ! для вирутального DOM — не используется, не доделано
    _comparing (item) {
      return (/^[^\s]+[a-z0-9а-яё]+?<.+?>/i.test(item) ||
              /<\/.+>[a-z0-9а-яё]+?[^\s]+/i.test(item) );
              // нужно искать исключения вида:
              // 1. текст в начале строки и наличие тэга
              // 2. наличи тэга и текст в конце строки
              // 3. возврат каретки, перевод строки и текст в начале и наличие тэга
              // 4. наличие тэга и возврат каретки, перевод строки и текст в начале
    }

    // рекурсивный метод, который гуляет по дому на всех уровнях внутри боди и коллекционирует ноды в виртуальный дом
    // TODO: ! для вирутального DOM — не используется, не доделано
    _setVirtualDom (arr) {

      // TODO:
      // сделать отдельным методом
      // забирать из нод контент еще нужно
      // если контент по одной или по обоим маскам true, то помещать весь контент в текущую ноду и не заглядывать к детям
      // маска для случаев, когда внутри тэга есть другой тэг и текст слева
      // /.+(?=<\w+>)/.test('23asdf<abbr>fdsa</abbr>fdsa')
      // маска для случаев, когда внутри тэга есть другой тэг и текст справа
      // /<\/\w+>(?=.+)/.test('23asdf<abbr>fdsa</abbr>fdsa')
      // добавить маску для HTML void tag (одиночные тэги):
      // area, base, br, col, embed, hr, img, input, link, meta, param, source, track, wbr
      // https://www.w3.org/TR/html/syntax.html#void-element
      // TODO:
      // а если контент по маскам false, то не забирать контент в ноду и заглядывать к детям

      // TODO:
      // вставлять ноды с помощью insertAdjacentHTML. это избавляет от проблем с svg

      // если есть дети
      if (arr.childElementCount > 0) {
        // одалживание метода
        arr.children.forEach = [].forEach;
        // временный массив с нодами текущего уровня вложенности
        let arrTemp = [];
        let componentName = '';
        let tagName = '';
        arr.children.forEach(item => {
          // TIP: если убрать приведение к нижнему регистру, то нужно в проверках на router-view сделать его верхним регистром
          tagName = item.tagName.toString().toLowerCase();
          arrTemp.push({
            // если нет атрибутов, то возвращается пустой массив
            attributes: item.attributes.length == 0 ? [] : (() => {
              // временный массив для атрибутов
              let attrObj = [];
              // item.getAttributeNames возвращает массив со всеми строкововыми именами атрибутов
              item.getAttributeNames().forEach(attr => {
                // пушится объект {имя атрибута: значение атрибута}
                // если атрибут hidden, то значение true
                attrObj.push({ [attr]: attr == 'hidden' ? true : item.getAttribute(attr) });
                // если это точка монтирования, то сохраняем название компонента для нее
                if (tagName == 'router-view') componentName = item.getAttribute(attr);
              });
              return attrObj;
            })(),
            tag: tagName,
            component: tagName == 'router-view' ? componentName : '',
            content: this._comparing(item.innerHTML) ? item.innerHTML : '',
            // если есть дети, то уходим глубже в рекурсию
            // если router-view, то не смотрим детей, потому что они все равно затрутся
            children: item.childElementCount == 0 || tagName == 'router-view' || this._comparing(item.innerHTML) ? [] : (() => this._setVirtualDom(item))()
          });
        });
        return arrTemp;
      } else return [];
    }

    // выполнение методов внутри компонента
    _runMethods (component) {
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
      } return template;
    }

    // рендеринг компонентов
    render () {
      this._setMountPlace();
      // WARN: ! парсинг DOM в виртуальный — не используется, не доделано
      // this.vnode = this.setVirtualDom(document.getElementsByTagName('body')[0]);
      if (!this.getComponents()) return;
      // чистка
      this._clearMountPlace();
      let currentComponent = this.getComponents();
      // монтирование
      this.componentNames.forEach(name => {
        if (currentComponent.components.hasOwnProperty(name)) {
          let component = (() => {
            // проверка на тип компонента. может быть функцией или объектом
            switch (typeof currentComponent.components[name]) {
              case 'function': return currentComponent.components[name]();
              case 'object':   return currentComponent.components[name];
            }
          })();
          let template = this._runMethods(component);
          document.getElementsByName(`component-${name}`).forEach(node => node.insertAdjacentHTML('beforeend',template));
        }
      });
    }

    // изменение адреса и добавление его в историю
    _pushLinkToHistory (state, link) {
      this.links.push(link);
      history.pushState(state, '', link);
    }

    // слежение за изменением истории
    _popWatching () {
      window.onpopstate = e => {
        this.render();
      };
    }

    // слежение за кликом на ссылки
    _clickWatching () {
      const watcher = e => {
        if (e.target.tagName == 'A') {
          e.preventDefault();
          this._pushLinkToHistory('', e.target.toString());
          this.render();
        }
      };

      document.addEventListener('click', watcher);
    }
  }

  return Router;
})();

export default Router;