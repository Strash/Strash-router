# Strash Router

**Version 0.4.0-beta**



* [Установка](#установка)
* [Методы](#методы)
* [Псевдонимы](#псевдонимы)




## Установка

1. [Инициирование роутера](#1.-инициирование-роутера)
2. [Добавление точек монтирования в HTML разметку](#2.-добавление-точек-монтирования-в-html-разметку)
3. [Создание компонента](#3.-создание-компонента)




### 1. Инициирование роутера

В минифицированном файле роутера отсутствуют предупреждения об ошибках.
```javascript
new STRouter([
  {
    path: '/',
    components: {
      menu: Menu,
      pageOne: PageOne
    }
  },
  {
    path: '/about',
    components: {
      menu: Menu,
      pageTwo: PageTwo
    }
  },
  // 404
  {
    path: '*',
    components: {
      menu: Menu,
      pageError: PageError
    }
  }
]);
```




### 2. Добавление точек монтирования в HTML разметку.
```html
<router-view name="menu"></router-view>
<router-view name="pageOne"></router-view>
<router-view name="pageTwo"></router-view>
<router-view name="pageError"></router-view>
```
При рендеринге тэги заменяются на `<div name="component-ComponentName">`. Внутрь `<div>` монтируется шаблон компонента.
```html
<div name="component-menu"></div>
<div name="component-pageOne"></div>
<div name="component-pageTwo"></div>
<div name="component-pageError"></div>
```




### 3. Создание компонента

Компонент может быть как функцией, которая возвращает объект, так и простым объектом. Внутри компонента доступны свойства:
* `Component.template` — строка шаблона;
* `Component.methods` — объект с методами. Методы можно вызывать внутри шаблона с помощью двойных фигурных скобок `{{addLink}}`, один должны возвращать строку. Роутером автоматически будут исполнятся только те методы, которые вызываются из шаблона;
* `Component.beforeMount` — сюда можно записать события, которые нужно выполнить до монтирования компонента. Принимает функцию или промис, который нужно возвратить, чтобы поставить в цепочку.
* `Component.mounted` — сюда можно добавить вызов методов или другие события, которые нужно выполнить во время монтирования компонента.

Помимо свойств и методов роутера в шаблоне допускается использовать свои свойства и методы.
```javascript
import Header from './header.js';

let Page = () => {
  return {
    // шаблон
    template: `
    <div
    style="padding: 10px 20px; background-color: #999;">
      {{addSubComponent}}
    </div>
    {{addLink}}`,
    // методы
    methods: {
      _scroll () {
        // do something
      }
      checkRoute () {
        if (/projects/.test(location.pathname)) return true;
        else return false;
      },
      addLink () {
        if (this.checkRoute())
        return `<div style="margin:50px 0; padding: 50px; background-color:grey; height:150px; color: white;">Project</li>`;
        else return '';
      },
      // встраиваемый компонент
      addSubComponent () {
        return STRouter.insertComponent(Header);
      }
    },
    // действия выполняемые перед монтированием компонента
    beforeMount () {
      this.checkRoute();
      // например, загрузка данных
      return API.getData();
    },
    // действия выполняемые во время монтирования
    mounted () {
      this.checkRoute();
      // добавление в реестр слушателя
      router.addListener({
        target:   document,
        type:     'scroll',
        listener: _scroll.bind(this),
        name:     'scrollPage',
        once:     true
      });
    }
  };
};
```




## Методы

* [addListener](#addlistener)
* [getDefaulRoute](#getdefaulroute)
* [getLocation](#getlocation)
* [getRouteComponents](#getroutecomponents)
* [insertComponent](#insertcomponent)
* [removeListeners](#removelisteners)
* [render](#render)
* [version](#version)




### addListener

Метод `new STRouter().addListener()` устанавливает слушателя событий. Принимает объект с шестью свойствами:
* **target**   {object HTMLDocument} — Обязательный параметр. Объект слушателя;
* **type**     {String} — Обязательный параметр и нативный атрибут. Тип слушателя;
* **listener** {Function} — Обязательный параметр и нативный атрибут. Функция колбэка;
* **options**  {Object} — Опциональный объект и нативный атрибут, который определяет характеристики объекта, прослушивающего событие;
* **name**     {String} — Обязательный параметр. Имя слушателя для поиска по реестру слушателей;
* **once**     {Boolean} — Опциональный параметр. Жизненный цикл слушателя. При значении `true` слушатель удаляется автоматически во время перехода на другую страницу. При значении `false` слушатель не удаляется автоматически. По-умолчанию установлено значение `false`.

```js
new STRouter().addListener({
  target: document,
  type: 'click',
  listener: callback.bind(this),
  options:  {
    capture: Boolean,
    once:    Boolean,
    passive: Boolean
  },
  name: 'clickButtons',
  once: true
});
```

Реестр зарегистрированных слушателей можно получить из `new STRouter().listeners`.
Удалить слушателя можно с помощью метода [`new STRouter().removeListeners`](#removelisteners).




### getDefaulRoute

Геттер `new STRouter().getDefaulRoute` возвращает объект с компонентами для несуществующих страниц, например 404. Если не задан объект по-умолчанию, то роутер выдаст предупреждение.




### getLocation

Геттер `new STRouter().getLocation` или `STRouter.getLocation` возвращает объект с данными адресной строки.
```javascript
{
  hash:   location.hash,
  href:   location.href,
  origin: location.origin,
  path:   location.pathname,
  search: location.search,
}
```




### getRouteComponents

Метод `new STRouter().getRouteComponents()` возвращает объект с компонентами, соответствующими текущему пути. Если не заданы пути, то роутер выдаст предупреждение.
```javascript
{
  components: {
    menu:    Function || Object,
    pageOne: Function || Object
  }
  path: '/'
}
```




### insertComponent

Метод `new STRouter().insertComponent()` или `STRouter.insertComponent()` принимает объект компонента и возвращает строку с шаблоном. Используется внутри родительского компонента для вложения. Метод нужно обернуть в метод компонента и вернуть из него строку в шаблон.




### removeListeners

Метод `new STRouter().removeListeners()` принимает строку с именем слушателя или объект с тремя свойствами:
* **target** {object HTMLDocument} — Объект слушателя;
* **type**   {String} — Нативный атрибут. Тип слушателя;
* **name**   {String} — Имя слушателя для поиска по реестру слушателей.

Позволяет удалять зарегистрированных слушателей с помощью метода [`new STRouter().addListener()`](#addlistener). При удалении слушателей с объектов прослушивания, они удаляются и из реестра. Доступные способы удаления:
* Без аргументов удаляются слушатели имеющие флаг `once: true`;
* С аргументом `{target}`. Удаляются все слушатели с данного объекта;
* С аргументом `{type}`. Удаляются все слушатели данного типа;
* С аргументом `{target, type}`. Удаляются все слушатели данного типа с заданного объекта.
* С аргументом `{name}` или `'name'` или `{target, type, name}`. Удаляются все слушатели с таким именем. При всех переданных аргументах учитывается только `name`.




### render

Метод `new STRouter().render()` перерендерит страницу если экземпляр класса уже был создан. Если не был создан, то в роутер необходимо передать компонент, который должен быть отрендерен. По-умолчанию, рендеринг осуществляется автоматически.




### version

Геттер `STRouter.version` возвращает строку с версией роутера.




## Псевдонимы

`window.$routes` псевдоним `STRouter.routes`.

`window.$location` псевдоним `STRouter.getLocation`.