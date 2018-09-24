# Простой роутер

**Version 0.1.0-beta**



* [Установка](#установка)
* [Методы](#методы)




## Установка

1. Инициирование роутера
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
    path: 'missingPage',
    components: {
      menu: Menu,
      pageError: PageError
    }
  }
]);
```

2. Добавление точек монтирования в HTML разметку
```html
<router-view name="menu"></router-view>
<router-view name="page-one"></router-view>
<router-view name="page-two"></router-view>
<router-view name="page-error"></router-view>
```

3. Создание компонента
```javascript
let Menu = () => {
  return {
    template: `
    <ul
    style="
    margin-top: 40px;
    padding: 20px;
    background-color: #d4d4d4;
    ">
      <li style="display:inline-block; margin-right:50px;"><a href="/">Main</li>
      <li style="display:inline-block; margin-right:50px;"><a href="/about">About</li>
    </div>
    `
  };
};
```



## Методы

* [detectMountPlace](#detectMountPlace)
* [getComponents](#getComponents)
* [getDefaulRoute](#getDefaulRoute)
* [getLocation](#getLocation)
* [origin](#origin)
* [path](#path)
* [render](#render)
* [version](#version)




### detectMountPlace

Метод `Router.detectMountPlace()` проверяет наличие точек монтирования в HTML разметке. Проверка осуществляется автоматически. Если не заданы точки монтирования, то роутер выдаст предупреждение.



### getComponents

Геттер `Router.getComponents` возвращает объект с компонентами, соответствующими текущему пути. В компонентах возвращаются тела функций. Если не заданы пути, то роутер выдаст предупреждение.
```javascript
{
  components: {
    menu:    function,
    pageOne: function
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



### origin

Геттер `Router.origin` проксирует на `Router.getLocation.origin` и возвращает строку.



### path

Геттер `Router.path` проксирует на `Router.getLocation.path` и возвращает строку.



### render

Метод `Router.render()` перерендерит страницу. Рендеринг осуществляется автоматически.



### version

Геттер `Router.version` возвращает строку с версией роутера.