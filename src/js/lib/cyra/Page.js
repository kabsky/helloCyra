const Config = {  // 内部执行逻辑的基本配置
      URL_DATA_LIMIT: 1024,
      DEFAULT_ROOT: 'body',
      ENTER_SEQ: ['createElement', 'initialize', 'willAppear', 'appearing', 'didAppear'],
      LEAVE_SEQ: ['willDisappear', 'disappearing']
  };

// helpers
function sequence (seq, ctx) {
  let funs = seq.reverse();
  let noop = function () {};
  let start = funs.reduce(function (prev, curr) {
    return curr.bind(ctx, prev);
  }, noop);

  start();
}

function getHashData () {
    let hash = window.location.hash.slice(1);
    let hashData = hash.split('&&_data=');
    return hashData[1];
}


class Page {

  log (...args) {
    console.log.apply(console, ['Page::', this.id, ':'].concat(args));
  }

  constructor (obj) {

    this.id = obj.id;

    this.seq = obj.seq;

    this.methods = obj.methods;
    this.prepareActions = obj.prepareActions;

    // init
    this.data = {};

    this.log('constructed');

  }

  gotoPage (path, data, throughUrl) {
    this.log('gotoPage', path);
    if(throughUrl) {
      let dataString = JSON.stringify(data);
      if(dataString.length > Config.URL_DATA_LIMIT) {
        throw new Error('performAction data is too lage');
      }
      path += '&&_data=' + dataString;
    } else {
      this.ctx._transferData = data;
    }
    window.location.hash = path;
  }

  performAction (actionId, data) {
    let action = this.ctx.actions[actionId];
    if(action.fromPage !== this) throw new Error('the current page is not the action fromPage');

    let path = action.toPage.route.path;

    this.gotoPage(path, data, true);
  }

  callMethods (actions) {
    this.log('callMethods');
    let self = this;
    let func;
    actions.forEach((action) => {
      func = self.methods[action.methodName];
      if(func) func.call(self, action.data);
    })
  }

  execute (executeSeq) {
    let funs = [];
    for(let i = 0, len = executeSeq.length; i < len; i++) {
      let fun = this.seq[executeSeq[i]] || this[executeSeq[i]];
      if(fun) funs.push(fun);
    }
    sequence(funs, this);
  }

  entering (transData) {
    this.log('entering', transData);
    this.data.transData = getHashData() || transData;
    this.execute(Config.ENTER_SEQ);
  }

  leaving () {
    this.log('leaving');
    this.execute(Config.LEAVE_SEQ);
  }

  destroy () {
    this.log('destroy');
  }

  // default sequence function
  createElement (next) {
    this.log('createElement');
    let rootElement = this.ctx.rootElement;
    let el = rootElement.querySelector(this.id);
    if(!el) {
      el = document.createElement("div");
      el.id = this.id;
      el.style.display = 'none';
    }
    rootElement.appendChild(el);
    this.element = el;
    next();
  }

  appearing (next) {
    this.log('appearing');
    next();
  }

  disappearing (next) {
    this.log('disappearing');
    next();
  }


  // get route() {
  //   this.log('get route');
  //   return this._route;
  // }
  // set route(route) {
  //   this.log('set route');
  //   this._route = route;
  // }
  // getters and setters

  get ctx() {
    this.log('get ctx');
    return this._ctx;
  }
  set ctx(ctx) {
    this.log('set ctx');
    this._ctx = ctx;
  }

  get data() {
    this.log('get data');
    return this._data;
  }
  set data(data) {
    this.log('set data');
    this._data = data;
  }

  get element() {
    this.log('get element');
    return this._element;
  }
  set element(element) {
    this.log('set element');
    this._element = element;
  }

  get lastPage() {
    this.log('get lastPage');
    return this._lastPage;
  }
  set lastPage(lastPage) {
    this.log('set lastPage');
    this._lastPage = lastPage;
  }




}

export default Page;
