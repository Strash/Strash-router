# Простой роутер

**Version 0.2.1-beta**



* [Установка](#установка)
* [Методы](#методы)




## Установка

1. [Инициирование роутера](#1.-инициирование-роутера)
2. [Добавление точек монтирования в HTML разметку](#2.-добавление-точек-монтирования-в-html-разметку)
3. [Создание компонента](#3.-создание-компонента)




### 1. Инициирование роутера
```javascript
new Router([
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



### 2. Добавление точек монтирования в HTML разметку
```html
<router-view name="menu"></router-view>
<router-view name="page-one"></router-view>
<router-view name="page-two"></router-view>
<router-view name="page-error"></router-view>
```



### 3. Создание компонента

Компонент может быть как функцией так и простым объектом. Внутри компонента доступны свойства `Component.template` в виде строки и `Component.methods` в виде объекта с методами. Можно вызывать методы внутри разметки с помощью двойных фигурных скобок `{{addLink}}`.
```javascript
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
```



## Методы

* [detectMountPlace](#detectMountPlace)
* [getComponents](#getComponents)
* [getDefaulRoute](#getDefaulRoute)
* [getLocation](#getLocation)
* [render](#render)
* [version](#version)
* [window.$routes](#window.$routes)




### detectMountPlace

Метод `Router.detectMountPlace()` проверяет наличие точек монтирования в HTML разметке. Проверка осуществляется автоматически. Если не заданы точки монтирования, то роутер выдаст предупреждение.



### getComponents

Метод `Router.getComponents()` возвращает объект с компонентами, соответствующими текущему пути. В компонентах возвращаются тела функций. Если не заданы пути, то роутер выдаст предупреждение.
```javascript
{
  components: {
    menu:    function|object,
    pageOne: function|object
  }
  path: '/'
}
```



### getDefaulRoute

Геттер `Router.getDefaulRoute` возвращает объект с компонентами для не существующих страниц, например 404. Если не задан объект по-дефолту, то роутер выдаст предупреждение.



### getLocation

Геттер `Router.getLocation` возвращает объект с данными адресной строки.
```javascript
{
  hash:   location.hash,
  href:   location.href,
  origin: location.origin,
  path:   location.pathname,
  search: location.search,
}
```



### render

Метод `Router.render()` перерендерит страницу. Рендеринг осуществляется автоматически.



### version

Геттер `Router.version` возвращает строку с версией роутера.



### window.$routes

`window.$routes` является ссылкой на `Router.routes`.