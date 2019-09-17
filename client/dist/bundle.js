webpackJsonp([0],[
/* 0 */,
/* 1 */,
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });

// CONCATENATED MODULE: ./app-src/util/ProxyFactory.js
let ProxyFactory = class ProxyFactory {

    static create(objeto, props, armadilha) {

        return new Proxy(objeto, {

            get(target, prop, receiver) {

                if (ProxyFactory._ehFuncao(target[prop]) && props.includes(prop)) {

                    return function () {

                        console.log(`"${prop}" disparou a armadilha`);
                        target[prop].apply(target, arguments);
                        armadilha(target);
                    };
                } else {

                    return target[prop];
                }
            },

            set(target, prop, value, receiver) {

                const updated = Reflect.set(target, prop, value);
                if (props.includes(prop)) armadilha(target);
                return updated;
            }

        });
    }

    static _ehFuncao(fn) {

        return typeof fn == typeof Function;
    }
};
// CONCATENATED MODULE: ./app-src/util/Bind.js


let Bind_Bind = class Bind {

    constructor(model, view, ...props) {

        const proxy = ProxyFactory.create(model, props, model => {
            view.update(model);
        });

        view.update(model);

        return proxy;
    }
};
// CONCATENATED MODULE: ./app-src/util/ConnectionFactory.js
const stores = ['negociacoes'];
let connection = null;
let close = null;

let ConnectionFactory = class ConnectionFactory {

    constructor() {

        throw new Error('Não é possível criar instâncias dessa classe');
    }

    static getConnection() {

        return new Promise((resolve, reject) => {

            if (connection) return resolve(connection);

            const openRequest = indexedDB.open('jscangaceiro', 2);

            openRequest.onupgradeneeded = e => {

                ConnectionFactory._createStores(e.target.result);
            };

            openRequest.onsuccess = e => {

                connection = e.target.result;

                close = connection.close.bind(connection);

                connection.close = () => {
                    throw new Error('Você não pode fechar diretamente a conexão');
                };

                resolve(e.target.result);
            };

            openRequest.onerror = e => {

                console.log(e.target.error);
                reject(e.target.error.name);
            };
        });
    }

    static _createStores(connection) {

        stores.forEach(store => {

            if (connection.objectStoreNames.contains(store)) connection.deleteObjectStore(store);

            connection.createObjectStore(store, { autoIncrement: true });
        });
    }

    static closeConnection() {

        if (connection) {
            close();
        }
    }
};
// CONCATENATED MODULE: ./app-src/domain/negociacao/NegociacaoDao.js


let NegociacaoDao_NegociacaoDao = class NegociacaoDao {

    constructor(connection) {

        this._connection = connection;
        this._store = 'negociacoes';
    }

    adiciona(negociacao) {

        return new Promise((resolve, reject) => {

            const request = this._connection.transaction([this._store], 'readwrite').objectStore(this._store).add(negociacao);

            request.onsuccess = e => resolve();
            request.onerror = e => {

                console.log(e.target.error);
                reject('Não foi possível salvar a negociação');
            };
        });
    }
    listaTodos() {

        return new Promise((resolve, reject) => {

            const negociacoes = [];

            const cursor = this._connection.transaction([this._store], 'readwrite').objectStore(this._store).openCursor();

            cursor.onsuccess = e => {

                const atual = e.target.result;

                if (atual) {

                    const negociacao = new Negociacao_Negociacao(atual.value._data, atual.value._quantidade, atual.value._valor);

                    negociacoes.push(negociacao);
                    atual.continue();
                } else {

                    resolve(negociacoes);
                }
            };

            cursor.onerror = e => {
                console.log(e.target.error);
                reject('Não foi possível listar nas negociações');
            };
        });
    }

    apagaTodos() {

        return new Promise((resolve, reject) => {

            const request = this._connection.transaction([this._store], 'readwrite').objectStore(this._store).clear();

            request.onsuccess = e => resolve();

            request.onerror = e => {
                console.log(e.target.error);
                reject('Não foi possível apagar as negociações');
            };
        });
    }
};
// CONCATENATED MODULE: ./app-src/util/DaoFactory.js
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }




let getNegociacaoDao = (() => {
    var _ref = _asyncToGenerator(function* () {

        let conn = yield ConnectionFactory.getConnection();
        return new NegociacaoDao_NegociacaoDao(conn);
    });

    return function getNegociacaoDao() {
        return _ref.apply(this, arguments);
    };
})();
// CONCATENATED MODULE: ./app-src/util/ApplicationException.js
let ApplicationException = class ApplicationException extends Error {

    constructor(msg = '') {

        super(msg);
        this.name = this.constructor.name;
    }
};

const exception = ApplicationException;

function isApplicationException(err) {

    return err instanceof exception || Object.getPrototypeOf(err) instanceof exception;
}

function getExceptionMessage(err) {

    if (isApplicationException(err)) {
        return err.message;
    } else {
        console.log(err);
        return 'Não foi possível realizar a operação.';
    }
}
// CONCATENATED MODULE: ./app-src/util/HttpService.js
let HttpService = class HttpService {

    _handleErrors(res) {

        if (!res.ok) throw new Error(res.statusText);
        return res;
    }

    get(url) {

        return fetch(url).then(res => this._handleErrors(res)).then(res => res.json());
    }
};
// CONCATENATED MODULE: ./app-src/util/decorators/Debounce.js
function debounce(milissegundos = 500) {

    return function (target, key, descriptor) {

        const metodoOriginal = descriptor.value;

        let timer = 0;

        descriptor.value = function (...args) {

            if (event) event.preventDefault();
            clearInterval(timer);
            timer = setTimeout(() => metodoOriginal.apply(this, args), milissegundos);
        };

        return descriptor;
    };
}
// CONCATENATED MODULE: ./app-src/util/decorators/Controller.js
function controller(...seletores) {

    const elements = seletores.map(seletor => document.querySelector(seletor));

    return function (constructor) {

        const constructorOriginal = constructor;

        const constructorNovo = function () {

            const instance = new constructorOriginal(...elements);
            Object.getOwnPropertyNames(constructorOriginal.prototype).forEach(property => {
                if (Reflect.hasMetadata('bindEvent', instance, property)) {

                    associaEvento(instance, Reflect.getMetadata('bindEvent', instance, property));
                }
            });
        };

        constructorNovo.prototype = constructorOriginal.prototype;

        return constructorNovo;
    };
}

function associaEvento(instance, metadado) {

    document.querySelector(metadado.selector).addEventListener(metadado.event, event => {
        if (metadado.prevent) event.preventDefault();
        instance[metadado.propertyKey](event);
    });
}
// CONCATENATED MODULE: ./app-src/util/Obrigatorio.js
function obrigatorio(parametro) {

    throw new Error(`${parametro} é um parâmetro obrigatório`);
}
// CONCATENATED MODULE: ./app-src/util/decorators/BindEvent.js


function bindEvent(event = obrigatorio('event'), selector = obrigatorio('selector'), prevent = true) {

    return function (target, propertyKey, descriptor) {

        Reflect.defineMetadata('bindEvent', { event, selector, prevent, propertyKey }, Object.getPrototypeOf(target), propertyKey);

        return descriptor;
    };
}
// CONCATENATED MODULE: ./app-src/util/index.js










// CONCATENATED MODULE: ./app-src/domain/negociacao/Negociacao.js


let Negociacao_Negociacao = class Negociacao {

    constructor(_data = obrigatorio('data'), _quantidade = obrigatorio('quantidade'), _valor = obrigatorio('valor')) {

        Object.assign(this, { _quantidade, _valor });
        this._data = new Date(_data.getTime());
        Object.freeze(this);
    }

    get volume() {

        return this._quantidade * this._valor;
    }

    get data() {

        return new Date(this._data.getTime());
    }

    get quantidade() {

        return this._quantidade;
    }

    get valor() {

        return this._valor;
    }

    equals(negociacao) {

        return JSON.stringify(this) == JSON.stringify(negociacao);
    }
};
// CONCATENATED MODULE: ./app-src/domain/negociacao/NegociacaoService.js
function NegociacaoService__asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }





let NegociacaoService_NegociacaoService = class NegociacaoService {

    constructor() {

        this._http = new HttpService();
    }

    obtemNegociacoesDaSemana() {

        return this._http.get('http://localhost:3000/negociacoes/semana').then(dados => dados.map(objeto => new Negociacao_Negociacao(new Date(objeto.data), objeto.quantidade, objeto.valor)), err => {

            throw new ApplicationException('Não foi possível obter as negociações da semana');
        });
    }

    obtemNegociacoesDaSemanaAnterior() {

        return this._http.get('http://localhost:3000/negociacoes/anterior').then(dados => dados.map(objeto => new Negociacao_Negociacao(new Date(objeto.data), objeto.quantidade, objeto.valor)), err => {

            throw new ApplicationException('Não foi possível obter as negociações da semana anterior');
        });
    }

    obtemNegociacoesDaSemanaRetrasada() {

        return this._http.get('http://localhost:3000/negociacoes/retrasada').then(dados => dados.map(objeto => new Negociacao_Negociacao(new Date(objeto.data), objeto.quantidade, objeto.valor)), err => {
            throw new ApplicationException('Não foi possível obter as negociações da semana retrasada');
        });
    }

    obtemNegociacoesDoPeriodo() {
        var _this = this;

        return NegociacaoService__asyncToGenerator(function* () {

            try {
                let periodo = yield Promise.all([_this.obtemNegociacoesDaSemana(), _this.obtemNegociacoesDaSemanaAnterior(), _this.obtemNegociacoesDaSemanaRetrasada()]);
                return periodo.reduce(function (novoArray, item) {
                    return novoArray.concat(item);
                }, []).sort(function (a, b) {
                    return b.data.getTime() - a.data.getTime();
                });
            } catch (err) {
                console.log(err);
                throw new ApplicationException('Não foi possível obter as negociações do período');
            };
        })();
    }
};
// CONCATENATED MODULE: ./app-src/domain/negociacao/Negociacoes.js
let Negociacoes = class Negociacoes {

    constructor() {

        this._negociacoes = [];
        Object.freeze(this);
    }

    adiciona(negociacao) {

        this._negociacoes.push(negociacao);
    }

    paraArray() {

        return [].concat(this._negociacoes);
    }

    get volumeTotal() {

        return this._negociacoes.reduce((total, negociacao) => total + negociacao.volume, 0);
    }

    esvazia() {

        this._negociacoes.length = 0;
    }
};
// CONCATENATED MODULE: ./app-src/domain/index.js




// CONCATENATED MODULE: ./app-src/ui/views/View.js
let View = class View {

    constructor(seletor) {

        this._elemento = document.querySelector(seletor);
    }

    update(model) {

        this._elemento.innerHTML = this.template(model);
    }

    template(model) {

        throw new Error('Você precisa implementar o método template');
    }
};
// CONCATENATED MODULE: ./app-src/ui/views/MensagemView.js


let MensagemView = class MensagemView extends View {

    template(model) {

        return model.texto ? `<p class="alert alert-info">${model.texto}</p>` : `<p></p>`;
    }
};
// CONCATENATED MODULE: ./app-src/ui/converters/DataInvalidaException.js


let DataInvalidaException = class DataInvalidaException extends ApplicationException {

    constructor() {

        super('A data deve estar no formato dd/mm/aaaa');
    }
};
// CONCATENATED MODULE: ./app-src/ui/converters/DateConverter.js


let DateConverter_DateConverter = class DateConverter {

    constructor() {

        throw new Error('Esta classe não pode ser instanciada');
    }

    static paraTexto(data) {

        return `${data.getDate()}/${data.getMonth() + 1}/${data.getFullYear()}`;
    }

    static paraData(texto) {

        if (!/\d{2}\/\d{2}\/\d{4}/.test(texto)) throw new DataInvalidaException();

        return new Date(...texto.split('/').reverse().map((item, indice) => item - indice % 2));
    }
};
// CONCATENATED MODULE: ./app-src/ui/views/NegociacoesView.js



let NegociacoesView_NegociacoesView = class NegociacoesView extends View {

    template(model) {

        return `
        <table class="table table-hover table-bordered">
            <thead>
                <tr>
                    <th>DATA</th>
                    <th>QUANTIDADE</th>
                    <th>VALOR</th>
                    <th>VOLUME</th>
                </tr>
            </thead>
            
            <tbody>
                ${model.paraArray().map(negociacao => `
                    <tr>
                        <td>${DateConverter_DateConverter.paraTexto(negociacao.data)}</td>
                        <td>${negociacao.quantidade}</td>
                        <td>${negociacao.valor}</td>
                        <td>${negociacao.volume}</td>
                    </tr>                        
                `).join('')}
            </tbody>
            
            <tfoot>
                <tr>
                    <td colspan="3"></td>
                    <td>${model.volumeTotal}</td>            
                </tr>
            </tfoot>
            
        </table>               
        `;
    }
};
// CONCATENATED MODULE: ./app-src/ui/models/Mensagem.js
let Mensagem = class Mensagem {

    constructor(texto = '') {

        this._texto = texto;
    }

    get texto() {

        return this._texto;
    }

    set texto(texto) {

        this._texto = texto;
    }
};
// CONCATENATED MODULE: ./app-src/ui/index.js






// CONCATENATED MODULE: ./app-src/controllers/NegociacaoController.js
var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _desc, _value, _class2;

function NegociacaoController__asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
        return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}





let NegociacaoController_NegociacaoController = (_dec = controller('#data', '#quantidade', '#valor'), _dec2 = bindEvent('submit', '.form'), _dec3 = debounce(), _dec4 = bindEvent('click', '#botao-importa'), _dec5 = debounce(), _dec6 = bindEvent('click', '#botao-apaga'), _dec(_class = (_class2 = class NegociacaoController {

    constructor(_inputData, _inputQuantidade, _inputValor) {

        Object.assign(this, { _inputData, _inputQuantidade, _inputValor });

        this._negociacoes = new Bind_Bind(new Negociacoes(), new NegociacoesView_NegociacoesView('#negociacoes'), 'adiciona', 'esvazia');

        this._mensagem = new Bind_Bind(new Mensagem(), new MensagemView('#mensagemView'), 'texto');

        this._service = new NegociacaoService_NegociacaoService();

        this._init();
    }

    _init() {
        var _this = this;

        return NegociacaoController__asyncToGenerator(function* () {

            try {
                const dao = yield getNegociacaoDao();
                const negociacoes = yield dao.listaTodos();
                negociacoes.forEach(function (negociacao) {
                    return _this._negociacoes.adiciona(negociacao);
                });
            } catch (err) {
                _this._mensagem.texto = getExceptionMessage(err);
            }
        })();
    }

    adiciona(event) {
        var _this2 = this;

        return NegociacaoController__asyncToGenerator(function* () {

            try {
                const negociacao = _this2._criaNegociacao();
                const dao = yield getNegociacaoDao();
                yield dao.adiciona(negociacao);
                _this2._negociacoes.adiciona(negociacao);
                _this2._mensagem.texto = 'Negociação adicionada com sucesso';
                _this2._limpaFormulario();
            } catch (err) {
                _this2._mensagem.texto = getExceptionMessage(err);
            }
        })();
    }

    _limpaFormulario() {

        this._inputData.value = '';
        this._inputQuantidade.value = 1;
        this._inputValor.value = 0.0;
        this._inputData.focus();
    }

    _criaNegociacao() {

        return new Negociacao_Negociacao(DateConverter_DateConverter.paraData(this._inputData.value), parseInt(this._inputQuantidade.value), parseFloat(this._inputValor.value));
    }

    importaNegociacoes() {
        var _this3 = this;

        return NegociacaoController__asyncToGenerator(function* () {

            try {
                const negociacoes = yield _this3._service.obtemNegociacoesDoPeriodo();
                console.log(negociacoes);
                negociacoes.filter(function (novaNegociacao) {
                    return !_this3._negociacoes.paraArray().some(function (negociacaoExistente) {
                        return novaNegociacao.equals(negociacaoExistente);
                    });
                }).forEach(function (negociacao) {
                    return _this3._negociacoes.adiciona(negociacao);
                });

                _this3._mensagem.texto = 'Negociações do período importadas com sucesso';
            } catch (err) {
                _this3._mensagem.texto = getExceptionMessage(err);
            }
        })();
    }

    apaga() {
        var _this4 = this;

        return NegociacaoController__asyncToGenerator(function* () {

            try {
                const dao = yield getNegociacaoDao();
                yield dao.apagaTodos();
                _this4._negociacoes.esvazia();
                _this4._mensagem.texto = 'Negociações apagadas com sucesso';
            } catch (err) {
                _this4._mensagem.texto = getExceptionMessage(err);
            }
        })();
    }
}, (_applyDecoratedDescriptor(_class2.prototype, 'adiciona', [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, 'adiciona'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'importaNegociacoes', [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, 'importaNegociacoes'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'apaga', [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, 'apaga'), _class2.prototype)), _class2)) || _class);
// CONCATENATED MODULE: ./app-src/app.js
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_bootstrap_dist_css_bootstrap_css__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_bootstrap_dist_css_bootstrap_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_bootstrap_dist_css_bootstrap_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_bootstrap_dist_css_bootstrap_theme_css__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_bootstrap_dist_css_bootstrap_theme_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_bootstrap_dist_css_bootstrap_theme_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_bootstrap_js_modal_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_bootstrap_js_modal_js___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_bootstrap_js_modal_js__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__css_meucss_css__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__css_meucss_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5__css_meucss_css__);








const app_controller = new NegociacaoController_NegociacaoController();
const app_negociacao = new Negociacao_Negociacao(new Date(), 1, 200);
const headers = new Headers();
headers.set('Content-Type', 'application/json');
const body = JSON.stringify(app_negociacao);
const method = 'POST';

const config = {
    method,
    headers,
    body
};

fetch('http://localhost:3000/negociacoes', config).then(() => console.log('Dado enviado com sucesso'));

/***/ }),
/* 3 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 4 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 5 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })
],[2]);